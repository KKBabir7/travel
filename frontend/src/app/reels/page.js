'use client';

import { useEffect, useState, useRef } from 'react';
import { Container, Button, Modal, Form, Spinner, Card } from 'react-bootstrap';
import { FaHeart, FaComment, FaShare, FaBookmark, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import MainLayout from '../../components/MainLayout.js';
import API from '../../services/api.js';

export default function ReelsPage() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [selectedReelId, setSelectedReelId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      setLoading(true);
      const res = await API.get('/posts/reels?limit=10');
      // For demonstration, if database has no reels, fallback to premium nature stock videos
      if (res.data.reels && res.data.reels.length > 0) {
        setReels(res.data.reels);
      } else {
        setReels([
          {
            _id: 'mock-reel-1',
            content: 'Exploring the breathtaking view of the Swiss Alps! 🏔️✨',
            mediaUrls: ['https://assets.mixkit.co/videos/preview/mixkit-beautiful-aerial-view-of-a-mountain-valley-42232-large.mp4'],
            user: { displayName: 'Swiss Wanderer', username: 'swiss_wand', profilePicture: '' },
            likesCount: 1250,
            commentsCount: 84
          },
          {
            _id: 'mock-reel-2',
            content: 'Scuba diving in the clear turquoise waters of Maldives! 🐠🌊',
            mediaUrls: ['https://assets.mixkit.co/videos/preview/mixkit-underwater-shot-of-a-coral-reef-with-fishes-43152-large.mp4'],
            user: { displayName: 'Aqua Explorer', username: 'aqua_exp', profilePicture: '' },
            likesCount: 940,
            commentsCount: 52
          }
        ]);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleLike = async (id) => {
    try {
      if (id.startsWith('mock-')) {
        setReels(reels.map(r => r._id === id ? { ...r, likesCount: r.likesCount + 1 } : r));
        return;
      }
      const res = await API.post(`/posts/react/${id}`);
      setReels(reels.map(r => r._id === id ? { ...r, likesCount: res.data.likesCount } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const openComments = async (reelId) => {
    setSelectedReelId(reelId);
    setShowComments(true);
    if (reelId.startsWith('mock-')) {
      setComments([
        { _id: 'c1', user: { displayName: 'Alex', username: 'alex' }, content: 'Absolutely gorgeous!' },
        { _id: 'c2', user: { displayName: 'Sophia', username: 'sophia' }, content: 'Added to my bucket list!' }
      ]);
      return;
    }
    
    try {
      setLoadingComments(true);
      const res = await API.get(`/posts/comments/${reelId}`);
      setComments(res.data.comments);
      setLoadingComments(false);
    } catch (err) {
      console.error(err);
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (selectedReelId.startsWith('mock-')) {
      setComments([...comments, {
        _id: Date.now().toString(),
        user: { displayName: 'Me', username: 'me' },
        content: newComment
      }]);
      setNewComment('');
      return;
    }

    try {
      const res = await API.post(`/posts/comment/${selectedReelId}`, { content: newComment });
      setComments([res.data.comment, ...comments]);
      setNewComment('');
      // Update count on list
      setReels(reels.map(r => r._id === selectedReelId ? { ...r, commentsCount: r.commentsCount + 1 } : r));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <MainLayout><div className="text-center py-5"><Spinner animation="border" variant="info" /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <Container className="d-flex justify-content-center">
        <div 
          className="reels-container" 
          style={{
            width: '100%',
            maxWidth: '400px',
            height: 'calc(100vh - 120px)',
            scrollSnapType: 'y mandatory',
            overflowY: 'scroll',
            borderRadius: '16px',
            border: '1px solid var(--border-glass)'
          }}
        >
          {reels.map((reel) => (
            <div 
              key={reel._id} 
              className="reel-item position-relative w-100 d-flex align-items-center justify-content-center bg-black"
              style={{ height: '100%', scrollSnapAlign: 'start' }}
            >
              {/* Reel Video */}
              <video
                src={reel.mediaUrls[0]}
                autoPlay
                loop
                muted={muted}
                className="w-100 h-100"
                style={{ objectFit: 'cover' }}
                onClick={() => setMuted(!muted)}
              />

              {/* Mute Toggle Overlay */}
              <div 
                className="position-absolute top-0 end-0 m-3 p-2 rounded-circle text-white bg-dark bg-opacity-50"
                style={{ cursor: 'pointer', zIndex: 10 }}
                onClick={() => setMuted(!muted)}
              >
                {muted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
              </div>

              {/* Right Sidebar Interaction Bar */}
              <div 
                className="position-absolute end-0 bottom-0 mb-5 me-3 d-flex flex-column gap-4 align-items-center"
                style={{ zIndex: 10 }}
              >
                <div className="d-flex flex-column align-items-center text-white" style={{ cursor: 'pointer' }} onClick={() => handleLike(reel._id)}>
                  <Button variant="dark" className="rounded-circle bg-opacity-50 p-3 mb-1 border-0"><FaHeart className="text-danger" size={20} /></Button>
                  <span className="small fw-bold">{reel.likesCount}</span>
                </div>

                <div className="d-flex flex-column align-items-center text-white" style={{ cursor: 'pointer' }} onClick={() => openComments(reel._id)}>
                  <Button variant="dark" className="rounded-circle bg-opacity-50 p-3 mb-1 border-0"><FaComment size={20} /></Button>
                  <span className="small fw-bold">{reel.commentsCount}</span>
                </div>

                <div className="d-flex flex-column align-items-center text-white" style={{ cursor: 'pointer' }}>
                  <Button variant="dark" className="rounded-circle bg-opacity-50 p-3 mb-1 border-0"><FaBookmark size={20} /></Button>
                  <span className="small fw-bold">Save</span>
                </div>

                <div className="d-flex flex-column align-items-center text-white" style={{ cursor: 'pointer' }}>
                  <Button variant="dark" className="rounded-circle bg-opacity-50 p-3 mb-1 border-0"><FaShare size={20} /></Button>
                  <span className="small fw-bold">Share</span>
                </div>
              </div>

              {/* Bottom Info Overlay */}
              <div 
                className="position-absolute start-0 bottom-0 w-100 p-4 text-white"
                style={{
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                  zIndex: 5
                }}
              >
                <div className="d-flex align-items-center gap-2 mb-2">
                  <img
                    src={reel.user?.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}
                    alt={reel.user?.displayName}
                    className="rounded-circle border"
                    width="32"
                    height="32"
                  />
                  <div className="fw-bold">{reel.user?.displayName}</div>
                  <div className="text-secondary small">@{reel.user?.username}</div>
                </div>
                <p className="small m-0 text-light line-clamp-2">{reel.content}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* Slide up Comments Modal */}
      <Modal show={showComments} onHide={() => setShowComments(false)} centered scrollable>
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title className="small font-heading">Comments</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          {loadingComments ? (
            <div className="text-center py-4"><Spinner animation="border" variant="info" /></div>
          ) : comments.length === 0 ? (
            <p className="text-center text-secondary">Be the first to comment on this reel!</p>
          ) : (
            <div className="d-flex flex-column gap-3 mb-3">
              {comments.map((comment) => (
                <div key={comment._id} className="d-flex gap-2 align-items-start">
                  <img
                    src={comment.user?.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}
                    alt={comment.user?.displayName}
                    className="rounded-circle"
                    width="32"
                    height="32"
                  />
                  <div>
                    <span className="fw-bold small me-2">{comment.user?.displayName}</span>
                    <span className="text-secondary small">@{comment.user?.username}</span>
                    <p className="small m-0 text-light mt-1">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Form onSubmit={handleAddComment} className="mt-3">
            <Form.Group className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="bg-secondary text-white"
              />
              <Button type="submit" className="btn-gradient px-4">Post</Button>
            </Form.Group>
          </Form>
        </Modal.Body>
      </Modal>
    </MainLayout>
  );
}
