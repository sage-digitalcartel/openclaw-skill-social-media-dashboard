"""
Social Media Dashboard API
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os

from .metricool import MetricoolClient, get_client
from .models import Post, PostCreate, PostResponse
from .database import get_db, posts_db

app = FastAPI(title="Social Media Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for API keys (use database in production)
api_keys_db = {}

class APIKeyCreate(BaseModel):
    name: str
    key: str

class ChannelResponse(BaseModel):
    id: str
    name: str
    network: str

class WorkspaceResponse(BaseModel):
    id: str
    name: str

def get_current_client(api_key: str = None) -> MetricoolClient:
    """Get Metricool client with provided or stored API key"""
    if not api_key:
        raise HTTPException(status_code=401, detail="API key required")
    return get_client(api_key)

@app.get("/")
def root():
    return {"message": "Social Media Dashboard API", "version": "2.0.0"}

# ============ API Key Management ============

@app.post("/api/keys", tags=["keys"])
def save_api_key(key_data: APIKeyCreate):
    """Save a Metricool API key"""
    api_keys_db[key_data.name] = key_data.key
    return {"message": "API key saved", "name": key_data.name}

@app.get("/api/keys", tags=["keys"])
def list_keys():
    """List saved API keys (names only)"""
    return {"keys": list(api_keys_db.keys())}

@app.delete("/api/keys/{name}", tags=["keys"])
def delete_key(name: str):
    """Delete an API key"""
    if name in api_keys_db:
        del api_keys_db[name]
        return {"message": "Key deleted"}
    raise HTTPException(status_code=404, detail="Key not found")

# ============ Metricool Integration ============

@app.get("/api/workspaces", tags=["metricool"])
def get_workspaces(api_key: str = Depends(get_current_client)):
    """Get all workspaces"""
    client = get_current_client(api_key)
    try:
        workspaces = client.get_workspaces()
        return {"workspaces": workspaces}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/workspaces/{workspace_id}/channels", tags=["metricool"])
def get_channels(workspace_id: str, api_key: str = Depends(get_current_client)):
    """Get all channels in a workspace"""
    client = get_current_client(api_key)
    try:
        channels = client.get_channels(workspace_id)
        return {"channels": channels}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============ Posts ============

@app.post("/api/posts", response_model=PostResponse, tags=["posts"])
def create_post(
    post: PostCreate,
    api_key: str = Depends(get_current_client)
):
    """Create a new post (stored locally for approval workflow)"""
    post_id = len(posts_db) + 1
    new_post = Post(
        id=post_id,
        content=post.content,
        hashtags=post.hashtags,
        media_urls=post.media_urls,
        channels=post.channels,
        scheduled_time=post.scheduled_time,
        status="pending",
        created_at=datetime.now().isoformat()
    )
    posts_db.append(new_post)
    return new_post

@app.get("/api/posts", tags=["posts"])
def list_posts(status: Optional[str] = None):
    """List all posts, optionally filtered by status"""
    if status:
        return {"posts": [p for p in posts_db if p.status == status]}
    return {"posts": posts_db}

@app.get("/api/posts/{post_id}", tags=["posts"])
def get_post(post_id: int):
    """Get a specific post"""
    for post in posts_db:
        if post.id == post_id:
            return post
    raise HTTPException(status_code=404, detail="Post not found")

@app.patch("/api/posts/{post_id}/approve", tags=["posts"])
def approve_post(post_id: int):
    """Approve a post"""
    for post in posts_db:
        if post.id == post_id:
            post.status = "approved"
            return {"message": "Post approved", "post": post}
    raise HTTPException(status_code=404, detail="Post not found")

@app.patch("/api/posts/{post_id}/reject", tags=["posts"])
def reject_post(post_id: int):
    """Reject a post"""
    for post in posts_db:
        if post.id == post_id:
            post.status = "rejected"
            return {"message": "Post rejected", "post": post}
    raise HTTPException(status_code=404, detail="Post not found")

@app.post("/api/posts/{post_id}/publish", tags=["posts"])
def publish_post(
    post_id: int,
    workspace_id: str,
    api_key: str = Depends(get_current_client)
):
    """Publish an approved post via Metricool"""
    # Find the post
    post = None
    for p in posts_db:
        if p.id == post_id:
            post = p
            break
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post.status != "approved":
        raise HTTPException(status_code=400, detail="Post must be approved before publishing")
    
    # Get Metricool client and publish
    client = get_current_client(api_key)
    
    try:
        result = client.create_post(
            workspace_id=workspace_id,
            content=post.content + "\n\n" + " ".join(post.hashtags) if post.hashtags else post.content,
            channel_ids=post.channels,
            scheduled_time=post.scheduled_time,
            media_urls=post.media_urls
        )
        
        post.status = "published"
        post.published_at = datetime.now().isoformat()
        
        return {
            "message": "Post published successfully",
            "post": post,
            "metricool_response": result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to publish: {str(e)}")

@app.delete("/api/posts/{post_id}", tags=["posts"])
def delete_post(post_id: int):
    """Delete a post"""
    global posts_db
    posts_db = [p for p in posts_db if p.id != post_id]
    return {"message": "Post deleted"}
