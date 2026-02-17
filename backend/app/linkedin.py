import json
import os
import subprocess
from typing import Dict, Any
from datetime import datetime

SKILL_PATH = os.getenv(
    "LINKEDIN_SKILL_PATH",
    "/home/user/GitRepos/openclaw-skill-linkedin-auto-poster",
)
VALIDATE_SCRIPT = os.path.join(SKILL_PATH, "scripts", "validate_config.py")
OUTBOX_DIR = os.getenv(
    "LINKEDIN_OUTBOX",
    "/home/user/GitRepos/linkedin-dashboard/backend/outbox",
)


class LinkedInSkillError(Exception):
    pass


def render_post_text(config: Dict[str, Any]) -> str:
    parts = [config["post_text"].strip()]
    link_url = config.get("link_url")
    if link_url:
        parts.append("")
        parts.append(link_url.strip())
    hashtags = config.get("hashtags") or []
    if hashtags:
        parts.append("")
        parts.append(" ".join(tag.strip() for tag in hashtags if tag.strip()))
    return "\n".join(parts).strip() + "\n"


def build_config(post: Dict[str, Any], dry_run: bool = False) -> Dict[str, Any]:
    config = {
        "page_name": post.get("page_name"),
        "page_url": post.get("page_url"),
        "post_text": post["body"],
        "hashtags": post.get("hashtags") or [],
        "link_url": post.get("link_url"),
        "media_paths": post.get("media_paths") or [],
        "alt_texts": post.get("alt_texts") or [],
        "schedule": post.get("scheduled_for"),
        "dry_run": dry_run,
    }
    # remove empty keys to satisfy validator
    config = {k: v for k, v in config.items() if v not in (None, "")}
    return config


def validate_config(config: Dict[str, Any]) -> None:
    if not os.path.exists(VALIDATE_SCRIPT):
        raise LinkedInSkillError(f"validate_config.py not found at {VALIDATE_SCRIPT}")
    os.makedirs(OUTBOX_DIR, exist_ok=True)
    temp_path = os.path.join(OUTBOX_DIR, "_temp_validation.json")
    with open(temp_path, "w", encoding="utf-8") as handle:
        json.dump(config, handle, indent=2)
    result = subprocess.run(
        ["python3", VALIDATE_SCRIPT, temp_path],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise LinkedInSkillError(result.stdout.strip() or result.stderr.strip())


def queue_publish(config: Dict[str, Any]) -> str:
    os.makedirs(OUTBOX_DIR, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    filename = f"post_{timestamp}.json"
    path = os.path.join(OUTBOX_DIR, filename)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(config, handle, indent=2)
    return path
