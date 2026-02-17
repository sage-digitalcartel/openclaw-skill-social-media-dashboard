import React, { useEffect, useState } from "react";
import {
  getPosts,
  createPost,
  approvePost,
  publishPost,
  previewPost
} from "./api";

const emptyForm = {
  title: "",
  page_name: "",
  page_url: "",
  body: "",
  hashtags: "",
  link_url: "",
  media_paths: "",
  alt_texts: "",
  scheduled_for: ""
};

function parseList(value) {
  if (!value) return null;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function App() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("");

  const loadPosts = async () => {
    const data = await getPosts();
    setPosts(data);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setStatus("Creating...");
    await createPost({
      title: form.title || null,
      page_name: form.page_name || null,
      page_url: form.page_url || null,
      body: form.body,
      hashtags: parseList(form.hashtags),
      link_url: form.link_url || null,
      media_paths: parseList(form.media_paths),
      alt_texts: parseList(form.alt_texts),
      scheduled_for: form.scheduled_for || null
    });
    setForm(emptyForm);
    await loadPosts();
    setStatus("Post created.");
  };

  const handlePreview = async (id) => {
    const data = await previewPost(id);
    setPreview(data.rendered || "");
  };

  const handleApprove = async (id) => {
    setStatus("Approving...");
    await approvePost(id);
    await loadPosts();
    setStatus("Post approved.");
  };

  const handlePublish = async (id, dryRun) => {
    setStatus(dryRun ? "Running dry run..." : "Publishing...");
    const data = await publishPost(id, dryRun);
    await loadPosts();
    setStatus(`Publish status: ${data.status}`);
  };

  return (
    <div className="container">
      <header>
        <h1>Social Media Post Dashboard</h1>
        <p>Preview, approve, and publish Social Media posts through OpenClaw automation.</p>
      </header>

      <section className="panel">
        <h2>Create New Post</h2>
        <form onSubmit={handleCreate} className="form-grid">
          <input name="title" placeholder="Internal title" value={form.title} onChange={handleChange} />
          <input name="page_name" placeholder="Page name" value={form.page_name} onChange={handleChange} />
          <input name="page_url" placeholder="Page URL" value={form.page_url} onChange={handleChange} />
          <textarea name="body" placeholder="Post text" value={form.body} onChange={handleChange} required />
          <input name="hashtags" placeholder="Hashtags (comma separated)" value={form.hashtags} onChange={handleChange} />
          <input name="link_url" placeholder="Link URL" value={form.link_url} onChange={handleChange} />
          <input name="media_paths" placeholder="Media paths (comma separated)" value={form.media_paths} onChange={handleChange} />
          <input name="alt_texts" placeholder="Alt texts (comma separated)" value={form.alt_texts} onChange={handleChange} />
          <input name="scheduled_for" placeholder="Schedule (optional)" value={form.scheduled_for} onChange={handleChange} />
          <button type="submit">Create Post</button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Post Queue</h2>
          <span className="status">{status}</span>
        </div>
        <div className="table">
          <div className="table-header">
            <span>Title</span>
            <span>Status</span>
            <span>Approved</span>
            <span>Actions</span>
          </div>
          {posts.map((post) => (
            <div key={post.id} className="table-row">
              <span>{post.title || `Post #${post.id}`}</span>
              <span>{post.publish_status}</span>
              <span>{post.approved ? "Yes" : "No"}</span>
              <div className="actions">
                <button onClick={() => handlePreview(post.id)}>Preview</button>
                <button disabled={post.approved} onClick={() => handleApprove(post.id)}>
                  {post.approved ? "Approved" : "Approve"}
                </button>
                <button disabled={!post.approved} onClick={() => handlePublish(post.id, true)}>
                  Dry Run
                </button>
                <button disabled={!post.approved} onClick={() => handlePublish(post.id, false)}>
                  Publish
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Post Preview</h2>
        <pre className="preview">{preview || "Select a post to preview its rendered content."}</pre>
      </section>
    </div>
  );
}
