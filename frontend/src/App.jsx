import React, { useState, useEffect } from 'react';
import './styles.css';

const API_BASE = 'http://100.101.67.20:8000';
const METRICOOL_API = 'https://app.metricool.com/api/v1';

// Direct Metricool API calls from browser (via backend proxy)
const metricoolFetch = async (endpoint, apiKey, options = {}) => {
  const response = await fetch(`${API_BASE}/api/metricool${endpoint}`, {
    ...options,
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  return response.json();
};

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
  const [channels, setChannels] = useState([]);
  const [userId, setUserId] = useState(localStorage.getItem('metricool_userId') || '4421531');
  const [blogId, setBlogId] = useState(localStorage.getItem('metricool_blogId') || '5704319');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('auth_token') || '');
  const [newPost, setNewPost] = useState({
    content: '',
    hashtags: '',
    mediaUrls: '',
    platforms: [],
    mediaFiles: [],
    publishNow: true,
    scheduleDate: ''
  });

  // AI State
  const [aiTopic, setAiTopic] = useState('');
  const [aiPlatform, setAiPlatform] = useState('linkedin');
  const [aiTone, setAiTone] = useState('professional');
  const [aiContent, setAiContent] = useState('');
  const [aiNumPosts, setAiNumPosts] = useState(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiBrandName, setAiBrandName] = useState(localStorage.getItem('brand_name') || 'Simply Desserts');
  const [aiExcludeCompetitors, setAiExcludeCompetitors] = useState(true);
  const [researchQuery, setResearchQuery] = useState('');
  const [researchMarket, setResearchMarket] = useState('Global');
  const [researchContext, setResearchContext] = useState(''); // For passing to AI Generate
  const [researchResult, setResearchResult] = useState('');
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchHistory, setResearchHistory] = useState([]);
  const [aiApiKey, setAiApiKey] = useState('');
  const [savedMinimaxKey, setSavedMinimaxKey] = useState('');
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Show inline notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 4000);
  };

  // Check for existing token on load
  useEffect(() => {
    if (token) {
      setIsAuthenticated(true);
      fetchPosts();
      fetchApiKeys();
      fetchResearchHistory();
      
      // Auto-fetch channels if Metricool key saved
      const savedMetricoolKey = localStorage.getItem('metricool_key');
      if (savedMetricoolKey) {
        fetchChannels();
      }
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

  const fetchResearchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ai/research`, { headers: authHeader() });
      const data = await res.json();
      setResearchHistory(data.results || []);
    } catch (e) {
      console.error('Failed to fetch research history:', e);
    }
  };

  const fetchChannels = async () => {
    if (!token) {
      console.log('No token yet, skipping channel fetch');
      return;
    }
    const apiKey = localStorage.getItem('metricool_key');
    if (!apiKey) {
      console.log('No API key saved yet, skipping channel fetch');
      return;
    }
    try {
      // Use userId/blogId directly to get channels
      const res = await fetch(`${API_BASE}/api/metricool/channels?api_key=${apiKey}&user_id=${userId}&blog_id=${blogId}`, { 
        headers: authHeader() 
      });
      const data = await res.json();
      setChannels(data.data || []);
      if (data._mock) {
        console.log('Using mock channels (API unreachable)');
      }
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
          showNotification('Invalid credentials', 'error');
        }
      })
      .catch(() => showNotification('Login failed', 'error'));
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  // AI Handlers
  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) {
      setAiError('Please enter a topic');
      return;
    }
    setAiLoading(true);
    setIsLoading(true);
    setLoadingMessage(`✨ Generating content for ${aiPlatform}...`);
    setAiError('');
    setAiContent('');
    
    // Build prompt with research context if available
    let promptWithContext = aiTopic;
    const charLimit = aiPlatform === 'linkedin' ? '3000' : aiPlatform === 'twitter' ? '280' : '2200';
    const platformNote = aiPlatform === 'linkedin' ? `- LinkedIn character limit: ${charLimit} chars` : aiPlatform === 'twitter' ? `- Twitter/X character limit: ${charLimit} chars` : `- Instagram character limit: ${charLimit} chars`;
    
    if (researchContext) {
      promptWithContext = `Topic: ${aiTopic}

Research Context:
${researchContext}

IMPORTANT INSTRUCTIONS:
- Write as ${aiBrandName} - do NOT mention competitor names or their pricing
- Focus on ${aiBrandName} products, quality, and unique selling points
- Create ${aiNumPosts} different social media post(s) for ${aiPlatform} platform
- Tone: ${aiTone}
- ${platformNote}
- Each post should be unique and engaging
- Include relevant hashtags but NO competitor mentions`;
    } else {
      // No research - just topic
      promptWithContext = `Create ${aiNumPosts} unique social media post(s) for ${aiBrandName} about: ${aiTopic}
- Platform: ${aiPlatform}
- Tone: ${aiTone}
- ${platformNote}
- Write as ${aiBrandName} brand
- Each post should be unique and engaging
- Include relevant hashtags ${aiExcludeCompetitors ? '- but NO competitor mentions' : ''}`;
    }
    
    try {
      const res = await fetch(`${API_BASE}/api/ai/generate`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: promptWithContext, 
          platform: aiPlatform, 
          tone: aiTone 
        })
      });
      const data = await res.json();
      
      if (data.detail) {
        setAiError(data.detail);
      } else if (data.content) {
        setAiContent(data.content);
        // Clear research context after using it
        setResearchContext('');
      } else {
        setAiError('No content generated');
      }
    } catch (e) {
      setAiError('Failed to generate: ' + e.message);
    } finally {
      setAiLoading(false);
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleAIResearch = async () => {
    if (!researchQuery.trim()) {
      showNotification('Please enter a research query', 'error');
      return;
    }
    setResearchLoading(true);
    setIsLoading(true);
    setLoadingMessage(`🔍 Researching "${researchQuery}"...`);
    
    // Build query with market context
    let fullQuery = researchQuery;
    
    // Add market context
    if (researchMarket !== 'Global') {
      fullQuery += ` - Focus on ${researchMarket} market trends and insights`;
    }
    
    // Always include competitor analysis
    fullQuery += `. Include key competitors, their pricing, and market positioning.`;
    
    try {
      const res = await fetch(`${API_BASE}/api/ai/research`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fullQuery })
      });
      const data = await res.json();
      
      if (data.result) {
        setResearchResult(data.result);
        // Refresh history
        const historyRes = await fetch(`${API_BASE}/api/ai/research`, { headers: authHeader() });
        const historyData = await historyRes.json();
        setResearchHistory(historyData.results || []);
        showNotification('Research saved!');
      } else if (data.detail) {
        showNotification(data.detail, 'error');
      }
    } catch (e) {
      showNotification('Research failed: ' + e.message, 'error');
    } finally {
      setResearchLoading(false);
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Use research result to generate content
  const handleUseForContent = () => {
    if (!researchResult) return;
    
    // Store research context and switch to AI Generate view
    setResearchContext(researchResult);
    setAiTopic(researchQuery + (researchMarket !== 'Global' ? ` (${researchMarket} market)` : ''));
    setView('ai-generate');
    showNotification('Research loaded into AI Generate. Add context prompt and generate!');
  };

  const handleDeleteResearch = async (researchId) => {
    if (!confirm('Delete this research?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/ai/research/${researchId}`, {
        method: 'DELETE',
        headers: authHeader()
      });
      
      if (res.ok) {
        // Refresh history
        const historyRes = await fetch(`${API_BASE}/api/ai/research`, { headers: authHeader() });
        const historyData = await historyRes.json();
        setResearchHistory(historyData.results || []);
        
        // Clear result if it was the deleted one
        if (researchResult && !historyData.results?.find(r => r.result === researchResult)) {
          setResearchResult('');
          setResearchQuery('');
        }
        showNotification('Research deleted');
      }
    } catch (e) {
      showNotification('Failed to delete research', 'error');
    }
  };

  const handleSaveAISettings = async () => {
    if (!aiApiKey.trim()) {
      showNotification('Please enter your MiniMax API key', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/ai/settings`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'minimax', api_key: aiApiKey })
      });
      if (res.ok) {
        showNotification('AI Settings saved! You can now generate content.');
        localStorage.setItem('minimax_key', aiApiKey);
      } else {
        showNotification('Failed to save settings', 'error');
      }
    } catch (e) {
      showNotification('Failed to save: ' + e.message, 'error');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
      fetchApiKeys();
      // Load MiniMax key if saved
      const savedKey = localStorage.getItem('minimax_key');
      if (savedKey) {
        setAiApiKey(savedKey);
        setSavedMinimaxKey(savedKey);
      }
      // Also try to load from DB
      fetchAIKeys();
    }
  }, [isAuthenticated]);

  const fetchAIKeys = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ai/settings`, { headers: authHeader() });
      const data = await res.json();
      // Check if minimax is saved
      if (data.providers && data.providers.includes('minimax')) {
        setSavedMinimaxKey('••••••••••••'); // Masked indicator
      }
    } catch (e) {
      console.error('Failed to load AI settings:', e);
    }
  };

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
        showNotification('API Key saved successfully!');
        
        // Auto-fetch channels for Metricool
        if (name === 'metricool') {
          fetchChannels();
        }
      } else {
        showNotification('Failed to save API key', 'error');
      }
    } catch (e) {
      console.error('Failed to add API key:', e);
      showNotification('Failed to save API key', 'error');
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
      showNotification('Please enter post content', 'error');
      return;
    }
    if (!newPost.platforms || newPost.platforms.length === 0) {
      showNotification('Please select at least one platform', 'error');
      return;
    }
    try {
      let mediaUrls = newPost.mediaUrls ? newPost.mediaUrls.split(',').map(u => u.trim()) : [];
      
      // Upload any attached files first
      if (newPost.mediaFiles && newPost.mediaFiles.length > 0) {
        for (const file of newPost.mediaFiles) {
          const formData = new FormData();
          formData.append('file', file);
          
          const res = await fetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
          });
          
          if (res.ok) {
            const data = await res.json();
            mediaUrls.push(data.url);
          }
        }
      }
      
      const postData = {
        content: newPost.content,
        hashtags: newPost.hashtags ? newPost.hashtags.split(',').map(t => t.trim()) : [],
        media_urls: mediaUrls,
        platforms: newPost.platforms,
        scheduled_time: newPost.publishNow ? null : newPost.scheduleDate,
        publish_now: newPost.publishNow
      };
      
      await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      
      setNewPost({ content: '', hashtags: '', mediaUrls: '', platforms: [], mediaFiles: [], publishNow: true, scheduleDate: '' });
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

  const handlePublish = async (postId, force = false) => {
    const apiKey = localStorage.getItem('metricool_key');
    if (!apiKey) {
      showNotification('Please add your Metricool API key in Settings', 'error');
      return;
    }
    
    // Find the post
    const post = posts.find(p => p.id === postId);
    if (!post) {
      showNotification('Post not found', 'error');
      return;
    }
    
    // Check if already published (unless forcing republish)
    if (post.status === 'published' && !force) {
      if (!confirm('This post is already published. Publish again?')) {
        return;
      }
    }
    
    try {
      // Get channels from backend (which has mock fallback)
      const channelsResponse = await fetch(`${API_BASE}/api/metricool/channels?api_key=${apiKey}`, {
        headers: authHeader()
      });
      const channelsData = await channelsResponse.json();
      console.log('Channels response:', channelsData);
      
      // Find channel for the post's platform
      let channelId = null;
      if (channelsData.data && channelsData.data.length > 0) {
        const platformMap = { linkedin: 'linkedin', instagram: 'instagram', facebook: 'facebook', twitter: 'twitter' };
        const targetPlatform = platformMap[post.platforms?.[0]];
        const channel = channelsData.data.find(c => c.platform === targetPlatform);
        if (channel) channelId = channel.id;
      }
      
      // Create post data
      const postData = {
        content: post.content,
        channels: channelId ? [channelId] : [],
        media: post.media_urls?.map(url => ({ url })) || []
      };
      
      // Call Metricool API
      const result = await fetch(`${API_BASE}/api/metricool/posts?api_key=${apiKey}`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      const resultData = await result.json();
      console.log('Metricool result:', resultData);
      
      // Update local status
      await fetch(`${API_BASE}/api/posts/${postId}/publish?user_id=${userId}&blog_id=${blogId}&api_key=${apiKey}`, { 
        method: 'POST',
        headers: authHeader()
      });
      
      if (resultData._mock || resultData.error) {
        showNotification('Post published (mock mode)');
      } else {
        showNotification('Post published to Metricool! 🎉');
      }
      fetchPosts();
    } catch (e) {
      console.error('Failed to publish:', e);
      showNotification('Failed to publish: ' + e.message, 'error');
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
      {isLoading && (
        <div className="loading-bar">
          <div className="loading-spinner"></div>
          <span>{loadingMessage}</span>
        </div>
      )}
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

      {notification.message && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <nav className="nav">
        <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>📊 Dashboard</button>
        <button className={view === 'create' ? 'active' : ''} onClick={() => setView('create')}>✏️ Create Post</button>
        <button className={view === 'posts' ? 'active' : ''} onClick={() => setView('posts')}>📝 Posts</button>
        <button className={view === 'ai-generate' ? 'active' : ''} onClick={() => setView('ai-generate')}>✨ AI Generate</button>
        <button className={view === 'ai-research' ? 'active' : ''} onClick={() => setView('ai-research')}>🔍 AI Research</button>
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
            <div className="form-group">
              <label>When to Publish</label>
              <div className="publish-options">
                <label className="publish-option">
                  <input 
                    type="radio" 
                    name="publishMode"
                    checked={newPost.publishNow}
                    onChange={() => setNewPost({...newPost, publishNow: true})}
                  />
                  🚀 Publish Now
                </label>
                <label className="publish-option">
                  <input 
                    type="radio" 
                    name="publishMode"
                    checked={!newPost.publishNow}
                    onChange={() => setNewPost({...newPost, publishNow: false})}
                  />
                  📅 Schedule for Later
                </label>
              </div>
              {!newPost.publishNow && (
                <input 
                  type="datetime-local"
                  value={newPost.scheduleDate}
                  onChange={(e) => setNewPost({...newPost, scheduleDate: e.target.value})}
                  min={new Date().toISOString().slice(0, 16)}
                  style={{marginTop: '0.5rem', padding: '0.75rem', borderRadius: '8px', border: '2px solid var(--border)'}}
                />
              )}
            </div>
            <button className="btn-primary" onClick={handleCreatePost}>{newPost.publishNow ? '🚀 Create & Publish' : '📅 Create & Schedule'}</button>
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
                      {(post.status === 'approved' || post.status === 'published') && (
                        <button onClick={() => handlePublish(post.id)}>🚀 {post.status === 'published' ? 'Republish' : 'Publish'}</button>
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
            
            {/* AI Settings */}
            <div className="settings-section">
              <h3>🤖 AI Settings (MiniMax)</h3>
              <p className="hint">Add your MiniMax API key to enable AI content generation</p>
              {savedMinimaxKey ? (
                <div className="saved-keys" style={{marginBottom: '1rem'}}>
                  <div className="key-item">
                    <span className="key-name">🤖 MiniMax: {savedMinimaxKey}</span>
                    <button className="key-delete" onClick={async () => {
                      if (!confirm('Remove MiniMax API key?')) return;
                      try {
                        await fetch(`${API_BASE}/api/ai/settings/minimax`, { 
                          method: 'DELETE',
                          headers: authHeader() 
                        });
                        setSavedMinimaxKey('');
                        setAiApiKey('');
                        localStorage.removeItem('minimax_key');
                        showNotification('MiniMax API key removed');
                      } catch (e) {
                        showNotification('Failed to remove key', 'error');
                      }
                    }}>🗑️</button>
                  </div>
                </div>
              ) : (
                <div className="api-key-form">
                  <input 
                    type="password" 
                    placeholder="MiniMax API Key" 
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    style={{flex: 1}}
                  />
                  <button onClick={handleSaveAISettings}>Save</button>
                </div>
              )}
              <p className="hint" style={{marginTop: '0.5rem', fontSize: '0.85rem'}}>
                Get your API key from <a href="https://platform.minimaxi.chat" target="_blank" rel="noopener">platform.minimaxi.chat</a>
              </p>
            </div>

            <div className="settings-section">
              <h3>📊 Metricool API</h3>
              {apiKeys.includes('metricool') ? (
                <div className="saved-keys" style={{marginBottom: '1rem'}}>
                  <div className="key-item">
                    <span className="key-name">📊 Metricool: ••••••••••••</span>
                    <button className="key-delete" onClick={() => handleDeleteApiKey('metricool')}>🗑️</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="hint" style={{marginBottom: '1rem'}}>Add your Metricool API key to publish posts</p>
                  <div className="api-key-form">
                    <input type="password" placeholder="Metricool API Key" id="metricoolKeyValue" style={{flex: 1}} />
                    <button onClick={() => {
                      const key = document.getElementById('metricoolKeyValue').value;
                      if (key) handleAddApiKey('metricool', key);
                    }}>Save</button>
                  </div>
                </>
              )}
            </div>

            <div className="settings-section">
              <h3>📊 Metricool Channels</h3>
              <p className="hint">Your connected social media channels</p>
              
              <div className="form-row" style={{marginBottom: '1rem'}}>
                <div className="form-group" style={{flex: 1}}>
                  <label>User ID</label>
                  <input 
                    type="text" 
                    value={userId}
                    onChange={(e) => {
                      setUserId(e.target.value);
                      localStorage.setItem('metricool_userId', e.target.value);
                    }}
                    placeholder="4421531"
                  />
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label>Blog ID</label>
                  <input 
                    type="text" 
                    value={blogId}
                    onChange={(e) => {
                      setBlogId(e.target.value);
                      localStorage.setItem('metricool_blogId', e.target.value);
                    }}
                    placeholder="5704319"
                  />
                </div>
              </div>
              
              <button className="btn-primary" onClick={() => fetchChannels()}>
                🔄 Fetch Channels
              </button>

              {channels.length > 0 ? (
                <div className="channels-list">
                  <h4>Available Channels:</h4>
                  {channels.map(ch => (
                    <div key={ch.id} className="channel-item">
                      <span>{ch.name}</span>
                      <span className="channel-platform">{ch.platform}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="hint">No channels found. Check your User ID and Blog ID.</p>
              )}
            </div>
          </div>
        )}

        {/* AI Content Generation */}
        {view === 'ai-generate' && (
          <div className="ai-generate">
            <h2>✨ AI Content Generator</h2>
            <p className="hint">Generate engaging social media posts with AI</p>
            
            <div className="ai-form">
              <div className="form-group">
                <label>Topic / Subject</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sustainable baking ingredients, New product launch..."
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Platform</label>
                  <select value={aiPlatform} onChange={(e) => setAiPlatform(e.target.value)}>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Tone</label>
                  <select value={aiTone} onChange={(e) => setAiTone(e.target.value)}>
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="casual">Casual</option>
                    <option value="humorous">Humorous</option>
                  </select>
                </div>

                <div className="form-group">
                  <label># Posts</label>
                  <select value={aiNumPosts} onChange={(e) => setAiNumPosts(parseInt(e.target.value))}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row" style={{alignItems: 'center', marginTop: '1.5rem'}}>
                <div className="form-group" style={{marginBottom: 0, flex: 1}}>
                  <label>Brand Name</label>
                  <input 
                    type="text" 
                    placeholder="Simply Desserts"
                    value={aiBrandName}
                    onChange={(e) => {
                      setAiBrandName(e.target.value);
                      localStorage.setItem('brand_name', e.target.value);
                    }}
                  />
                </div>
                
                <div className="form-group" style={{marginBottom: 0, display: 'flex', alignItems: 'flex-end', paddingBottom: '0.5rem'}}>
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', whiteSpace: 'nowrap'}}>
                    <input 
                      type="checkbox" 
                      checked={aiExcludeCompetitors}
                      onChange={(e) => setAiExcludeCompetitors(e.target.checked)}
                    />
                    Exclude competitors
                  </label>
                </div>
              </div>
              
              <button 
                className="btn-primary" 
                onClick={handleAIGenerate}
                disabled={aiLoading}
              >
                {aiLoading ? '⏳ Generating...' : '✨ Generate Content'}
              </button>
              
              {aiError && <div className="error-message">{aiError}</div>}
              
              {aiContent && (
                <div className="generated-content">
                  <h3>Generated Content:</h3>
                  <div className="content-box">{aiContent}</div>
                  <div className="content-actions">
                    <button onClick={() => {
                      setNewPost({...newPost, content: aiContent});
                      setView('create');
                    }}>📝 Edit & Create Post</button>
                    <button onClick={() => navigator.clipboard.writeText(aiContent)}>📋 Copy</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Research */}
        {view === 'ai-research' && (
          <div className="ai-research">
            <h2>🔍 AI Research</h2>
            <p className="hint">Research topics before creating content</p>
            
            <div className="ai-form">
              <div className="form-group">
                <label>Research Query</label>
                <input 
                  type="text" 
                  placeholder="e.g. Protein Pudding trends..."
                  value={researchQuery}
                  onChange={(e) => setResearchQuery(e.target.value)}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Market</label>
                  <select 
                    value={researchMarket}
                    onChange={(e) => setResearchMarket(e.target.value)}
                  >
                    <option value="Global">Global</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="South Africa">South Africa</option>
                    <option value="Europe">Europe</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </div>
              
              <button 
                className="btn-primary" 
                onClick={handleAIResearch}
                disabled={researchLoading}
              >
                {researchLoading ? '⏳ Researching...' : '🔍 Research'}
              </button>
              
              {researchResult && (
                <div className="research-result">
                  <h3>Results:</h3>
                  <div className="content-box formatted-research">{researchResult}</div>
                  <button 
                    className="btn-primary" 
                    onClick={handleUseForContent}
                    style={{marginTop: '1rem'}}
                  >
                    ✨ Generate Content from Research
                  </button>
                </div>
              )}
            </div>
            
            {researchHistory.length > 0 && (
              <div className="research-history">
                <h3>Recent Research ({researchHistory.length})</h3>
                <p className="hint">Click to view • Max 20 saved</p>
                {researchHistory.slice(0, 5).map((item, i) => (
                  <div key={i} className="history-item">
                    <div className="history-item-content" onClick={() => {
                      setResearchResult(item.result);
                      setResearchQuery(item.query);
                    }}>
                      <strong>{item.query}</strong>
                      <span className="history-date">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <button 
                      className="history-delete" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteResearch(item.id);
                      }}
                      title="Delete"
                    >🗑️</button>
                  </div>
                ))}
                {researchHistory.length > 5 && (
                  <p className="hint" style={{marginTop: '0.5rem'}}>+ {researchHistory.length - 5} more in history</p>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
