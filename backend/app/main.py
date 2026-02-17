"""
Social Media Dashboard API with Authentication
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
import secrets

from .metricool import MetricoolClient, get_client

app = FastAPI(title="Social Media Dashboard API", version="2.0.0")

# Security
security = HTTPBasic()

# Hardcoded users - add more as needed
USERS = {
    "simplydesserts": "simplyDesserts1Qazxsw2@p09oi8",
    "admin": "admin123"  # backup
}

def verify_credentials(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify username and password"""
    correct_username = secrets.compare_digest(credentials.username, "")
    correct_password = secrets.compare_digest(credentials.password, "")
    
    user_password = USERS.get(credentials.username)
    if not user_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not secrets.compare_digest(credentials.password, user_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return credentials.username

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
posts_db = []
api_keys_db = {}

# ============ Pydantic Models ============

class PostCreate(BaseModel):
    content: str
    hashtags: Optional[List[str]] = []
    media_urls: Optional[List[str]] = []
    platforms: List[str] = []
    scheduled_time: Optional[str] = None

class PostResponse(BaseModel):
    id: int
    content: str
    hashtags: List[str]
    media_urls: List[str]
    platforms: List[str]
    status: str
    scheduled_time: Optional[str]
    created_at: str
    published_at: Optional[str] = None

class APIKeyCreate(BaseModel):
    name: str
    key: str

# ============ Routes ============

@app.get("/")
def root():
    return {"message": "Social Media Dashboard API", "version": "2.0.0"}

# ============ API Key Management ============

@app.post("/api/keys", tags=["keys"])
def save_api_key(key_data: APIKeyCreate, username: str = Depends(verify_credentials)):
    """Save a Metricool API key"""
    api_keys_db[key_data.name] = key_data.key
    return {"message": "API key saved", "name": key_data.name}

@app.get("/api/keys", tags=["keys"])
def list_keys(username: str = Depends(verify_credentials)):
    """List saved API keys (names only)"""
    return {"keys": list(api_keys_db.keys())}

@app.delete("/api/keys/{name}", tags=["keys"])
def delete_key(name: str, username: str = Depends(verify_credentials)):
    """Delete an API key"""
    if name in api_keys_db:
        del api_keys_db[name]
        return {"message": "Key deleted"}
    raise HTTPException(status_code=404, detail="Key not found")

# ============ Metricool Integration ============

def get_metricool_client(api_key: str) -> MetricoolClient:
    if not api_key:
        raise HTTPException(status_code=401, detail="API key required")
    return get_client(api_key)

@app.get("/api/workspaces", tags=["metricool"])
def get_workspaces(api_key: str, username: str = Depends(verify_credentials)):
    """Get all workspaces"""
    client = get_metricool_client(api_key)
    try:
        workspaces = client.get_workspaces()
        return {"workspaces": workspaces}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/workspaces/{workspace_id}/channels", tags=["metricool"])
def get_channels(workspace_id: str, api_key: str, username: str = Depends(verify_credentials)):
    """Get all channels in a workspace"""
    client = get_metricool_client(api_key)
    try:
        channels = client.get_channels(workspace_id)
        return {"channels": channels}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============ Posts ============

@app.post("/api/posts", response_model=PostResponse, tags=["posts"])
def create_post(post: PostCreate, api_key: str = None, username: str = Depends(verify_credentials)):
    """Create a new post"""
    post_id = len(posts_db) + 1
    new_post = PostResponse(
        id=post_id,
        content=post.content,
        hashtags=post.hashtags or [],
        media_urls=post.media_urls or [],
        platforms=post.platforms or [],
        status="pending",
        scheduled_time=post.scheduled_time,
        created_at=datetime.now().isoformat()
    )
    posts_db.append(new_post)
    return new_post

@app.get("/api/posts", tags=["posts"])
def list_posts(status: Optional[str] = None, username: str = Depends(verify_credentials)):
    """List all posts"""
    if status:
        return {"posts": [p for p in posts_db if p.status == status]}
    return {"posts": posts_db}

@app.get("/api/posts/{post_id}", tags=["posts"])
def get_post(post_id: int, username: str = Depends(verify_credentials)):
    """Get a specific post"""
    for post in posts_db:
        if post.id == post_id:
            return post
    raise HTTPException(status_code=404, detail="Post not found")

@app.patch("/api/posts/{post_id}/approve", tags=["posts"])
def approve_post(post_id: int, username: str = Depends(verify_credentials)):
    """Approve a post"""
    for post in posts_db:
        if post.id == post_id:
            post.status = "approved"
            return {"message": "Post approved", "post": post}
    raise HTTPException(status_code=404, detail="Post not found")

@app.patch("/api/posts/{post_id}/reject", tags=["posts"])
def reject_post(post_id: int, username: str = Depends(verify_credentials)):
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
    api_key: str,
    username: str = Depends(verify_credentials)
):
    """Publish an approved post via Metricool"""
    post = None
    for p in posts_db:
        if p.id == post_id:
            post = p
            break
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post.status != "approved":
        raise HTTPException(status_code=400, detail="Post must be approved before publishing")
    
    client = get_metricool_client(api_key)
    
    try:
        content = post.content
        if post.hashtags:
            content += "\n\n" + " ".join(post.hashtags)
        
        result = client.create_post(
            workspace_id=workspace_id,
            content=content,
            channel_ids=post.channels,
            scheduled_time=post.scheduled_time,
            media_urls=post.media_urls if post.media_urls else None
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
def delete_post(post_id: int, username: str = Depends(verify_credentials)):
    """Delete a post"""
    global posts_db
    posts_db = [p for p in posts_db if p.id != post_id]
    return {"message": "Post deleted"}
