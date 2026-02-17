from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from .database import Base


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=True)
    page_name = Column(String(255), nullable=True)
    page_url = Column(String(512), nullable=True)
    body = Column(Text, nullable=False)
    hashtags = Column(Text, nullable=True)  # JSON string
    link_url = Column(String(512), nullable=True)
    media_paths = Column(Text, nullable=True)  # JSON string list
    alt_texts = Column(Text, nullable=True)  # JSON string list
    scheduled_for = Column(String(64), nullable=True)
    approved = Column(Boolean, default=False)
    published = Column(Boolean, default=False)
    publish_status = Column(String(64), default="draft")
    last_error = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
