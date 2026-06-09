'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Container, Row, Col, Navbar, Nav, Dropdown, Badge, Form, InputGroup } from 'react-bootstrap';
import { 
  FaHome, FaGlobe, FaCompass, FaVideo, FaBook, FaBlog, 
  FaUsers, FaCalendarAlt, FaBookmark, FaUser, FaBell, 
  FaSignOutAlt, FaSearch, FaShieldAlt, FaComments 
} from 'react-icons/fa';
import { logout } from '../redux/authSlice.js';
import { addNotification, setNotifications } from '../redux/notificationSlice.js';
import API from '../services/api.js';

// Setup socket reference
import { io } from 'socket.io-client';
let socket = null;
export const getSocket = () => socket;

export default function MainLayout({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, isAuthenticated } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notification);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsList, setNotificationsList] = useState([]);

  // Auth Guard
  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/login');
    }
  }, [isAuthenticated, token, router]);

  // Load initial notifications & subscribe to SSE + Socket.IO
  useEffect(() => {
    if (!token) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const res = await API.get('/notifications');
        dispatch(setNotifications(res.data.notifications));
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    };
    fetchNotifications();

    // 1. Establish SSE Connection
    const sseUrl = `http://localhost:5000/api/events/subscribe?token=${token}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.addEventListener('notification', (e) => {
      const notif = JSON.parse(e.data);
      dispatch(addNotification(notif));
    });

    eventSource.onerror = (err) => {
      console.warn('SSE connection lost. Reconnecting...', err);
    };

    // 2. Establish Socket.IO connection
    socket = io('http://localhost:5000', {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('Socket.IO connection established');
    });

    return () => {
      eventSource.close();
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token, dispatch]);

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (err) {
      console.error(err);
    }
    dispatch(logout());
    router.push('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (!isAuthenticated || !user) {
    return <div className="text-center mt-5">Loading TravelSphere...</div>;
  }

  const isAdmin = user.roles.some(role => ['Admin', 'Super Admin'].includes(role));

  const navItems = [
    { name: 'Feed', path: '/', icon: <FaHome /> },
    { name: 'Explore', path: '/explore', icon: <FaCompass /> },
    { name: 'Travel Map', path: '/travel-map', icon: <FaGlobe /> },
    { name: 'Reels', path: '/reels', icon: <FaVideo /> },
    { name: 'Journals', path: '/journal', icon: <FaBook /> },
    { name: 'Blogs', path: '/blog', icon: <FaBlog /> },
    { name: 'Groups', path: '/group', icon: <FaUsers /> },
    { name: 'Events', path: '/event', icon: <FaCalendarAlt /> },
    { name: 'Saved', path: '/saved', icon: <FaBookmark /> },
    { name: 'Messages', path: '/messages', icon: <FaComments /> },
  ];

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Top Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="border-bottom border-secondary sticky-top py-2 px-4 glass-panel">
        <Container fluid>
          <Navbar.Brand as={Link} href="/" className="fw-bold text-gradient fs-4 font-heading">
            ✈️ TravelSphere
          </Navbar.Brand>
          
          <Form onSubmit={handleSearchSubmit} className="d-flex ms-auto me-4 col-12 col-md-4">
            <InputGroup>
              <Form.Control
                type="search"
                placeholder="Search destinations, users..."
                className="bg-secondary border-0 text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <InputGroup.Text className="bg-secondary border-0 text-muted">
                <FaSearch onClick={handleSearchSubmit} style={{ cursor: 'pointer' }} />
              </InputGroup.Text>
            </InputGroup>
          </Form>

          <Nav className="d-flex align-items-center gap-3">
            <Nav.Link as={Link} href="/notifications" className="position-relative text-white fs-5 p-1">
              <FaBell />
              {unreadCount > 0 && (
                <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle" style={{ fontSize: '10px' }}>
                  {unreadCount}
                </Badge>
              )}
            </Nav.Link>
            
            <Dropdown align="end">
              <Dropdown.Toggle as="div" className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                <img
                  src={user.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}
                  alt={user.displayName}
                  className="rounded-circle border border-info"
                  width="36"
                  height="36"
                />
              </Dropdown.Toggle>

              <Dropdown.Menu className="bg-dark border-secondary">
                <Dropdown.Item as={Link} href={`/u/${user.username}`}>
                  <FaUser className="me-2 text-info" /> Profile
                </Dropdown.Item>
                {isAdmin && (
                  <Dropdown.Item as={Link} href="/admintravelsmain/dashboard">
                    <FaShieldAlt className="me-2 text-warning" /> Admin Panel
                  </Dropdown.Item>
                )}
                <Dropdown.Divider className="border-secondary" />
                <Dropdown.Item onClick={handleLogout} className="text-danger">
                  <FaSignOutAlt className="me-2" /> Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Container>
      </Navbar>

      {/* Main Body */}
      <Container fluid className="flex-grow-1 py-4">
        <Row>
          {/* Sidebar */}
          <Col md={3} lg={2} className="d-none d-md-block border-end border-secondary">
            <div className="sticky-top" style={{ top: '80px', zIndex: 10 }}>
              <Nav className="flex-column gap-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                  return (
                    <Nav.Link
                      key={item.name}
                      as={Link}
                      href={item.path}
                      className={`nav-link-custom ${isActive ? 'active' : ''}`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Nav.Link>
                  );
                })}
              </Nav>
            </div>
          </Col>

          {/* Core Content */}
          <Col xs={12} md={9} lg={10}>
            {children}
          </Col>
        </Row>
      </Container>
    </div>
  );
}
