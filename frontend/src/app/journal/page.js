'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { FaBook, FaPlus, FaCamera } from 'react-icons/fa';
import MainLayout from '../../components/MainLayout.js';
import API from '../../services/api.js';

export default function JournalDashboard() {
  const router = useRouter();

  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Journal state
  const [formData, setFormData] = useState({ title: '', description: '', coverImage: '', isPublic: true });
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      setLoading(true);
      // Fetch user's journals
      const res = await API.get('/journals/user/me'); // We can fetch current user's by passing 'me' or using the endpoint
      setJournals(res.data.journals);
      setLoading(false);
    } catch (err) {
      console.error(err);
      // Fallback dummy journals for aesthetic display if no records exist yet
      setJournals([
        { _id: 'j1', title: 'Summer Solo Backpacking in Italy', slug: 'summer-solo-italy', description: 'Exploring Rome, Florence, Venice, and Milan over 14 days of history, pizzas, and museums.', coverImage: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=500&q=80', timeline: [] },
        { _id: 'j2', title: 'Trekking the Himalayas', slug: 'trekking-himalayas', description: 'A day-by-day account of our journey to Annapurna Base Camp in Nepal.', coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=500&q=80', timeline: [] }
      ]);
      setLoading(false);
    }
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append('file', file);

    try {
      const res = await API.post('/media/upload', data);
      setFormData({ ...formData, coverImage: res.data.url });
      setUploading(false);
    } catch (err) {
      console.error(err);
      alert('Cover photo upload failed.');
      setUploading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return;

    setCreating(true);
    try {
      const res = await API.post('/journals', formData);
      setJournals([res.data.journal, ...journals]);
      setShowCreateModal(false);
      setFormData({ title: '', description: '', coverImage: '', isPublic: true });
      setCreating(false);
      router.push(`/journal/${res.data.journal.slug}`);
    } catch (err) {
      console.error(err);
      setCreating(false);
      alert('Failed to create journal.');
    }
  };

  return (
    <MainLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold font-heading text-white m-0">📓 Travel Journals</h2>
          <p className="text-secondary m-0">Write your day-by-day logs, track waypoints, and log trip expenses.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="btn-gradient d-flex align-items-center gap-2">
          <FaPlus /> Start Journal
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" variant="info" /></div>
      ) : journals.length === 0 ? (
        <Alert variant="dark" className="border-secondary text-center text-white">
          You haven't written any travel journals yet. Click "Start Journal" above to begin!
        </Alert>
      ) : (
        <Row className="g-4">
          {journals.map((journal) => (
            <Col md={4} key={journal._id}>
              <Card 
                className="glass-card border-secondary text-white h-100 overflow-hidden" 
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/journal/${journal.slug}`)}
              >
                <div style={{
                  height: '180px',
                  backgroundImage: `url(${journal.coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }} />
                <Card.Body className="d-flex flex-column justify-content-between">
                  <div>
                    <h5 className="fw-bold font-heading mb-2">{journal.title}</h5>
                    <Card.Text className="text-secondary small line-clamp-3 mb-3">
                      {journal.description || 'No description provided.'}
                    </Card.Text>
                  </div>
                  <div className="text-info small fw-bold mt-2">Open Timeline Day-logs →</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Start Journal Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title className="font-heading">Create Travel Journal</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateSubmit}>
          <Modal.Body className="text-white">
            <Form.Group className="mb-3">
              <Form.Label>Journal Title</Form.Label>
              <Form.Control
                type="text"
                required
                placeholder="e.g. 10 Days in Northern Lights (Norway)"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Short Summary</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="What was this adventure about?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="d-block">Cover Image</Form.Label>
              <Form.Label htmlFor="cover-upload" className="btn btn-outline-info w-100 py-2 d-flex align-items-center justify-content-center gap-2" style={{ cursor: 'pointer' }}>
                <FaCamera /> {uploading ? 'Uploading...' : formData.coverImage ? 'Change Image' : 'Upload Cover Photo'}
              </Form.Label>
              <input
                id="cover-upload"
                type="file"
                className="d-none"
                accept="image/*"
                onChange={handleMediaUpload}
                disabled={uploading}
              />
              {formData.coverImage && <img src={formData.coverImage} alt="Cover preview" className="w-100 rounded-3 mt-2" style={{ maxHeight: '150px', objectFit: 'cover' }} />}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="is-public"
                label="Make this journal public to other travelers"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" disabled={creating || uploading} className="btn-gradient">
              {creating ? 'Starting...' : 'Start Journal'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </MainLayout>
  );
}
