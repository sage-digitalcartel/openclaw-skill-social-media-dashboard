# 🚀 Social Media Dashboard

A modern, full-featured social media management dashboard powered by Metricool API. Manage all your social media accounts from one place!

## ✨ Features

- **Multi-Platform Support** - LinkedIn, Instagram, Twitter, Facebook via Metricool
- **Post Creation** - Create posts with text, hashtags, and media
- **Approval Workflow** - Review and approve posts before publishing
- **Scheduling** - Schedule posts for later publishing
- **Metricool Integration** - Direct API integration for instant publishing
- **Beautiful UI** - Modern, responsive React interface

## 🛠️ Setup

### Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev -- --host
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend:

```env
METRICOOL_API_KEY=your_api_key_here
```

### Getting Your Metricool API Key

1. Log in to your Metricool account
2. Go to Settings → Integrations → API
3. Generate an API key

## 📡 API Endpoints

### Posts
- `POST /api/posts` - Create a new post
- `GET /api/posts` - List all posts
- `GET /api/posts/{id}` - Get post details
- `PATCH /api/posts/{id}/approve` - Approve a post
- `PATCH /api/posts/{id}/reject` - Reject a post
- `POST /api/posts/{id}/publish` - Publish via Metricool
- `DELETE /api/posts/{id}` - Delete a post

### Metricool Integration
- `GET /api/workspaces` - List workspaces
- `GET /api/workspaces/{id}/channels` - List channels in workspace

### API Keys
- `POST /api/keys` - Save API key
- `GET /api/keys` - List saved keys
- `DELETE /api/keys/{name}` - Delete API key

## 📱 Usage

1. Start the backend server
2. Start the frontend dev server
3. Open browser to frontend URL
4. Go to Settings → Add your Metricool API key
5. Select your workspace
6. Create posts, approve, and publish!

## 🌐 Deployment

Deploy on any VPS with Node.js and Python. Access via browser - clients can use from anywhere!

## 📄 License

Private - All rights reserved
