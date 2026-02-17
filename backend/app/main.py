from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import json

from .database import SessionLocal, engine
from . import models, schemas
from .linkedin import build_config, render_post_text, validate_config, queue_publish, LinkedInSkillError

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="LinkedIn Post Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _serialize_list(value):
    return json.dumps(value) if value is not None else None


def _deserialize_list(value):
    return json.loads(value) if value else None


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/posts", response_model=List[schemas.PostOut])
def list_posts(db: Session = Depends(get_db)):
    posts = db.query(models.Post).order_by(models.Post.id.desc()).all()
    for post in posts:
        post.hashtags = _deserialize_list(post.hashtags)
        post.media_paths = _deserialize_list(post.media_paths)
        post.alt_texts = _deserialize_list(post.alt_texts)
    return posts


@app.post("/api/posts", response_model=schemas.PostOut)
def create_post(payload: schemas.PostCreate, db: Session = Depends(get_db)):
    post = models.Post(
        title=payload.title,
        page_name=payload.page_name,
        page_url=payload.page_url,
        body=payload.body,
        hashtags=_serialize_list(payload.hashtags),
        link_url=payload.link_url,
        media_paths=_serialize_list(payload.media_paths),
        alt_texts=_serialize_list(payload.alt_texts),
        scheduled_for=payload.scheduled_for,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    post.hashtags = payload.hashtags
    post.media_paths = payload.media_paths
    post.alt_texts = payload.alt_texts
    return post


@app.get("/api/posts/{post_id}", response_model=schemas.PostOut)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.hashtags = _deserialize_list(post.hashtags)
    post.media_paths = _deserialize_list(post.media_paths)
    post.alt_texts = _deserialize_list(post.alt_texts)
    return post


@app.put("/api/posts/{post_id}", response_model=schemas.PostOut)
def update_post(post_id: int, payload: schemas.PostUpdate, db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    data = payload.model_dump(exclude_unset=True)
    if "hashtags" in data:
        post.hashtags = _serialize_list(data.pop("hashtags"))
    if "media_paths" in data:
        post.media_paths = _serialize_list(data.pop("media_paths"))
    if "alt_texts" in data:
        post.alt_texts = _serialize_list(data.pop("alt_texts"))

    for key, value in data.items():
        setattr(post, key, value)

    db.commit()
    db.refresh(post)
    post.hashtags = _deserialize_list(post.hashtags)
    post.media_paths = _deserialize_list(post.media_paths)
    post.alt_texts = _deserialize_list(post.alt_texts)
    return post


@app.patch("/api/posts/{post_id}/approve", response_model=schemas.PostOut)
def approve_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.approved = True
    post.publish_status = "approved"
    db.commit()
    db.refresh(post)
    post.hashtags = _deserialize_list(post.hashtags)
    post.media_paths = _deserialize_list(post.media_paths)
    post.alt_texts = _deserialize_list(post.alt_texts)
    return post


@app.post("/api/posts/{post_id}/preview")
def preview_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post_dict = {
        "page_name": post.page_name,
        "page_url": post.page_url,
        "body": post.body,
        "hashtags": _deserialize_list(post.hashtags),
        "link_url": post.link_url,
        "media_paths": _deserialize_list(post.media_paths),
        "alt_texts": _deserialize_list(post.alt_texts),
        "scheduled_for": post.scheduled_for,
    }
    config = build_config(post_dict, dry_run=True)
    return {"rendered": render_post_text(config)}


@app.post("/api/posts/{post_id}/publish")
def publish_post(post_id: int, request: schemas.PublishRequest, db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if not post.approved:
        raise HTTPException(status_code=400, detail="Post must be approved before publishing")

    post_dict = {
        "page_name": post.page_name,
        "page_url": post.page_url,
        "body": post.body,
        "hashtags": _deserialize_list(post.hashtags),
        "link_url": post.link_url,
        "media_paths": _deserialize_list(post.media_paths),
        "alt_texts": _deserialize_list(post.alt_texts),
        "scheduled_for": post.scheduled_for,
    }

    try:
        config = build_config(post_dict, dry_run=request.dry_run)
        validate_config(config)
        outbox_path = queue_publish(config)
        post.publish_status = "queued" if not request.dry_run else "dry_run"
        post.last_error = None
        if not request.dry_run:
            post.published = True
    except LinkedInSkillError as exc:
        post.publish_status = "failed"
        post.last_error = str(exc)
        db.commit()
        raise HTTPException(status_code=400, detail=str(exc))

    db.commit()
    return {"status": post.publish_status, "outbox_path": outbox_path}
