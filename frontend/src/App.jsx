import React, { useState, useEffect } from 'react';
import './styles.css';

const API_BASE = 'http://100.101.67.20:8000';

// Platform logos (SVG icons)
const PLATFORM_LOGOS = {
  linkedin: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path fill="url(#insta-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.97C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      <defs>
        <linearGradient id="insta-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E1306C"/>
          <stop offset="50%" stopColor="#833AB4"/>
          <stop offset="100%" stopColor="#405DE6"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="#000000">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
};

function App() {
  const [view, setView] = useState('dashboard');
  const [posts, setPosts] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('auth_token') || '');
  const [newPost, setNewPost] = useState({
    content: '',
    hashtags: '',
    mediaUrls: '',
    platforms: [],
    mediaFiles: []
  });

  // Check for existing token on load
  useEffect(() => {
    if (token) {
      setIsAuthenticated(true);
      fetchPosts();
      fetchApiKeys();
    }
  }, []);

  const authHeader = () => ({
    'Authorization': 'Bearer ' + token
  });

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/posts`, { headers: authHeader() });
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (e) {
      console.error('Failed to fetch posts:', e);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/keys`, { headers: authHeader() });
      const data = await res.json();
      setApiKeys(data.keys || []);
    } catch (e) {
      console.error('Failed to fetch keys:', e);
    }
  };

  const fetchWorkspaces = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/workspaces?api_key=${localStorage.getItem('metricool_key') || ''}`, { headers: authHeader() });
      const data = await res.json();
      setWorkspaces(data.workspaces || []);
    } catch (e) {
      console.error('Failed to fetch workspaces:', e);
    }
  };

  const fetchChannels = async (workspaceId) => {
    if (!token || !workspaceId) return;
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/channels?api_key=${localStorage.getItem('metricool_key') || ''}`, { headers: authHeader() });
      const data = await res.json();
      setChannels(data.channels || []);
    } catch (e) {
      console.error('Failed to fetch channels:', e);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Get token from backend
    fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          setToken(data.token);
          localStorage.setItem('auth_token', data.token);
          setIsAuthenticated(true);
          fetchPosts();
          fetchApiKeys();
        } else {
          alert('Invalid credentials');
        }
      })
      .catch(() => alert('Login failed'));
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
      fetchApiKeys();
    }
  }, [isAuthenticated]);

  const handleAddApiKey = async (name, key) => {
    try {
      const res = await fetch(`${API_BASE}/api/keys`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, key })
      });
      if (res.ok) {
        localStorage.setItem('metricool_key', key);
        fetchApiKeys();
        alert('API Key saved successfully!');
      } else {
        alert('Failed to save API key');
      }
    } catch (e) {
      console.error('Failed to add API key:', e);
      alert('Failed to save API key');
    }
  };

  const handleDeleteApiKey = async (name) => {
    if (!confirm(`Delete API key "${name}"?`)) return;
    try {
      await fetch(`${API_BASE}/api/keys/${name}`, { 
        method: 'DELETE',
        headers: authHeader() 
      });
      fetchApiKeys();
    } catch (e) {
      console.error('Failed to delete API key:', e);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.content) {
      alert('Please enter post content');
      return;
    }
    if (!newPost.platforms || newPost.platforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }
    try {
      const postData = {
        content: newPost.content,
        hashtags: newPost.hashtags ? newPost.hashtags.split(',').map(t => t.trim()) : [],
        media_urls: newPost.mediaUrls ? newPost.mediaUrls.split(',').map(u => u.trim()) : [],
        platforms: newPost.platforms,
        scheduled_time: null
      };
      
      await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      
      setNewPost({ content: '', hashtags: '', mediaUrls: '', platforms: [], mediaFiles: [] });
      fetchPosts();
      setView('posts');
    } catch (e) {
      console.error('Failed to create post:', e);
    }
  };

  const handleApprove = async (postId) => {
    try {
      await fetch(`${API_BASE}/api/posts/${postId}/approve`, { method: 'PATCH', headers: authHeader() });
      fetchPosts();
    } catch (e) {
      console.error('Failed to approve:', e);
    }
  };

  const handlePublish = async (postId) => {
    if (!selectedWorkspace) {
      alert('Please select a workspace in Settings');
      return;
    }
    try {
      await fetch(`${API_BASE}/api/posts/${postId}/publish?workspace_id=${selectedWorkspace}&api_key=${localStorage.getItem('metricool_key') || ''}`, { 
        method: 'POST',
        headers: authHeader()
      });
      fetchPosts();
    } catch (e) {
      console.error('Failed to publish:', e);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await fetch(`${API_BASE}/api/posts/${postId}`, { method: 'DELETE', headers: authHeader() });
      fetchPosts();
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-logo">
            <img src="https://simplydesserts.us/wp-content/uploads/2024/09/logo.png" alt="Simply Desserts" style={{maxWidth: '200px'}} />
          </div>
          <h1><strong>Social Media Dashboard</strong></h1>
          <form onSubmit={handleLogin}>
            <input 
              type="text" 
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Sign In</button>
          </form>
          <p className="login-remember">
            <label>
              <input type="checkbox" defaultChecked /> Remember me
            </label>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <img src="https://simplydesserts.us/wp-content/uploads/2024/09/logo.png" alt="Simply Desserts" className="header-logo" />
        </div>
        <div className="header-right">
          <h1>Social Media Management</h1>
          <button className="logout-icon" onClick={handleLogout} title="Logout">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
          </button>
        </div>
      </header>

      <nav className="nav">
        <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>📊 Dashboard</button>
        <button className={view === 'create' ? 'active' : ''} onClick={() => setView('create')}>✏️ Create Post</button>
        <button className={view === 'posts' ? 'active' : ''} onClick={() => setView('posts')}>📝 Posts</button>
        <button className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}>⚙️ Settings</button>
      </nav>

      <main className="main">
        {view === 'dashboard' && (
          <div className="dashboard">
            <h2>📊 Overview</h2>
            <div className="stats">
              <div className="stat-card">
                <h3>{posts.length}</h3>
                <p>Total Posts</p>
              </div>
              <div className="stat-card">
                <h3>{posts.filter(p => p.status === 'pending').length}</h3>
                <p>Pending</p>
              </div>
              <div className="stat-card">
                <h3>{posts.filter(p => p.status === 'approved').length}</h3>
                <p>Approved</p>
              </div>
              <div className="stat-card">
                <h3>{posts.filter(p => p.status === 'published').length}</h3>
                <p>Published</p>
              </div>
            </div>
            <div className="quick-actions">
              <button onClick={() => setView('create')}>+ Create New Post</button>
            </div>
          </div>
        )}

        {view === 'create' && (
          <div className="create-post">
            <h2>✏️ Create New Post</h2>
            <div className="form-group">
              <label>Post Content</label>
              <textarea 
                value={newPost.content}
                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                placeholder="What's on your mind?"
                rows={5}
              />
            </div>
            <div className="form-group">
              <label>Hashtags (comma separated)</label>
              <input 
                type="text"
                value={newPost.hashtags}
                onChange={(e) => setNewPost({...newPost, hashtags: e.target.value})}
                placeholder="#social #marketing"
              />
            </div>
            <div className="form-group">
              <label>Media</label>
              <div className="media-upload">
                <input 
                  type="file" 
                  id="mediaFile" 
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setNewPost({...newPost, mediaFiles: files});
                  }}
                />
                <label htmlFor="mediaFile" className="upload-btn">
                  📎 Attach File
                </label>
                {newPost.mediaFiles.length > 0 && (
                  <span className="file-count">{newPost.mediaFiles.length} file(s) selected</span>
                )}
              </div>
              <p className="hint">Or paste URL below</p>
              <input 
                type="text"
                value={newPost.mediaUrls}
                onChange={(e) => setNewPost({...newPost, mediaUrls: e.target.value})}
                placeholder="https://example.com/image.jpg"
                style={{marginTop: '0.5rem'}}
              />
            </div>
            <div className="form-group">
              <label>Platforms</label>
              <div className="platforms-inline">
                {Object.entries(PLATFORM_LOGOS).map(([platform, logo]) => (
                  <label key={platform} className="platform-checkbox-inline">
                    <input 
                      type="checkbox"
                      checked={newPost.platforms?.includes(platform)}
                      onChange={(e) => {
                        const platforms = newPost.platforms || [];
                        if (e.target.checked) {
                          setNewPost({...newPost, platforms: [...platforms, platform]});
                        } else {
                          setNewPost({...newPost, platforms: platforms.filter(p => p !== platform)});
                        }
                      }}
                    />
                    <span className="platform-icon">{logo}</span>
                  </label>
                ))}
              </div>
            </div>
            <button className="btn-primary" onClick={handleCreatePost}>Create Post</button>
          </div>
        )}

        {view === 'posts' && (
          <div className="posts-list">
            <h2>📝 All Posts</h2>
            {posts.length === 0 ? (
              <p>No posts yet. Create your first post!</p>
            ) : (
              <div className="posts">
                {posts.map(post => (
                  <div key={post.id} className={`post-card ${post.status}`}>
                    <div className="post-header">
                      <span className={`status ${post.status}`}>{post.status}</span>
                      {post.platforms && (
                        <div className="post-platforms">
                          {post.platforms.map((p, i) => (
                            <span key={i} className="platform-tag">
                              {PLATFORM_LOGOS[p] || p}
                              <span className="platform-label">{p}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="date">{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="post-content">{post.content}</p>
                    {post.hashtags && (
                      <div className="hashtags">
                        {post.hashtags.map((tag, i) => <span key={i} className="tag">{tag}</span>)}
                      </div>
                    )}
                    {post.media_urls && post.media_urls.length > 0 && (
                      <div className="post-media">
                        {post.media_urls.map((url, i) => (
                          <img key={i} src={url} alt="Media" onError={(e) => e.target.style.display='none'} />
                        ))}
                      </div>
                    )}
                    <div className="post-actions">
                      {post.status === 'pending' && (
                        <button onClick={() => handleApprove(post.id)}>✅ Approve</button>
                      )}
                      {post.status === 'approved' && (
                        <button onClick={() => handlePublish(post.id)}>🚀 Publish</button>
                      )}
                      <button onClick={() => handleDelete(post.id)}>🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'settings' && (
          <div className="settings">
            <h2>⚙️ Settings</h2>
            <div className="settings-section">
              <h3>🔑 Metricool API Keys</h3>
              <div className="api-key-form">
                <input type="text" placeholder="Key Name (e.g. main)" id="keyName" />
                <input type="password" placeholder="Metricool API Key" id="keyValue" />
                <button onClick={() => {
                  const name = document.getElementById('keyName').value;
                  const key = document.getElementById('keyValue').value;
                  if (name && key) handleAddApiKey(name, key);
                }}>Add</button>
              </div>
              
              {apiKeys.length > 0 && (
                <div className="saved-keys">
                  <h4>Saved Keys:</h4>
                  <div className="keys-list">
                    {apiKeys.map((name, i) => (
                      <div key={i} className="key-item">
                        <span className="key-name">{name}</span>
                        <button className="key-delete" onClick={() => handleDeleteApiKey(name)}>🗑️</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
