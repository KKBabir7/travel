'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import { Row, Col, Card, Button, Tabs, Tab, Spinner, Alert, ListGroup, Form } from 'react-bootstrap';
import { FaGlobe, FaPlane, FaLink, FaMapMarkerAlt, FaHeart, FaComment, FaPlus } from 'react-icons/fa';
import MainLayout from '../../../components/MainLayout.js';
import API from '../../../services/api.js';
import { updateUser } from '../../../redux/authSlice.js';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { username } = params;
  const { user: currentUser } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [error, setError] = useState('');

  // Editing profile state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '', website: '', country: '', city: '',
    languages: '', travelInterests: '', visitedCountries: '', visitedCities: ''
  });

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      const profileRes = await API.get(`/profiles/${username}`);
      setProfile(profileRes.data.data);

      const postsRes = await API.get(`/profiles/${username}`); // We'll query post database for timeline below
      const timelineRes = await API.get(`/posts/feed?limit=20`); // Fallback feeds, or direct user posts
      // Filter posts belonging to profile user
      const userPosts = timelineRes.data.posts.filter(p => p.user?.username === username);
      setPosts(userPosts);

      // Fetch user journals
      const journalsRes = await API.get(`/journals/user/${username}`);
      setJournals(journalsRes.data.journals);

      // If own profile, fetch saved posts
      if (currentUser?.username === username) {
        // Mock or retrieve saved content
        setSavedItems([]);
      }

      // Populate edit form
      const u = profileRes.data.data.user;
      setEditForm({
        bio: u.bio || '',
        website: u.website || '',
        country: u.country || '',
        city: u.city || '',
        languages: u.languages?.join(', ') || '',
        travelInterests: u.travelInterests?.join(', ') || '',
        visitedCountries: u.visitedCountries?.join(', ') || '',
        visitedCities: u.visitedCities?.join(', ') || ''
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load profile. This traveler may not exist.');
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile) return;
    try {
      if (profile.isFollowing) {
        await API.post(`/profiles/unfollow/${profile.user._id}`);
        setProfile({
          ...profile,
          isFollowing: false,
          stats: { ...profile.stats, followersCount: Math.max(0, profile.stats.followersCount - 1) }
        });
      } else {
        await API.post(`/profiles/follow/${profile.user._id}`);
        setProfile({
          ...profile,
          isFollowing: true,
          stats: { ...profile.stats, followersCount: profile.stats.followersCount + 1 }
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editForm,
        languages: editForm.languages.split(',').map(s => s.trim()).filter(Boolean),
        travelInterests: editForm.travelInterests.split(',').map(s => s.trim()).filter(Boolean),
        visitedCountries: editForm.visitedCountries.split(',').map(s => s.trim()).filter(Boolean),
        visitedCities: editForm.visitedCities.split(',').map(s => s.trim()).filter(Boolean)
      };

      const res = await API.put('/profiles/update', payload);
      dispatch(updateUser(res.data.user));
      setProfile({
        ...profile,
        user: res.data.user
      });
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update profile.');
    }
  };

  if (loading) {
    return <MainLayout><div className="text-center py-5"><Spinner animation="border" variant="info" /></div></MainLayout>;
  }

  if (error || !profile) {
    return <MainLayout><Alert variant="danger" className="text-center">{error || 'User not found'}</Alert></MainLayout>;
  }

  const { user, stats } = profile;

  return (
    <MainLayout>
      <Card className="border-secondary text-white mb-4 overflow-hidden">
        {/* Cover Photo */}
        <div style={{
          height: '250px',
          backgroundImage: `url(${user.coverPhoto || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />

        {/* Profile Info Overlay */}
        <Card.Body className="position-relative pt-0 px-4">
          <Row className="align-items-end" style={{ marginTop: '-75px' }}>
            <Col xs="auto">
              <img
                src={user.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}
                alt={user.displayName}
                className="rounded-circle border border-dark border-4 bg-dark"
                width="150"
                height="150"
                style={{ objectFit: 'cover' }}
              />
            </Col>
            
            <Col className="mb-2">
              <div className="d-flex align-items-center gap-2">
                <h2 className="fw-bold m-0 font-heading">{user.displayName}</h2>
                {user.isVerified && <span className="text-info fs-4" title="Verified Traveler">✓</span>}
              </div>
              <p className="text-secondary m-0">@{user.username}</p>
            </Col>

            <Col xs="auto" className="mb-2">
              {isOwnProfile ? (
                <Button variant="outline-info" onClick={() => setEditing(true)}>Edit Profile</Button>
              ) : (
                <Button 
                  variant={profile.isFollowing ? "outline-secondary" : "info"} 
                  onClick={handleFollowToggle}
                  className="rounded-pill px-4"
                >
                  {profile.isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
            </Col>
          </Row>

          <hr className="border-secondary my-4" />

          {/* User Bio and details */}
          <Row className="g-4">
            <Col md={8}>
              <h5 className="fw-bold text-gradient mb-2 font-heading">Biography</h5>
              <p className="text-light">{user.bio || 'This traveler has not written a bio yet.'}</p>
              
              <div className="d-flex flex-wrap gap-4 mt-3 small text-secondary">
                {user.city && <span><FaMapMarkerAlt className="text-warning me-1" /> {user.city}, {user.country}</span>}
                {user.website && <span><FaLink className="text-info me-1" /> <a href={user.website} target="_blank" className="text-info text-decoration-none">{user.website}</a></span>}
                <span><FaPlane className="text-success me-1" /> {stats.postsCount} experiences shared</span>
              </div>
            </Col>

            <Col md={4} className="border-start border-secondary">
              <div className="d-flex justify-content-around text-center py-2">
                <div>
                  <h4 className="fw-bold m-0">{stats.followersCount}</h4>
                  <span className="small text-secondary">Followers</span>
                </div>
                <div>
                  <h4 className="fw-bold m-0">{stats.followingCount}</h4>
                  <span className="small text-secondary">Following</span>
                </div>
                <div>
                  <h4 className="fw-bold m-0">{journals.length}</h4>
                  <span className="small text-secondary">Journals</span>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabs list */}
      <Tabs defaultActiveKey="timeline" id="profile-tabs" className="mb-4 border-secondary">
        <Tab eventKey="timeline" title="Timeline">
          <Row>
            {/* Left Col: Travel Stats & Interests */}
            <Col md={4}>
              <Card className="glass-card border-secondary text-white p-3 mb-4">
                <Card.Title className="fw-bold small text-secondary uppercase tracking-wider mb-3">Travel Stats</Card.Title>
                <ListGroup variant="flush" className="bg-transparent text-white">
                  <ListGroup.Item className="bg-transparent text-white border-secondary px-0 py-2 d-flex justify-content-between">
                    <span>Visited Countries</span>
                    <span className="fw-bold">{user.visitedCountries?.length || 0}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="bg-transparent text-white border-secondary px-0 py-2 d-flex justify-content-between">
                    <span>Visited Cities</span>
                    <span className="fw-bold">{user.visitedCities?.length || 0}</span>
                  </ListGroup.Item>
                </ListGroup>

                <Card.Title className="fw-bold small text-secondary uppercase tracking-wider mb-2 mt-4">Interests</Card.Title>
                <div className="d-flex flex-wrap gap-2">
                  {user.travelInterests?.map(interest => (
                    <span key={interest} className="badge bg-secondary">{interest}</span>
                  )) || <span className="text-secondary small">No interests declared yet.</span>}
                </div>
              </Card>
            </Col>

            {/* Right Col: Posts */}
            <Col md={8}>
              {posts.length === 0 ? (
                <Alert variant="dark" className="border-secondary text-center text-white">No timeline experiences to show.</Alert>
              ) : (
                posts.map(post => (
                  <Card key={post._id} className="glass-card mb-4 border-secondary text-white">
                    <Card.Body>
                      <div className="fw-bold small text-secondary mb-2">{new Date(post.createdAt).toLocaleDateString()}</div>
                      <Card.Text>{post.content}</Card.Text>
                      {post.mediaUrls?.map(url => (
                        <img key={url} src={url} alt="Timeline media" className="w-100 rounded-3 mb-3" style={{ maxHeight: '350px', objectFit: 'cover' }} />
                      ))}
                    </Card.Body>
                  </Card>
                ))
              )}
            </Col>
          </Row>
        </Tab>
        
        <Tab eventKey="journals" title="Travel Journals">
          <Row className="g-4">
            {journals.length === 0 ? (
              <Col xs={12}><Alert variant="dark" className="border-secondary text-center text-white">No travel journals published yet.</Alert></Col>
            ) : (
              journals.map(journal => (
                <Col md={6} key={journal._id}>
                  <Card className="glass-card border-secondary text-white h-100 overflow-hidden" style={{ cursor: 'pointer' }} onClick={() => router.push(`/journal/${journal.slug}`)}>
                    <div style={{
                      height: '160px',
                      backgroundImage: `url(${journal.coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }} />
                    <Card.Body>
                      <Card.Title className="fw-bold font-heading">{journal.title}</Card.Title>
                      <Card.Text className="text-secondary small line-clamp-2">{journal.description}</Card.Text>
                      <div className="text-info small fw-bold">View Day logs →</div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            )}
          </Row>
        </Tab>
      </Tabs>

      {/* Edit Profile Modal */}
      <Modal show={editing} onHide={() => setEditing(false)} size="lg">
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>Edit Profile Details</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body className="text-white">
            <Form.Group className="mb-3">
              <Form.Label>Biography</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={editForm.bio} 
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Website URL</Form.Label>
              <Form.Control 
                type="text" 
                value={editForm.website} 
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} 
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Country</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={editForm.country} 
                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} 
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>City</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={editForm.city} 
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} 
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Travel Interests (comma separated)</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g. Hiking, Backpacking, Foodie" 
                value={editForm.travelInterests} 
                onChange={(e) => setEditForm({ ...editForm, travelInterests: e.target.value })} 
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Visited Countries (comma separated)</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g. Bangladesh, India, UK" 
                    value={editForm.visitedCountries} 
                    onChange={(e) => setEditForm({ ...editForm, visitedCountries: e.target.value })} 
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Visited Cities (comma separated)</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g. Dhaka, Delhi, London" 
                    value={editForm.visitedCities} 
                    onChange={(e) => setEditForm({ ...editForm, visitedCities: e.target.value })} 
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            <Button type="submit" className="btn-gradient">Save Changes</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </MainLayout>
  );
}
