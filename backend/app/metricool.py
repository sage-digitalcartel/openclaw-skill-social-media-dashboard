"""
Metricool API Client for Social Media Dashboard
"""

import os
import requests
from typing import Dict, List, Optional

METRICOOL_API_BASE = "https://api.metricool.com"

class MetricoolClient:
    """Client for interacting with Metricool API"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "X-Mc-Auth": api_key,
            "Content-Type": "application/json"
        }
    
    def get_workspaces(self) -> List[Dict]:
        """Get all workspaces/brands"""
        response = requests.get(
            f"{METRICOOL_API_BASE}/workspaces",
            headers=self.headers
        )
        return response.json().get("data", [])
    
    def get_channels(self, workspace_id: str) -> List[Dict]:
        """Get all social channels in a workspace"""
        response = requests.get(
            f"{METRICOOL_API_BASE}/workspaces/{workspace_id}/channels",
            headers=self.headers
        )
        return response.json().get("data", [])
    
    def create_post(
        self,
        workspace_id: str,
        content: str,
        channel_ids: List[str],
        scheduled_time: Optional[str] = None,
        media_urls: Optional[List[str]] = None
    ) -> Dict:
        """Create and optionally schedule a post"""
        
        post_data = {
            "content": content,
            "channels": channel_ids
        }
        
        if scheduled_time:
            post_data["scheduled_time"] = scheduled_time
        
        if media_urls:
            post_data["media"] = [{"url": url} for url in media_urls]
        
        response = requests.post(
            f"{METRICOOL_API_BASE}/workspaces/{workspace_id}/posts",
            headers=self.headers,
            json=post_data
        )
        
        return response.json()
    
    def get_posts(self, workspace_id: str, status: Optional[str] = None) -> List[Dict]:
        """Get posts for a workspace"""
        params = {}
        if status:
            params["status"] = status
            
        response = requests.get(
            f"{METRICOOL_API_BASE}/workspaces/{workspace_id}/posts",
            headers=self.headers,
            params=params
        )
        return response.json().get("data", [])
    
    def publish_post(self, workspace_id: str, post_id: str) -> Dict:
        """Publish a scheduled post immediately"""
        response = requests.post(
            f"{METRICOOL_API_BASE}/workspaces/{workspace_id}/posts/{post_id}/publish",
            headers=self.headers
        )
        return response.json()
    
    def delete_post(self, workspace_id: str, post_id: str) -> Dict:
        """Delete a post"""
        response = requests.delete(
            f"{METRICOOL_API_BASE}/workspaces/{workspace_id}/posts/{post_id}",
            headers=self.headers
        )
        return response.json()


def get_client(api_key: Optional[str] = None) -> MetricoolClient:
    """Get Metricool client instance"""
    if not api_key:
        api_key = os.environ.get("METRICOOL_API_KEY", "")
    return MetricoolClient(api_key)
