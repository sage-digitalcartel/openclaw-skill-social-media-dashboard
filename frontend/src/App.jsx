import React, { useState, useEffect } from 'react';
import './styles.css';

const API_BASE = 'http://localhost:8000';

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
  const [newPost, setNewPost] = useState({
    content: '',
    hashtags: '',
    mediaUrls: '',
    channels: []
  });

  const authHeader = () => ({
    'Authorization': 'Basic ' + btoa(username + ':' + password)
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
    if (!username || !password) return;
    try {
      const res = await fetch(`${API_BASE}/api/workspaces?api_key=${localStorage.getItem('metricool_key') || ''}`, { headers: authHeader() });
      const data = await res.json();
      setWorkspaces(data.workspaces || []);
    } catch (e) {
      console.error('Failed to fetch workspaces:', e);
    }
  };

  const fetchChannels = async (workspaceId) => {
    if (!username || !password || !workspaceId) return;
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
    // Test credentials
    fetch(`${API_BASE}/api/posts`, { headers: authHeader() })
      .then(res => {
        if (res.ok) {
          setIsAuthenticated(true);
          fetchPosts();
          fetchApiKeys();
        } else {
          alert('Invalid credentials');
        }
      });
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
      fetchApiKeys();
    }
  }, [isAuthenticated]);

  const handleAddApiKey = async (name, key) => {
    try {
      await fetch(`${API_BASE}/api/keys`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, key })
      });
      localStorage.setItem('metricool_key', key);
      fetchApiKeys();
    } catch (e) {
      console.error('Failed to add API key:', e);
    }
  };

  const handleCreatePost = async () => {
    try {
      const postData = {
        content: newPost.content,
        hashtags: newPost.hashtags ? newPost.hashtags.split(',').map(t => t.trim()) : [],
        media_urls: newPost.mediaUrls ? newPost.mediaUrls.split(',').map(u => u.trim()) : [],
        channels: newPost.channels,
        scheduled_time: null
      };
      
      await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      
      setNewPost({ content: '', hashtags: '', mediaUrls: '', channels: [] });
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
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <img src="https://simplydesserts.us/wp-content/uploads/2024/09/logo.png" alt="Simply Desserts" style={{maxWidth: '180px', marginBottom: '0.5rem'}} />
        <h1>Social Media Dashboard</h1>
        <p>Powered by Metricool</p>
        <button className="logout-btn" onClick={() => setIsAuthenticated(false)}>Logout</button>
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
              <label>Media URLs (comma separated)</label>
              <input 
                type="text"
                value={newPost.mediaUrls}
                onChange={(e) => setNewPost({...newPost, mediaUrls: e.target.value})}
                placeholder="https://example.com/image.jpg"
              />
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
                      <span className="date">{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="post-content">{post.content}</p>
                    {post.hashtags && (
                      <div className="hashtags">
                        {post.hashtags.map((tag, i) => <span key={i} className="tag">{tag}</span>)}
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
              <h3>🔑 API Keys</h3>
              <div className="api-key-form">
                <input type="text" placeholder="Name" id="keyName" />
                <input type="password" placeholder="Metricool API Key" id="keyValue" />
                <button onClick={() => {
                  const name = document.getElementById('keyName').value;
                  const key = document.getElementById('keyValue').value;
                  if (name && key) handleAddApiKey(name, key);
                }}>Add Key</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
