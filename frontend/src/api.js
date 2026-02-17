const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getPosts() {
  const res = await fetch(`${API_URL}/api/posts`);
  return res.json();
}

export async function createPost(payload) {
  const res = await fetch(`${API_URL}/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function updatePost(id, payload) {
  const res = await fetch(`${API_URL}/api/posts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function approvePost(id) {
  const res = await fetch(`${API_URL}/api/posts/${id}/approve`, { method: "PATCH" });
  return res.json();
}

export async function publishPost(id, dryRun = false) {
  const res = await fetch(`${API_URL}/api/posts/${id}/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dry_run: dryRun })
  });
  return res.json();
}

export async function previewPost(id) {
  const res = await fetch(`${API_URL}/api/posts/${id}/preview`, { method: "POST" });
  return res.json();
}
