const supabaseUrl = 'https://zysbfizsztwcoqhotbme.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c2JmaXpzenR3Y29xaG90Ym1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5ODYxNTk1MSwiZXhwIjoyMDE0MTkxOTUxfQ.8GZR-wEfOgVWuEXNfKxPG9WnxFPOCahc0w5kHf6B3J0';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BrowserRouter as Router, Route, Routes, Link, useParams } from 'react-router-dom';
import './App.css';

const supabase = createClient(supabaseUrl, supabaseKey);

function Home() {
  const [bookmarks, setBookmarks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at'); // Default sorting by created time

  const fetchBookmarks = async () => {
    let { data, error } = await supabase.from('friendly').select('*');

    if (error) {
      console.error('Error fetching bookmarks:', error);
    } else {
      if (searchQuery) {
        data = data.filter(bookmark => bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()));
      }

      data = data.sort((a, b) => {
        if (sortBy === 'created_at') {
          return new Date(b.created_at) - new Date(a.created_at);
        } else if (sortBy === 'votes') {
          return b.votes - a.votes;
        }
        return 0;
      });

      setBookmarks(data);
    }
  }

  useEffect(() => {
    fetchBookmarks();
  }, [searchQuery, sortBy]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  }

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  }

  return (
    <div className="card">
      <div className="search-bar">
        <input type="text" placeholder="Search posts" value={searchQuery} onChange={handleSearchChange} />
        <button onClick={fetchBookmarks}>Search</button>
      </div>
      <div className="sort-bar">
        <label>Sort by:</label>
        <select value={sortBy} onChange={handleSortChange}>
          <option value="created_at">Created Time</option>
          <option value="votes">Upvotes</option>
        </select>
      </div>
      {bookmarks.map((bookmark, index) => (
        <div key={index} className="bookmark">
          <Link to={`/post/${bookmark.id}`}>
            <p className="bookmark-title">{bookmark.title}</p>
            <p className="bookmark-created">{bookmark.created_at}</p>
            <p className="bookmark-votes">Upvotes: {bookmark.votes}</p>
          </Link>
        </div>
      ))}
    </div>
  );
}

function PostDetails() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  const fetchPostDetails = async () => {
    const { data, error } = await supabase.from('friendly').select('*').eq('id', id);
    if (error) {
      console.error('Error fetching post details:', error);
    } else if (data.length > 0) {
      setPost(data[0]);
      setEditedTitle(data[0].title);
    }
  }

  const fetchComments = async () => {
    const { data, error } = await supabase.from('comments').select('*').eq('post_id', id);
    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      setComments(data);
    }
  }

  const handleCommentTextChange = (e) => {
    setCommentText(e.target.value);
  }

  const addComment = async () => {
    if (commentText) {
      const { data, error } = await supabase.from('comments').upsert([
        {
          post_id: id,
          text: commentText,
        },
      ]);

      if (error) {
        console.error('Error adding comment:', error);
      } else {
        setCommentText('');
        fetchComments();
      }
    }
  }

  const handleUpvote = async () => {
    if (post) {
      const { data, error } = await supabase
        .from('friendly')
        .upsert([
          {
            id: post.id,
            votes: post.votes + 1,
          },
        ]);

      if (error) {
        console.error('Error upvoting the post:', error);
      } else {
        fetchPostDetails();
      }
    }
  }

  const handleEdit = async () => {
    setIsEditing(true);
  }

  const saveEdit = async () => {
    if (editedTitle) {
      const { data, error } = await supabase
        .from('friendly')
        .upsert([
          {
            id: post.id,
            title: editedTitle,
          },
        ]);

      if (error) {
        console.error('Error editing the post:', error);
      } else {
        setIsEditing(false);
        fetchPostDetails();
      }
    }
  }

  const cancelEdit = () => {
    setIsEditing(false);
    setEditedTitle(post.title);
  }

  const deletePost = async () => {
    const confirmation = window.confirm('Are you sure you want to delete this post?');
  
    if (confirmation) {
      // First, delete comments associated with the post from 'comments2'
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments2')
        .delete()
        .eq('post_id', id);
  
      if (commentsError) {
        console.error('Error deleting comments:', commentsError);
      }
  
      // Then, delete the post from 'friendly'
      const { data, error } = await supabase.from('friendly').delete().eq('id', id);
  
      if (error) {
        console.error('Error deleting the post:', error);
      } else {
        // Post and associated comments have been deleted
        // You can navigate to a different page or perform any other actions here.
      }
    }
  }  

  useEffect(() => {
    fetchPostDetails();
    fetchComments();
  }, [id]);

  return (
    <div className="post-details">
      {post ? (
        <>
          {isEditing ? (
            <div>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
              />
              <button onClick={saveEdit}>Save</button>
              <button onClick={cancelEdit}>Cancel</button>
            </div>
          ) : (
            <h1>{post.title}</h1>
          )}
          <p>Created at: {post.created_at}</p>
          <p>Upvotes: {post.votes}</p>
          <button onClick={handleUpvote}>Upvote</button>
          <button onClick={handleEdit}>Edit Post</button>
          <button onClick={deletePost}>Delete Post</button>
        </>
      ) : (
        <p>Loading...</p>
      )}

      <div className="comments">
        <h2>Comments</h2>
        <input
          type="text"
          placeholder="Add a comment"
          value={commentText}
          onChange={handleCommentTextChange}
        />
        <button onClick={addComment}>Add Comment</button>
        <ul>
          {comments.map((comment, index) => (
            <li key={index}>{comment.text}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function App() {
  const [isCreatingPost, setCreatingPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');

  const openCreatePostModal = () => {
    setCreatingPost(true);
  }

  const closeCreatePostModal = () => {
    setCreatingPost(false);
  }

  const handleTitleChange = (e) => {
    setNewPostTitle(e.target.value);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from('friendly')
      .upsert([
        {
          title: newPostTitle,
          created_at: new Date().toISOString(),
          votes: 0,
        },
      ]);

    if (error) {
      console.error('Error creating the post:', error);
    } else {
      closeCreatePostModal();
    }
  }

  return (
    <Router>
      <div className="header">
        <button className="create-post-button" onClick={openCreatePostModal}>Create New Post</button>
      </div>

      {isCreatingPost && (
        <div className="modal">
          <div className="modal-content">
            <h2>Create New Post</h2>
            <form onSubmit={handleSubmit}>
              <label htmlFor="postTitle">Title:</label>
              <input
                type="text"
                id="postTitle"
                value={newPostTitle}
                onChange={handleTitleChange}
                required
              />
              <button type="submit">Submit</button>
            </form>
            <button onClick={closeCreatePostModal}>Close</button>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/post/:id" element={<PostDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
