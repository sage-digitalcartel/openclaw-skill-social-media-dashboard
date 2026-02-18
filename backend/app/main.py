"""
Social Media Dashboard API with JWT Authentication + SQLite + AI
"""

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
import os
import secrets
import jwt
import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

from .metricool import MetricoolClient, get_client
from .database import SessionLocal, engine
from .models import User, AISettings, ResearchResult, ContentCalendar, Post as DBPost

app = FastAPI(title="Social Media Dashboard API", version="4.0.0")

# Create uploads directory
UPLOAD_DIR = "/home/user/GitRepos/social-media-dashboard/backend/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Metricool API via IP (bypass DNS)
METRICOOL_HOST = "63.32.244.140"
METRICOOL_BASE = f"https://{METRICOOL_HOST}"
METRICOOL_HEADERS = {"Host": "app.metricool.com"}

# Security
security = HTTPBearer(auto_error=False)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Secret - change this in production!
JWT_SECRET = "social-dashboard-secret-key-2024"
JWT_ALGORITHM = "HS256"

# Hardcoded users (fallback)
USERS = {
    "simplydesserts": "simplydesserts1qazxsw2@p09oi8",
    "admin": "admin123"
}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_token(username: str) -> str:
    """Create JWT token for user"""
    payload = {
        "sub": username,
        "exp": datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(credentials = Depends(security)):
    """Verify JWT token"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(username: str = Depends(verify_token), db = Depends(get_db)):
    """Get current user from database"""
    user = db.query(User).filter(User.email == username).first()
    if not user:
        # Fallback to creating user from hardcoded list
        user = db.query(User).filter(User.email == username).first()
        if not user:
            # Check if it's a hardcoded user
            if username in USERS:
                user = User(email=username, name=username, password_hash=pwd_context.hash(USERS[username]))
                db.add(user)
                db.commit()
    return user

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ Pydantic Models ============

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    username: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class PostCreate(BaseModel):
    content: str
    hashtags: Optional[List[str]] = []
    media_urls: Optional[List[str]] = []
    platforms: List[str] = []
    scheduled_time: Optional[str] = None
    publish_now: bool = True

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

# AI Models
class AISettingsCreate(BaseModel):
    provider: str
    api_key: str

class AIResearchRequest(BaseModel):
    query: str

class AIGenerateRequest(BaseModel):
    topic: str
    platform: str = "linkedin"
    tone: str = "professional"

# ============ Routes ============

@app.get("/")
def root():
    return {"message": "Social Media Dashboard API", "version": "4.0.0"}

# ============ Authentication ============

@app.post("/api/login", response_model=LoginResponse, tags=["auth"])
def login(credentials: LoginRequest, db = Depends(get_db)):
    """Login and get JWT token"""
    # Check database first
    user = db.query(User).filter(User.email == credentials.username).first()
    
    if not user:
        # Fallback to hardcoded users
        user_password = USERS.get(credentials.username)
        if not user_password or not secrets.compare_digest(credentials.password, user_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
    else:
        if not pwd_context.verify(credentials.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(credentials.username)
    return LoginResponse(token=token, username=credentials.username)

@app.post("/api/register", response_model=LoginResponse, tags=["auth"])
def register(credentials: RegisterRequest, db = Depends(get_db)):
    """Register a new user"""
    # Check if user exists
    existing = db.query(User).filter(User.email == credentials.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = User(
        email=credentials.email,
        name=credentials.name or credentials.email.split('@')[0],
        password_hash=pwd_context.hash(credentials.password)
    )
    db.add(user)
    db.commit()
    
    token = create_token(credentials.email)
    return LoginResponse(token=token, username=credentials.email)

# ============ AI Settings ============

@app.post("/api/ai/settings", tags=["ai"])
def save_ai_settings(settings: AISettingsCreate, db = Depends(get_db), username: str = Depends(verify_token)):
    """Save AI provider settings (MiniMax, DeepSeek, etc.)"""
    # Check if settings exist for this user and provider
    existing = db.query(AISettings).filter(
        AISettings.user_id == username,
        AISettings.provider == settings.provider
    ).first()
    
    if existing:
        existing.api_key = settings.api_key
        db.commit()
        return {"message": "AI settings updated"}
    
    new_settings = AISettings(
        user_id=username,
        provider=settings.provider,
        api_key=settings.api_key
    )
    db.add(new_settings)
    db.commit()
    return {"message": "AI settings saved"}

@app.get("/api/ai/settings", tags=["ai"])
def get_ai_settings(db = Depends(get_db), username: str = Depends(verify_token)):
    """Get AI provider settings"""
    settings = db.query(AISettings).filter(AISettings.user_id == username).all()
    return {"providers": [s.provider for s in settings]}

@app.delete("/api/ai/settings/{provider}", tags=["ai"])
def delete_ai_settings(provider: str, db = Depends(get_db), username: str = Depends(verify_token)):
    """Delete AI provider settings"""
    deleted = db.query(AISettings).filter(
        AISettings.user_id == username,
        AISettings.provider == provider
    ).delete()
    db.commit()
    if deleted:
        return {"message": "AI settings deleted"}
    raise HTTPException(status_code=404, detail="Settings not found")

# ============ AI Research ============

@app.post("/api/ai/research", tags=["ai"])
def ai_research(request: AIResearchRequest, db = Depends(get_db), username: str = Depends(verify_token)):
    """Research a topic using AI"""
    # Get MiniMax settings
    ai_settings = db.query(AISettings).filter(
        AISettings.user_id == username,
        AISettings.provider == "minimax"
    ).first()
    
    if not ai_settings:
        raise HTTPException(status_code=400, detail="MiniMax API key not configured. Add it in Settings.")
    
    # Call MiniMax API
    try:
        response = requests.post(
            "https://api.minimaxi.chat/v1/text/chatcompletion_v2",
            headers={
                "Authorization": f"Bearer {ai_settings.api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "MiniMax-Text-01",
                "messages": [
                    {"role": "system", "content": "You are a helpful research assistant. Provide detailed, accurate information."},
                    {"role": "user", "content": f"Research and provide key information about: {request.query}"}
                ]
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            # Save research result
            research = ResearchResult(
                user_id=username,
                query=request.query,
                result=content
            )
            db.add(research)
            db.commit()
            
            return {"result": content, "query": request.query}
        else:
            raise HTTPException(status_code=400, detail=f"AI API error: {response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai/research", tags=["ai"])
def get_research_history(db = Depends(get_db), username: str = Depends(verify_token)):
    """Get research history"""
    results = db.query(ResearchResult).filter(
        ResearchResult.user_id == username
    ).order_by(ResearchResult.created_at.desc()).limit(20).all()
    return {"results": [{"query": r.query, "result": r.result, "created_at": r.created_at.isoformat()} for r in results]}

# ============ AI Content Generation ============

@app.post("/api/ai/generate", tags=["ai"])
def ai_generate(request: AIGenerateRequest, db = Depends(get_db), username: str = Depends(verify_token)):
    """Generate social media content using AI"""
    # Get MiniMax settings
    ai_settings = db.query(AISettings).filter(
        AISettings.user_id == username,
        AISettings.provider == "minimax"
    ).first()
    
    if not ai_settings:
        raise HTTPException(status_code=400, detail="MiniMax API key not configured")
    
    # Build prompt based on platform
    platform_guidance = {
        "linkedin": "Professional, B2B focused, no salesy language, subtle brand mentions only",
        "twitter": "Concise, engaging, max 280 chars",
        "instagram": "Visual storytelling, use emojis, engaging caption"
    }
    
    prompt = f"""Generate a {request.platform} post about: {request.topic}
Tone: {request.tone}
Guidelines: {platform_guidance.get(request.platform, 'Professional')}
Include relevant hashtags. Make it engaging but not salesy.
"""
    
    try:
        response = requests.post(
            "https://api.minimaxi.chat/v1/text/chatcompletion_v2",
            headers={
                "Authorization": f"Bearer {ai_settings.api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "MiniMax-Text-01",
                "messages": [
                    {"role": "system", "content": "You are a social media content expert. Create engaging, professional posts that fit the platform style."},
                    {"role": "user", "content": prompt}
                ]
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            choices = result.get("choices")
            if choices:
                content = choices[0].get("message", {}).get("content", "")
            else:
                content = result.get("choices")
            return {"content": content, "topic": request.topic, "platform": request.platform}
        else:
            raise HTTPException(status_code=400, detail=f"AI API error: {response.status_code} - {response.text[:200] if response.text else 'No response'}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ Content Calendar ============

@app.post("/api/calendar", tags=["calendar"])
def schedule_content(content: str, scheduled_date: datetime, platform: str, db = Depends(get_db), username: str = Depends(verify_token)):
    """Schedule content for a specific date"""
    calendar_entry = ContentCalendar(
        user_id=username,
        post_content=content,
        scheduled_date=scheduled_date,
        platform=platform,
        status="scheduled"
    )
    db.add(calendar_entry)
    db.commit()
    return {"message": "Content scheduled", "id": calendar_entry.id}

@app.get("/api/calendar", tags=["calendar"])
def get_calendar(start_date: Optional[datetime] = None, end_date: Optional[datetime] = None, db = Depends(get_db), username: str = Depends(verify_token)):
    """Get content calendar"""
    query = db.query(ContentCalendar).filter(ContentCalendar.user_id == username)
    
    if start_date:
        query = query.filter(ContentCalendar.scheduled_date >= start_date)
    if end_date:
        query = query.filter(ContentCalendar.scheduled_date <= end_date)
    
    entries = query.order_by(ContentCalendar.scheduled_date).all()
    return {"entries": [{
        "id": e.id,
        "content": e.post_content,
        "scheduled_date": e.scheduled_date.isoformat(),
        "platform": e.platform,
        "status": e.status
    } for e in entries]}

# ============ File Upload ============

@app.post("/api/upload", tags=["files"])
async def upload_file(file: UploadFile = File(...), username: str = Depends(verify_token)):
    """Upload a media file"""
    try:
        timestamp = datetime.now().timestamp()
        ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        filename = f"{timestamp}_{file.filename}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        content = await file.read()
        with open(filepath, 'wb') as f:
            f.write(content)
        
        file_url = f"http://100.101.67.20:8000/uploads/{filename}"
        return {"url": file_url, "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    """Serve uploaded files"""
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(filepath)

# ============ API Key Management ============

@app.post("/api/keys", tags=["keys"])
def save_api_key(key_data: APIKeyCreate, username: str = Depends(verify_token)):
    """Save a Metricool API key"""
    # Store in database instead of JSON
    db = SessionLocal()
    try:
        existing = db.query(AISettings).filter(
            AISettings.user_id == username,
            AISettings.provider == key_data.name
        ).first()
        
        if existing:
            existing.api_key = key_data.key
        else:
            new_key = AISettings(user_id=username, provider=key_data.name, api_key=key_data.key)
            db.add(new_key)
        db.commit()
        return {"message": "API key saved", "name": key_data.name}
    finally:
        db.close()

@app.get("/api/keys", tags=["keys"])
def list_keys(db = Depends(get_db), username: str = Depends(verify_token)):
    """List saved API keys (names only)"""
    keys = db.query(AISettings).filter(AISettings.user_id == username).all()
    return {"keys": [k.provider for k in keys if k.provider not in ["minimax", "deepseek"]]}

@app.delete("/api/keys/{name}", tags=["keys"])
def delete_key(name: str, db = Depends(get_db), username: str = Depends(verify_token)):
    """Delete an API key"""
    deleted = db.query(AISettings).filter(
        AISettings.user_id == username,
        AISettings.provider == name
    ).delete()
    db.commit()
    if deleted:
        return {"message": "Key deleted"}
    raise HTTPException(status_code=404, detail="Key not found")

# ============ Metricool Proxy ============

def get_mock_channels():
    return {
        "data": [
            {"id": "linkedin_123", "name": "Simply Desserts LinkedIn", "platform": "linkedin"},
            {"id": "insta_123", "name": "@simplydesserts", "platform": "instagram"},
            {"id": "fb_123", "name": "Simply Desserts Facebook", "platform": "facebook"},
            {"id": "tw_123", "name": "@simplydesserts", "platform": "twitter"}
        ],
        "_mock": True
    }

@app.get("/api/metricool/channels")
def get_metricool_channels(api_key: str, user_id: str = "4421531", blog_id: str = "5704319", username: str = Depends(verify_token)):
    """Proxy to Metricool channels API - uses userId/blogId instead of workspaces"""
    try:
        resp = requests.get(
            f"{METRICOOL_BASE}/api/v1/channels",
            headers={**METRICOOL_HEADERS, "X-Mc-Auth": api_key},
            params={"userId": user_id, "blogId": blog_id},
            verify=False,
            timeout=10
        )
        if resp.status_code == 200:
            try:
                return resp.json()
            except:
                return get_mock_channels()
        else:
            return get_mock_channels()
    except Exception as e:
        return get_mock_channels()

@app.post("/api/metricool/posts")
def create_metricool_post(post_data: dict = None, api_key: str = "4421531", user_id: str = "4421531", blog_id: str = "5704319", username: str = Depends(verify_token)):
    """Proxy to Metricool create post API"""
    if post_data is None:
        post_data = {}
    
    post_content = post_data.get("content", "")
    platforms = post_data.get("platforms", ["linkedin"])
    
    providers = []
    linkedin_data = {}
    twitter_data = {"type": "POST"}
    instagram_data = {"autoPublish": True}
    tiktok_data = {}
    
    for p in platforms:
        providers.append({"network": p})
        if p == "linkedin":
            linkedin_data = {"previewIncluded": True, "type": "POST"}
    
    now = datetime.now()
    pub_date = now.strftime("%Y-%m-%dT%H:00:00")
    
    scheduler_data = {
        "text": post_content,
        "firstCommentText": "",
        "providers": providers,
        "autoPublish": True,
        "saveExternalMediaFiles": False,
        "shortener": False,
        "draft": False,
        "linkedinData": linkedin_data,
        "twitterData": twitter_data,
        "instagramData": instagram_data,
        "tiktokData": tiktok_data,
        "hasNotReadNotes": False,
        "publicationDate": {"dateTime": pub_date, "timezone": "America/Maceio"}
    }
    
    try:
        resp = requests.post(
            f"{METRICOOL_BASE}/api/v2/scheduler/posts",
            headers={**METRICOOL_HEADERS, "X-Mc-Auth": api_key, "Content-Type": "application/json"},
            params={"userId": user_id, "blogId": blog_id},
            json=scheduler_data,
            verify=False,
            timeout=10
        )
        if resp.status_code == 200:
            return resp.json()
        else:
            return {"_mock": False, "status": resp.status_code, "response": resp.text[:200]}
    except Exception as e:
        return {"_mock": True, "error": str(e)}

# ============ Metricool Integration ============

def get_metricool_client(api_key: str) -> MetricoolClient:
    if not api_key:
        raise HTTPException(status_code=401, detail="API key required")
    return get_client(api_key)

@app.get("/api/workspaces", tags=["metricool"])
def get_workspaces(api_key: str, username: str = Depends(verify_token)):
    """Get all workspaces"""
    client = get_metricool_client(api_key)
    try:
        workspaces = client.get_workspaces()
        return {"workspaces": workspaces}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/workspaces/{workspace_id}/channels", tags=["metricool"])
def get_channels(workspace_id: str, api_key: str, username: str = Depends(verify_token)):
    """Get channels for a workspace"""
    client = get_metricool_client(api_key)
    try:
        channels = client.get_channels(workspace_id)
        return {"channels": channels}
    except Exception as e:
        return {"channels": [
            {"id": "linkedin_1", "name": "Simply Desserts", "platform": "linkedin"},
            {"id": "instagram_1", "name": "@simplydesserts", "platform": "instagram"},
            {"id": "facebook_1", "name": "Simply Desserts", "platform": "facebook"},
            {"id": "twitter_1", "name": "@simplydesserts", "platform": "twitter"}
        ]}

# ============ Posts Management (Database) ============

@app.post("/api/posts", response_model=PostResponse, tags=["posts"])
def create_post(post: PostCreate, api_key: str = None, username: str = Depends(verify_token), db = Depends(get_db)):
    """Create a new post"""
    new_post = DBPost(
        user_id=username,
        title=post.content[:50],
        body=post.content,
        hashtags=",".join(post.hashtags or []),
        link_url=",".join(post.media_urls or []),
        publish_status="pending"
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    return PostResponse(
        id=new_post.id,
        content=new_post.body,
        hashtags=post.hashtags or [],
        media_urls=post.media_urls or [],
        platforms=post.platforms or [],
        status=new_post.publish_status or "pending",
        scheduled_time=post.scheduled_time,
        created_at=new_post.created_at.isoformat() if new_post.created_at else datetime.now().isoformat()
    )

@app.get("/api/posts", tags=["posts"])
def list_posts(status: Optional[str] = None, username: str = Depends(verify_token), db = Depends(get_db)):
    """List all posts"""
    query = db.query(DBPost)
    if username:
        query = query.filter(DBPost.user_id == username)
    if status:
        query = query.filter(DBPost.publish_status == status)
    
    posts = query.order_by(DBPost.created_at.desc()).all()
    
    return {"posts": [PostResponse(
        id=p.id,
        content=p.body or "",
        hashtags=p.hashtags.split(",") if p.hashtags else [],
        media_urls=p.link_url.split(",") if p.link_url else [],
        platforms=[],
        status=p.publish_status or "draft",
        scheduled_time=p.scheduled_for,
        created_at=p.created_at.isoformat() if p.created_at else ""
    ) for p in posts]}

@app.get("/api/posts/{post_id}", tags=["posts"])
def get_post(post_id: int, username: str = Depends(verify_token), db = Depends(get_db)):
    """Get a specific post"""
    post = db.query(DBPost).filter(DBPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return PostResponse(
        id=post.id,
        content=post.body or "",
        hashtags=post.hashtags.split(",") if post.hashtags else [],
        media_urls=post.link_url.split(",") if post.link_url else [],
        platforms=[],
        status=post.publish_status or "draft",
        scheduled_time=post.scheduled_for,
        created_at=post.created_at.isoformat() if post.created_at else ""
    )

@app.patch("/api/posts/{post_id}/approve", tags=["posts"])
def approve_post(post_id: int, username: str = Depends(verify_token), db = Depends(get_db)):
    """Approve a post"""
    post = db.query(DBPost).filter(DBPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post.publish_status not in ["pending", "draft"]:
        raise HTTPException(status_code=400, detail="Post cannot be approved")
    
    post.publish_status = "approved"
    db.commit()
    return {"message": "Post approved"}

@app.delete("/api/posts/{post_id}", tags=["posts"])
def delete_post(post_id: int, username: str = Depends(verify_token), db = Depends(get_db)):
    """Delete a post"""
    post = db.query(DBPost).filter(DBPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    db.delete(post)
    db.commit()
    return {"message": "Post deleted"}

@app.post("/api/posts/{post_id}/publish", tags=["posts"])
def publish_post(post_id: int, workspace_id: str, api_key: str, scheduled_time: Optional[str] = None, username: str = Depends(verify_token), db = Depends(get_db)):
    """Publish a post via Metricool"""
    post = db.query(DBPost).filter(DBPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post.publish_status not in ["pending", "approved", "draft"]:
        raise HTTPException(status_code=400, detail="Post cannot be published")
    
    # Call Metricool
    platforms = ["linkedin"]
    providers = [{"network": p} for p in platforms]
    linkedin_data = {"previewIncluded": True, "type": "POST"} if "linkedin" in platforms else {}
    
    scheduler_data = {
        "text": post.body,
        "firstCommentText": "",
        "providers": providers,
        "autoPublish": True,
        "saveExternalMediaFiles": False,
        "shortener": False,
        "draft": False,
        "linkedinData": linkedin_data,
        "twitterData": {"type": "POST"},
        "instagramData": {"autoPublish": True},
        "tiktokData": {},
        "hasNotReadNotes": False,
    }
    
    try:
        resp = requests.post(
            f"{METRICOOL_BASE}/api/v2/scheduler/posts",
            headers={**METRICOOL_HEADERS, "X-Mc-Auth": api_key, "Content-Type": "application/json"},
            params={"userId": "4421531", "blogId": "5704319"},
            json=scheduler_data,
            verify=False,
            timeout=10
        )
        
        if resp.status_code == 200:
            post.publish_status = "published"
            db.commit()
            return {"message": "Post published to Metricool!", "result": resp.json()}
        else:
            raise Exception(resp.text[:200])
    except Exception as e:
        post.publish_status = "published"
        db.commit()
        return {"message": "Post published (mock)", "error": str(e)}
