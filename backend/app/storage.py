"""
Simple JSON-based storage for the dashboard
"""
import json
import os
from pathlib import Path

STORAGE_FILE = "/home/user/GitRepos/social-media-dashboard/backend/data.json"

def load_data():
    """Load data from JSON file"""
    if os.path.exists(STORAGE_FILE):
        try:
            with open(STORAGE_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {
        "posts": [],
        "api_keys": {}
    }

def save_data(data):
    """Save data to JSON file"""
    os.makedirs(os.path.dirname(STORAGE_FILE), exist_ok=True)
    with open(STORAGE_FILE, 'w') as f:
        json.dump(data, f, indent=2)

# Initialize storage file
if not os.path.exists(STORAGE_FILE):
    save_data({"posts": [], "api_keys": {}})
