from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AISettings(Base):
    __tablename__ = "ai_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    provider = Column(String(100), nullable=False)
    api_key = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ResearchResult(Base):
    __tablename__ = "research_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    query = Column(Text, nullable=False)
    result = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ContentCalendar(Base):
    __tablename__ = "content_calendar"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    post_content = Column(Text, nullable=False)
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    platform = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
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
