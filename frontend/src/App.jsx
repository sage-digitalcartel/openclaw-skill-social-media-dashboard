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
  const [apiKey, setApiKey] = useState('');
  const [newPost, setNewPost] = useState({
    content: '',
    hashtags: '',
    mediaUrls: '',
    channels: []
  });

  useEffect(() => {
    fetchPosts();
    fetchApiKeys();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/posts`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (e) {
      console.error('Failed to fetch posts:', e);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/keys`);
      const data = await res.json();
      setApiKeys(data.keys || []);
    } catch (e) {
      console.error('Failed to fetch keys:', e);
    }
  };

  const fetchWorkspaces = async () => {
    if (!apiKey) return;
    try {
      const res = await fetch(`${API_BASE}/api/workspaces?api_key=${apiKey}`);
      const data = await res.json();
      setWorkspaces(data.workspaces || []);
    } catch (e) {
      console.error('Failed to fetch workspaces:', e);
    }
  };

  const fetchChannels = async (workspaceId) => {
    if (!apiKey || !workspaceId) return;
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/channels?api_key=${apiKey}`);
      const data = await res.json();
      setChannels(data.channels || []);
    } catch (e) {
      console.error('Failed to fetch channels:', e);
    }
  };

  const handleAddApiKey = async (name, key) => {
    try {
      await fetch(`${API_BASE}/api/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, key })
      });
      fetchApiKeys();
      setApiKey(key);
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
        headers: { 'Content-Type': 'application/json' },
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
      await fetch(`${API_BASE}/api/posts/${postId}/approve`, { method: 'PATCH' });
      fetchPosts();
    } catch (e) {
      console.error('Failed to approve:', e);
    }
  };

  const handlePublish = async (postId) => {
    if (!selectedWorkspace || !apiKey) {
      alert('Please select a workspace and ensure API key is set');
      return;
    }
    try {
      await fetch(`${API_BASE}/api/posts/${postId}/publish?workspace_id=${selectedWorkspace}&api_key=${apiKey}`, { 
        method: 'POST' 
      });
      fetchPosts();
    } catch (e) {
      console.error('Failed to publish:', e);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await fetch(`${API_BASE}/api/posts/${postId}`, { method: 'DELETE' });
      fetchPosts();
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🚀 Social Media Dashboard</h1>
        <p>Powered by Metricool</p>
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

            <div className="form-group">
              <label>Select Channels</label>
              <div className="channels-grid">
                {channels.length > 0 ? channels.map(ch => (
                  <label key={ch.id} className="channel-checkbox">
                    <input 
                      type="checkbox"
                      checked={newPost.channels.includes(ch.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewPost({...newPost, channels: [...newPost.channels, ch.id]});
                        } else {
                          setNewPost({...newPost, channels: newPost.channels.filter(c => c !== ch.id)});
                        }
                      }}
                    />
                    {ch.network} - {ch.name}
                  </label>
                )) : (
                  <p className="hint">Add API key in Settings and select workspace to see channels</p>
                )}
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
              <p>Add your Metricool API key to connect your accounts.</p>
              
              <div className="api-key-form">
                <input 
                  type="text" 
                  placeholder="Name (e.g., Client Name)"
                  id="keyName"
                />
                <input 
                  type="password" 
                  placeholder="Metricool API Key"
                  id="keyValue"
                />
                <button onClick={() => {
                  const name = document.getElementById('keyName').value;
                  const key = document.getElementById('keyValue').value;
                  if (name && key) handleAddApiKey(name, key);
                }}>Add Key</button>
              </div>

              <div className="saved-keys">
                <h4>Saved Keys:</h4>
                {apiKeys.map((name, i) => (
                  <span key={i} className="key-badge">{name}</span>
                ))}
              </div>
            </div>

            <div className="settings-section">
              <h3>📂 Workspace</h3>
              <p>Select which workspace to use:</p>
              
              <select 
                value={apiKey} 
                onChange={(e) => { setApiKey(e.target.value); setTimeout(fetchWorkspaces, 100); }}
              >
                <option value="">Select API Key</option>
                {apiKeys.map((name, i) => (
                  <option key={i} value={name}>{name}</option>
                ))}
              </select>

              {apiKey && (
                <button onClick={fetchWorkspaces}>Load Workspaces</button>
              )}

              {workspaces.length > 0 && (
                <select 
                  value={selectedWorkspace}
                  onChange={(e) => { setSelectedWorkspace(e.target.value); fetchChannels(e.target.value); }}
                >
                  <option value="">Select Workspace</option>
                  {workspaces.map(ws => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
