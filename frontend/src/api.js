const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function authHeader(token) {
  return { 'Authorization': 'Bearer ' + token };
}

// ============ Auth ============
export async function login(username, password, token) {
  const res = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function register(email, password, name, token) {
  const res = await fetch(`${API_URL}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name })
  });
  return res.json();
}

// ============ Posts ============
export async function getPosts(token) {
  const res = await fetch(`${API_URL}/api/posts`, { headers: authHeader(token) });
  return res.json();
}

export async function createPost(payload, token) {
  const res = await fetch(`${API_URL}/api/posts`, {
    method: "POST",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function approvePost(id, token) {
  const res = await fetch(`${API_URL}/api/posts/${id}/approve`, {
    method: "PATCH",
    headers: authHeader(token)
  });
  return res.json();
}

export async function publishPost(id, apiKey, workspaceId, token) {
  const res = await fetch(`${API_URL}/api/posts/${id}/publish?api_key=${apiKey}&workspace_id=${workspaceId}`, {
    method: "POST",
    headers: authHeader(token)
  });
  return res.json();
}

export async function deletePost(id, token) {
  const res = await fetch(`${API_URL}/api/posts/${id}`, {
    method: "DELETE",
    headers: authHeader(token)
  });
  return res.json();
}

// ============ API Keys ============
export async function getApiKeys(token) {
  const res = await fetch(`${API_URL}/api/keys`, { headers: authHeader(token) });
  return res.json();
}

export async function saveApiKey(name, key, token) {
  const res = await fetch(`${API_URL}/api/keys`, {
    method: "POST",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify({ name, key })
  });
  return res.json();
}

export async function deleteApiKey(name, token) {
  const res = await fetch(`${API_URL}/api/keys/${name}`, {
    method: "DELETE",
    headers: authHeader(token)
  });
  return res.json();
}

// ============ AI Settings ============
export async function getAISettings(token) {
  const res = await fetch(`${API_URL}/api/ai/settings`, { headers: authHeader(token) });
  return res.json();
}

export async function saveAISettings(provider, apiKey, token) {
  const res = await fetch(`${API_URL}/api/ai/settings`, {
    method: "POST",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify({ provider, api_key: apiKey })
  });
  return res.json();
}

export async function deleteAISettings(provider, token) {
  const res = await fetch(`${API_URL}/api/ai/settings/${provider}`, {
    method: "DELETE",
    headers: authHeader(token)
  });
  return res.json();
}

// ============ AI Content Generation ============
export async function generateContent(topic, platform, tone, token) {
  const res = await fetch(`${API_URL}/api/ai/generate`, {
    method: "POST",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify({ topic, platform, tone })
  });
  return res.json();
}

export async function researchTopic(query, token) {
  const res = await fetch(`${API_URL}/api/ai/research`, {
    method: "POST",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });
  return res.json();
}

export async function getResearchHistory(token) {
  const res = await fetch(`${API_URL}/api/ai/research`, { headers: authHeader(token) });
  return res.json();
}

// ============ Content Calendar ============
export async function getCalendar(startDate, endDate, token) {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  
  const res = await fetch(`${API_URL}/api/calendar?${params}`, { headers: authHeader(token) });
  return res.json();
}

export async function scheduleContent(content, scheduledDate, platform, token) {
  const res = await fetch(`${API_URL}/api/calendar`, {
    method: "POST",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify({ 
      content, 
      scheduled_date: scheduledDate, 
      platform 
    })
  });
  return res.json();
}
