from pydantic import BaseModel, Field
from typing import List, Optional


class PostBase(BaseModel):
    title: Optional[str] = None
    page_name: Optional[str] = None
    page_url: Optional[str] = None
    body: str
    hashtags: Optional[List[str]] = None
    link_url: Optional[str] = None
    media_paths: Optional[List[str]] = None
    alt_texts: Optional[List[str]] = None
    scheduled_for: Optional[str] = None


class PostCreate(PostBase):
    pass


class PostUpdate(BaseModel):
    title: Optional[str] = None
    page_name: Optional[str] = None
    page_url: Optional[str] = None
    body: Optional[str] = None
    hashtags: Optional[List[str]] = None
    link_url: Optional[str] = None
    media_paths: Optional[List[str]] = None
    alt_texts: Optional[List[str]] = None
    scheduled_for: Optional[str] = None
    approved: Optional[bool] = None


class PostOut(PostBase):
    id: int
    approved: bool
    published: bool
    publish_status: str
    last_error: Optional[str] = None

    class Config:
        from_attributes = True


class PublishRequest(BaseModel):
    dry_run: bool = Field(default=False)
