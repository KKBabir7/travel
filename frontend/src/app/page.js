'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Button, Form, Tabs, Tab, Modal, Spinner, Alert, Navbar, Nav, InputGroup, Offcanvas } from 'react-bootstrap';
import { 
  FaPaperPlane, FaImage, FaMapMarkerAlt, FaHeart, FaComment, 
  FaShare, FaBookmark, FaStar, FaPhone, FaCompass, FaCalendarAlt, 
  FaCamera, FaChevronLeft, FaChevronRight, FaRegClock, FaUsers, FaArrowRight,
  FaSearch, FaBars, FaBolt, FaYoutube, FaTv, FaBook, FaColumns,
  FaHome, FaShoppingBag, FaFileAlt, FaGraduationCap, FaCommentAlt, FaShieldAlt, FaCog, FaBookOpen, FaLock
} from 'react-icons/fa';
import MainLayout from '../components/MainLayout.js';
import API from '../services/api.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Grid } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/grid';

export default function RootPage() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  if (isAuthenticated) {
    return <FeedPageContent />;
  }

  return <LandingPageContent />;
}

/* ==========================================
   LANDING PAGE COMPONENT (Logged Out)
   ========================================== */
function LandingPageContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('bolt');
  
  // A-Z sliders (letters list)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const [selectedPlaceLetter, setSelectedPlaceLetter] = useState('All');
  const [selectedEventLetter, setSelectedEventLetter] = useState('All');
  const placesPrevRef = useRef(null);
  const placesNextRef = useRef(null);
  const eventsPrevRef = useRef(null);
  const eventsNextRef = useRef(null);
  const photosPrevRef = useRef(null);
  const photosNextRef = useRef(null);
  const membersPrevRef = useRef(null);
  const membersNextRef = useRef(null);

  const photoScrollRef = useRef(null);
  const placeAlphaRef = useRef(null);
  const eventAlphaRef = useRef(null);

  const scrollPhotos = (direction) => {
    if (photoScrollRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      photoScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollAlphabet = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -150 : 150;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/login?redirect=explore&q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/login');
    }
  };

  const sidebarMenuItems = [
    { name: 'Home', icon: <FaHome />, active: true },
    { name: 'Features', icon: <FaBolt /> },
    { name: 'Market Place', icon: <FaShoppingBag /> },
    { name: 'Blogs', icon: <FaBookOpen /> },
    { name: 'Featured Pages', icon: <FaFileAlt /> },
    { name: 'Authentications', icon: <FaLock /> },
    { name: 'University Profile', icon: <FaGraduationCap /> },
    { name: 'Live Chat', icon: <FaCommentAlt /> },
    { name: 'Privacy Polices', icon: <FaShieldAlt /> },
    { name: 'Web Settings', icon: <FaCog /> }
  ];

  const renderVerticalMenuContent = () => (
    <div className="d-flex flex-column gap-1 py-1">
      {sidebarMenuItems.map((item, idx) => (
        <div 
          key={idx} 
          className={`sidebar-menu-item d-flex align-items-center justify-content-between rounded-3 ${item.active ? 'active' : ''}`}
          onClick={() => setShowSidebar(false)}
          style={{ cursor: 'pointer' }}
        >
          <div className="d-flex align-items-center gap-3">
            <span className="menu-icon-wrapper d-flex align-items-center justify-content-center">
              {item.icon}
            </span>
            <span className="menu-text">{item.name}</span>
          </div>
          <FaChevronRight className="menu-chevron-icon text-muted" style={{ fontSize: '0.725rem' }} />
        </div>
      ))}
    </div>
  );

  const renderSidebarContent = () => (
    <div className="d-flex flex-column gap-4">
      {/* Place of the Week */}
      <Card className="glass-card text-dark overflow-hidden shadow-sm" style={{ borderRadius: '0px' }}>
        <div style={{ height: '140px', backgroundImage: 'url("https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?auto=format&fit=crop&w=400&q=80")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <Card.Body className="p-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="badge bg-opacity-20 text-info border border-info border-opacity-30 small text-uppercase" style={{ backgroundColor: 'rgba(14, 165, 233, 0.15)', fontSize: '0.55rem' }}>Place of The Week</span>
            <div className="d-flex text-warning" style={{ fontSize: '11px' }}>
              {[...Array(5)].map((_, i) => <FaStar key={i} />)}
            </div>
          </div>
          <h5 className="fw-bold font-heading mb-1 text-dark" style={{ fontSize: '16px' }}>Shahid Minar</h5>
          <Card.Text className="small text-secondary m-0">A historic monument located in the heart of Dhaka, Bangladesh, representing structural beauty.</Card.Text>
        </Card.Body>
      </Card>

      {/* Event of the Week */}
      <Card className="glass-card text-dark overflow-hidden shadow-sm" style={{ borderRadius: '0px' }}>
        <div style={{ height: '140px', backgroundImage: 'url("https://images.unsplash.com/photo-1561489422-45e390d50680?auto=format&fit=crop&w=400&q=80")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <Card.Body className="p-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="badge bg-opacity-20 text-warning border border-warning border-opacity-30 small text-uppercase" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', fontSize: '0.55rem' }}>Event of The Week</span>
            <div className="d-flex text-warning" style={{ fontSize: '11px' }}>
              {[...Array(5)].map((_, i) => <FaStar key={i} />)}
            </div>
          </div>
          <h5 className="fw-bold font-heading mb-1 text-dark" style={{ fontSize: '16px' }}>Pohela Boisak</h5>
          <Card.Text className="small text-secondary m-0">Celebrating the Bengali New Year with vibrant colors, parades, and cultural performances.</Card.Text>
        </Card.Body>
      </Card>

      {/* Picture of the Week */}
      <Card className="glass-card text-dark overflow-hidden shadow-sm" style={{ borderRadius: '0px' }}>
        <div style={{ height: '140px', backgroundImage: 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <Card.Body className="p-3">
          <span className="badge bg-opacity-20 text-success border border-success border-opacity-30 small text-uppercase mb-2 d-inline-block" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', fontSize: '0.55rem' }}>Picture of The Week</span>
          <h5 className="fw-bold font-heading mb-1 text-dark" style={{ fontSize: '16px' }}>Tropical Paradise</h5>
          <Card.Text className="small text-secondary m-0">A breathtaking landscape capture of St. Martin island beach at high tide.</Card.Text>
        </Card.Body>
      </Card>

      {/* Story of the Week */}
      <Card className="glass-card text-dark overflow-hidden shadow-sm" style={{ borderRadius: '0px' }}>
        <div style={{ height: '140px', backgroundImage: 'url("https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <Card.Body className="p-3">
          <span className="badge bg-opacity-20 text-danger border border-danger border-opacity-30 small text-uppercase mb-2 d-inline-block" style={{ backgroundColor: 'rgba(244, 63, 94, 0.15)', fontSize: '0.55rem' }}>Story of The Week</span>
          <h5 className="fw-bold font-heading mb-1 text-dark" style={{ fontSize: '16px' }}>Backpacking Euro-Trip</h5>
          <Card.Text className="small text-secondary m-0">"Traveling through 5 countries in 15 days with just a 40L backpack..."</Card.Text>
        </Card.Body>
      </Card>
    </div>
  );

  // Expanded Places list with real Bangladesh spots for common letters
  const placesList = [
    { name: 'Ahsan Manzil', location: 'Dhaka', time: '1h 27m 50s', img: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Bandarban Hills', location: 'Bandarban', time: '4h 15m 00s', img: 'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: "Cox's Bazar Beach", location: "Cox's Bazar", time: '8h 30m 00s', img: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Dhaka Zoo', location: 'Dhaka', time: '2h 10m 00s', img: 'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Jaflong River', location: 'Sylhet', time: '5h 45m 00s', img: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Kuakata Sea Beach', location: 'Patuakhali', time: '9h 20m 00s', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Lalbagh Fort', location: 'Dhaka', time: '1h 50m 00s', img: 'https://images.unsplash.com/photo-1608958416719-798eb4b233a7?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Nijhum Dip', location: 'Noakhali', time: '6h 10m 00s', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Patenga Beach', location: 'Chittagong', time: '3h 40m 00s', img: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Shahid Minar', location: 'Dhaka', time: '1h 27m 50s', img: 'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Sajek Valley', location: 'Rangamati', time: '7h 15m 00s', img: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Sundarbans Forest', location: 'Khulna', time: '12h 00m 00s', img: 'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Madhabkunda Waterfall', location: 'Moulvibazar', time: '5h 00m 00s', img: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Ratargul Swamp Forest', location: 'Sylhet', time: '6h 00m 00s', img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Tanguar Haor', location: 'Sunamganj', time: '7h 30m 00s', img: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Bagerhat Mosque City', location: 'Bagerhat', time: '3h 20m 00s', img: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=350&h=230&q=80' }
  ];

  // Expanded Events list with real Bangladesh festivals for common letters
  const eventsList = [
    { name: 'Biju Festival', location: 'Rangamati', time: '3 days', img: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Dorga Mela', location: 'Noakhali', time: '1h 27m 50s', img: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Durga Puja', location: 'Dhaka', time: '5 days', img: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Eid Reunion', location: 'Dhaka', time: '1 day', img: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Lalon Smaran Utsab', location: 'Kushtia', time: '3 days', img: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Nabanna Utsab', location: 'Dhaka', time: '2 days', img: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Pohela Boisak', location: 'Dhaka', time: '1h 27m 50s', img: 'https://images.unsplash.com/photo-1561489422-45e390d50680?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Shakrain Festival', location: 'Dhaka', time: '1 day', img: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Baul Festival', location: 'Kushtia', time: '4 days', img: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Chaitra Sangkranti', location: 'Dhaka', time: '1 day', img: 'https://images.unsplash.com/photo-1561489422-45e390d50680?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Eid ul Fitr Mela', location: 'Chittagong', time: '3 days', img: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Fagunotsav', location: 'Dhaka', time: '1 day', img: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Ganga Snan', location: 'Sylhet', time: '1 day', img: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Harvest Festival', location: 'Rangpur', time: '2 days', img: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Independence Day Rally', location: 'Dhaka', time: '1 day', img: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=350&h=230&q=80' },
    { name: 'Jhum Festival', location: 'Bandarban', time: '2 days', img: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=350&h=230&q=80' }
  ];

  // Memoize shuffled lists so they only shuffle once when component mounts and don't re-shuffle on every render
  const shuffledPlaces = useMemo(() => {
    return [...placesList].sort(() => Math.random() - 0.5);
  }, []);

  const shuffledEvents = useMemo(() => {
    return [...eventsList].sort(() => Math.random() - 0.5);
  }, []);

  // Dynamic filter lists
  const filteredPlaces = selectedPlaceLetter === 'All'
    ? shuffledPlaces
    : placesList.filter(place => place.name.toLowerCase().startsWith(selectedPlaceLetter.toLowerCase()));

  const filteredEvents = selectedEventLetter === 'All'
    ? shuffledEvents
    : eventsList.filter(ev => ev.name.toLowerCase().startsWith(selectedEventLetter.toLowerCase()));

  // Members pictures list
  const photosList = [
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=260&h=180&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=260&h=180&q=80',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=260&h=180&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=260&h=180&q=80',
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=260&h=180&q=80',
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=260&h=180&q=80'
  ];

  // Members list with star ratings, locations, and roles
  const membersList = [
    { name: 'Muhammed Imran', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80', role: 'Ambassador', rating: 5, address: 'Dhaka, Bangladesh' },
    { name: 'Khademul Bashar', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80', role: 'Moderator', rating: 5, address: 'Chittagong, BD' },
    { name: 'Touhis Islam', img: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80', role: 'Explorer', rating: 5, address: 'Sylhet, Bangladesh' },
    { name: 'Sajid Rahman', img: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&h=150&q=80', role: 'Ambassador', rating: 5, address: 'Khulna, BD' },
    { name: 'Fahmida Yesmin', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80', role: 'Moderator', rating: 5, address: 'Rajshahi, BD' },
    { name: 'David Miller', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80', role: 'Explorer', rating: 5, address: 'London, UK' },
    { name: 'Mahrab Kabir', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80', role: 'Explorer', rating: 5, address: 'Barisal, BD' },
    { name: 'Nusrat Jahan', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80', role: 'Ambassador', rating: 5, address: 'Dhaka, Bangladesh' }
  ];

  return (
    <div className="d-flex flex-column min-vh-100 light-theme-landing">
      {/* Top landing navbar */}
      <Navbar expand="lg" className="sticky-top py-2 px-0 glass-panel" style={{ zIndex: 1030 }}>
        <Container fluid className="px-4">
          <Navbar.Brand onClick={() => router.push('/')} style={{ cursor: 'pointer' }} className="d-flex align-items-center gap-2 text-nowrap">
            <img src="/logo/logo.png" alt="IncredibleBD Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="landing-nav" />
          <Navbar.Collapse id="landing-nav" className="justify-content-between">
            <Form onSubmit={handleSearch} className="d-flex ms-lg-3 col-12 col-lg-3 my-2 my-lg-0" style={{ maxWidth: '260px' }}>
              <div className="search-bar-wrapper w-100 position-relative d-flex align-items-center">
                <FaSearch className="search-bar-icon position-absolute" onClick={handleSearch} style={{ cursor: 'pointer', left: '14px', zIndex: 10 }} />
                <Form.Control
                  type="search"
                  placeholder="Search places, festivals..."
                  className="search-bar-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </Form>

            <Nav className="gap-1 text-center align-items-center ms-auto me-3 text-nowrap">
              <Nav.Link href="#places" className="nav-link-custom py-1 px-2 text-nowrap">Places</Nav.Link>
              <Nav.Link href="#events" className="nav-link-custom py-1 px-2 text-nowrap">Events</Nav.Link>
              <Nav.Link href="#members" className="nav-link-custom py-1 px-2 text-nowrap">Members</Nav.Link>
              <Nav.Link href="#contact" className="nav-link-custom py-1 px-2 text-nowrap">Contact Us</Nav.Link>
            </Nav>

            <Nav className="gap-3 align-items-center justify-content-center">
              {/* Red Contact Pill badge matching mockup */}
              <Button variant="danger" className="d-flex align-items-center gap-2 px-3 border-0 fw-bold shadow-sm text-nowrap" style={{ backgroundColor: 'var(--accent-danger)' }}>
                <FaPhone className="phone-vibrate-icon" /> 01812212111
              </Button>
              {/* Sign In CTA */}
              <Button onClick={() => router.push('/login')} className="btn-gradient px-3 d-flex align-items-center gap-2 text-nowrap">
                <FaUsers /> Signup / Login
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Sub-header menu bar */}
      <div className="sub-navbar border-bottom d-flex align-items-center">
        <Container fluid className="d-flex align-items-center px-4">
          {/* Hamburger toggle button */}
          <Button 
            variant="link" 
            className="p-0 d-flex align-items-center justify-content-center sub-nav-hamburger" 
            onClick={() => setShowSidebar(true)}
            style={{ fontSize: '1.35rem', color: '#0ea5e9' }}
          >
            <FaBars />
          </Button>

          {/* Centralized Icon Tabs matching reference image */}
          <div className="sub-navbar-tabs d-flex align-items-center justify-content-center mx-auto">
            <div 
              className={`sub-navbar-tab-item ${activeSubTab === 'bolt' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('bolt')}
            >
              <FaBolt className="tab-icon" />
              <span className="tab-text">Explore</span>
            </div>
            <div 
              className={`sub-navbar-tab-item ${activeSubTab === 'video' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('video')}
            >
              <FaYoutube className="tab-icon" />
              <span className="tab-text">Videos</span>
            </div>
            <div 
              className={`sub-navbar-tab-item ${activeSubTab === 'tv' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('tv')}
            >
              <FaTv className="tab-icon" />
              <span className="tab-text">Courses</span>
            </div>
            <div 
              className={`sub-navbar-tab-item ${activeSubTab === 'book' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('book')}
            >
              <FaBook className="tab-icon" />
              <span className="tab-text">Guides</span>
            </div>
            <div 
              className={`sub-navbar-tab-item ${activeSubTab === 'columns' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('columns')}
            >
              <FaColumns className="tab-icon" />
              <span className="tab-text">Layout</span>
            </div>
            <div 
              className={`sub-navbar-tab-item ${activeSubTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('users')}
            >
              <FaUsers className="tab-icon" />
              <span className="tab-text">Members</span>
            </div>
          </div>
          
          {/* Empty spacer on the right to perfectly balance the centered tabs */}
          <div style={{ width: '24px' }}></div>
        </Container>
      </div>

      {/* Responsive Body Content Wrapper */}
      <div className="responsive-body-container flex-grow-1" style={{ backgroundColor: '#ffffff' }}>
        {/* Landing Body Grid */}
        <div className="py-4 px-4">
          <Row className="g-4">
          {/* Left Sidebar Cards (25% Width / 3 Columns) */}
          <Col lg={3} className="d-none d-lg-block">
            <div className="sticky-top" style={{ top: '130px', zIndex: 10 }}>
              {renderSidebarContent()}
            </div>
          </Col>

          {/* Main Content Areas (75% Width / 9 Columns) */}
          <Col lg={9}>
            
            {/* 1. Places Section */}
            <div id="places" className="mb-5 border-bottom pb-4" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>

              {/* Single-line Header Container */}
              <div className="d-flex align-items-center justify-content-between gap-3 mb-4 flex-wrap flex-md-nowrap">
                {/* 1. Title Block */}
                <h3 className="fw-bold font-heading text-dark m-0 d-flex align-items-center gap-2 text-nowrap" style={{ fontSize: '1.25rem' }}>
                  <FaMapMarkerAlt className="text-info" style={{ fontSize: '1.15rem' }} /> Places
                </h3>

                {/* 2. A-Z Block with separate bg */}
                <div className="d-flex align-items-center py-2 px-3 rounded-3 border gap-2 flex-grow-1" style={{ backgroundColor: '#f8fafc', borderColor: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  {/* Alphabet scroll area */}
                  <div 
                    ref={placeAlphaRef}
                    className="alphabet-scroll-container" 
                  >
                    {/* All button */}
                    <Button
                      variant="link"
                      className="alphabet-btn alphabet-btn-all"
                      style={{
                        color: selectedPlaceLetter === 'All' ? '#ffffff' : '#475569',
                        backgroundColor: selectedPlaceLetter === 'All' ? '#0ea5e9' : 'transparent',
                        border: selectedPlaceLetter === 'All' ? '1px solid #0ea5e9' : '1px solid transparent'
                      }}
                      onClick={() => setSelectedPlaceLetter('All')}
                    >All</Button>
                    {alphabet.map(letter => {
                      const isDisabled = false;
                      return (
                        <Button 
                          key={letter}
                          variant="link"
                          className="alphabet-btn alphabet-btn-letter"
                          style={{
                            color: isDisabled 
                              ? '#94a3b8' 
                              : (selectedPlaceLetter === letter ? '#ffffff' : '#475569'),
                            backgroundColor: !isDisabled && selectedPlaceLetter === letter 
                              ? '#0ea5e9' 
                              : 'transparent',
                            border: !isDisabled && selectedPlaceLetter === letter 
                              ? '1px solid #0ea5e9' 
                              : '1px solid transparent',
                            textDecoration: isDisabled ? 'line-through' : 'none',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            opacity: isDisabled ? 0.4 : 1
                          }}
                          onClick={() => { if (!isDisabled) setSelectedPlaceLetter(letter); }}
                        >{letter}</Button>
                      );
                    })}
                  </div>

                  {/* Alphabet scroll arrows */}
                  <div className="d-flex gap-1 flex-shrink-0 alphabet-arrows">
                    <Button 
                      variant="link"
                      onClick={() => scrollAlphabet(placeAlphaRef, 'left')}
                      className="text-secondary p-1 d-flex align-items-center justify-content-center border rounded-2"
                      style={{ width: '24px', height: '24px', backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.08)' }}
                    ><FaChevronLeft size={9} /></Button>
                    <Button 
                      variant="link"
                      onClick={() => scrollAlphabet(placeAlphaRef, 'right')}
                      className="text-secondary p-1 d-flex align-items-center justify-content-center border rounded-2"
                      style={{ width: '24px', height: '24px', backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.08)' }}
                    ><FaChevronRight size={9} /></Button>
                  </div>
                </div>

                {/* 3. Slider Arrow Block */}
                <div className="d-flex gap-1 flex-shrink-0">
                  <Button 
                    ref={placesPrevRef}
                    variant="link"
                    className="text-secondary p-1 d-flex align-items-center justify-content-center border rounded-2 slider-arrow-btn"
                    style={{ width: '28px', height: '28px', backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.08)' }}
                  ><FaChevronLeft size={10} /></Button>
                  <Button 
                    ref={placesNextRef}
                    variant="link"
                    className="text-secondary p-1 d-flex align-items-center justify-content-center border rounded-2 slider-arrow-btn"
                    style={{ width: '28px', height: '28px', backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.08)' }}
                  ><FaChevronRight size={10} /></Button>
                </div>
              </div>

              {/* Places 2-Row Grid Swiper */}
              {filteredPlaces.length === 0 ? (
                <div className="text-center py-5 text-muted border border-dashed rounded-3" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                  No places starting with &ldquo;{selectedPlaceLetter}&rdquo; found.
                </div>
              ) : (
                <div className="position-relative">
                  <Swiper
                    key="places-swiper-6col"
                    modules={[Navigation, Grid]}
                    navigation={{ prevEl: placesPrevRef.current, nextEl: placesNextRef.current }}
                    onSwiper={(swiper) => {
                      setTimeout(() => {
                        if (swiper.params && swiper.params.navigation) {
                          swiper.params.navigation.prevEl = placesPrevRef.current;
                          swiper.params.navigation.nextEl = placesNextRef.current;
                          swiper.navigation.destroy();
                          swiper.navigation.init();
                          swiper.navigation.update();
                        }
                      });
                    }}
                    grid={{ rows: 2, fill: 'row' }}
                    spaceBetween={14}
                    slidesPerView={6}
                    breakpoints={{
                      0: { slidesPerView: 2, grid: { rows: 2, fill: 'row' } },
                      576: { slidesPerView: 3, grid: { rows: 2, fill: 'row' } },
                      768: { slidesPerView: 4, grid: { rows: 2, fill: 'row' } },
                      992: { slidesPerView: 6, grid: { rows: 2, fill: 'row' } }
                    }}
                    className="places-grid-swiper"
                  >
                    {filteredPlaces.map((place, idx) => (
                      <SwiperSlide key={idx}>
                        <div 
                          onClick={() => router.push('/login')}
                          className="text-dark d-flex flex-column h-100 cursor-pointer mx-auto"
                          style={{ cursor: 'pointer', width: '140px' }}
                        >
                          <div 
                            className="mb-2" 
                            style={{ 
                              height: '100px', 
                              width: '140px',
                              backgroundImage: `url(${place.img})`, 
                              backgroundSize: 'cover', 
                              backgroundPosition: 'center',
                              borderRadius: '0px'
                            }} 
                          />
                          <div className="d-flex text-warning mb-1" style={{ fontSize: '8px' }}>
                            {[...Array(5)].map((_, i) => <FaStar key={i} style={{ fontSize: '8px' }} />)}
                          </div>
                          <h6 className="fw-bold font-heading mb-1 text-dark text-truncate" style={{ fontSize: '0.6rem', lineHeight: '1.2' }}>
                            {place.name} <span className="text-secondary fw-normal">({place.location})</span>
                          </h6>
                          <div className="text-muted d-flex align-items-center gap-1 mt-1" style={{ fontSize: '0.55rem', fontWeight: '500' }}>
                            <FaRegClock style={{ fontSize: '0.55rem' }} /> {place.time}
                          </div>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              )}
              <div className="text-end mt-3">
                <span onClick={() => router.push('/login')} className="text-info small fw-bold cursor-pointer" style={{ cursor: 'pointer' }}>
                  View All Places →
                </span>
              </div>
            </div>

            {/* 2. Events Section */}
            <div id="events" className="mb-5 border-bottom pb-4" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>              {/* Single-line Header Container */}
              <div className="d-flex align-items-center justify-content-between gap-3 mb-4 flex-wrap flex-md-nowrap">
                {/* 1. Title Block */}
                <h3 className="fw-bold font-heading text-dark m-0 d-flex align-items-center gap-2 text-nowrap" style={{ fontSize: '1.25rem' }}>
                  <FaCalendarAlt className="text-warning" style={{ fontSize: '1.15rem' }} /> Events
                </h3>

                {/* 2. A-Z Block with separate bg */}
                <div className="d-flex align-items-center py-2 px-3 rounded-3 border gap-2 flex-grow-1" style={{ backgroundColor: '#f8fafc', borderColor: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  {/* Alphabet scroll area */}
                  <div 
                    ref={eventAlphaRef}
                    className="alphabet-scroll-container" 
                  >
                    {/* All button */}
                    <Button
                      variant="link"
                      className="alphabet-btn alphabet-btn-all"
                      style={{
                        color: selectedEventLetter === 'All' ? '#ffffff' : '#475569',
                        backgroundColor: selectedEventLetter === 'All' ? '#f59e0b' : 'transparent',
                        border: selectedEventLetter === 'All' ? '1px solid #f59e0b' : '1px solid transparent'
                      }}
                      onClick={() => setSelectedEventLetter('All')}
                    >All</Button>
                    {alphabet.map(letter => {
                      const isDisabled = false;
                      return (
                        <Button 
                          key={letter}
                          variant="link"
                          className="alphabet-btn alphabet-btn-letter"
                          style={{
                            color: isDisabled 
                              ? '#94a3b8' 
                              : (selectedEventLetter === letter ? '#ffffff' : '#475569'),
                            backgroundColor: !isDisabled && selectedEventLetter === letter 
                              ? '#f59e0b' 
                              : 'transparent',
                            border: !isDisabled && selectedEventLetter === letter 
                              ? '1px solid #f59e0b' 
                              : '1px solid transparent',
                            textDecoration: isDisabled ? 'line-through' : 'none',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            opacity: isDisabled ? 0.4 : 1
                          }}
                          onClick={() => { if (!isDisabled) setSelectedEventLetter(letter); }}
                        >{letter}</Button>
                      );
                    })}
                  </div>

                  {/* Alphabet scroll arrows */}
                  <div className="d-flex gap-1 flex-shrink-0 alphabet-arrows">
                    <Button 
                      variant="link"
                      onClick={() => scrollAlphabet(eventAlphaRef, 'left')}
                      className="text-secondary p-1 d-flex align-items-center justify-content-center border rounded-2"
                      style={{ width: '24px', height: '24px', backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.08)' }}
                    ><FaChevronLeft size={9} /></Button>
                    <Button 
                      variant="link"
                      onClick={() => scrollAlphabet(eventAlphaRef, 'right')}
                      className="text-secondary p-1 d-flex align-items-center justify-content-center border rounded-2"
                      style={{ width: '24px', height: '24px', backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.08)' }}
                    ><FaChevronRight size={9} /></Button>
                  </div>
                </div>

                {/* 3. Slider Arrow Block */}
                <div className="d-flex gap-1 flex-shrink-0">
                  <Button 
                    ref={eventsPrevRef}
                    variant="link"
                    className="text-secondary p-1 d-flex align-items-center justify-content-center border rounded-2 slider-arrow-btn"
                    style={{ width: '28px', height: '28px', backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.08)' }}
                  ><FaChevronLeft size={10} /></Button>
                  <Button 
                    ref={eventsNextRef}
                    variant="link"
                    className="text-secondary p-1 d-flex align-items-center justify-content-center border rounded-2 slider-arrow-btn"
                    style={{ width: '28px', height: '28px', backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.08)' }}
                  ><FaChevronRight size={10} /></Button>
                </div>
              </div>

              {/* Events 2-Row Grid Swiper */}
              {filteredEvents.length === 0 ? (
                <div className="text-center py-5 text-muted border border-dashed rounded-3" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                  No events starting with &ldquo;{selectedEventLetter}&rdquo; found.
                </div>
              ) : (
                <div className="position-relative">
                  <Swiper
                    key="events-swiper-6col"
                    modules={[Navigation, Grid]}
                    navigation={{ prevEl: eventsPrevRef.current, nextEl: eventsNextRef.current }}
                    onSwiper={(swiper) => {
                      setTimeout(() => {
                        if (swiper.params && swiper.params.navigation) {
                          swiper.params.navigation.prevEl = eventsPrevRef.current;
                          swiper.params.navigation.nextEl = eventsNextRef.current;
                          swiper.navigation.destroy();
                          swiper.navigation.init();
                          swiper.navigation.update();
                        }
                      });
                    }}
                    grid={{ rows: 2, fill: 'row' }}
                    spaceBetween={14}
                    slidesPerView={6}
                    breakpoints={{
                      0: { slidesPerView: 2, grid: { rows: 2, fill: 'row' } },
                      576: { slidesPerView: 3, grid: { rows: 2, fill: 'row' } },
                      768: { slidesPerView: 4, grid: { rows: 2, fill: 'row' } },
                      992: { slidesPerView: 6, grid: { rows: 2, fill: 'row' } }
                    }}
                    className="events-grid-swiper"
                  >
                    {filteredEvents.map((ev, idx) => (
                      <SwiperSlide key={idx}>
                        <div 
                          onClick={() => router.push('/login')}
                          className="text-dark d-flex flex-column h-100 cursor-pointer mx-auto"
                          style={{ cursor: 'pointer', width: '140px' }}
                        >
                          <div 
                            className="mb-2" 
                            style={{ 
                              height: '100px', 
                              width: '140px',
                              backgroundImage: `url(${ev.img})`, 
                              backgroundSize: 'cover', 
                              backgroundPosition: 'center',
                              borderRadius: '0px'
                            }} 
                          />
                          <div className="d-flex text-warning mb-1" style={{ fontSize: '8px' }}>
                            {[...Array(5)].map((_, i) => <FaStar key={i} style={{ fontSize: '8px' }} />)}
                          </div>
                          <h6 className="fw-bold font-heading mb-1 text-dark text-truncate" style={{ fontSize: '0.6rem', lineHeight: '1.2' }}>
                            {ev.name} <span className="text-secondary fw-normal">({ev.location})</span>
                          </h6>
                          <div className="text-muted d-flex align-items-center gap-1 mt-1" style={{ fontSize: '0.55rem', fontWeight: '500' }}>
                            <FaRegClock style={{ fontSize: '0.55rem' }} /> {ev.time}
                          </div>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              )}
              <div className="text-end mt-3">
                <span onClick={() => router.push('/login')} className="text-info small fw-bold cursor-pointer" style={{ cursor: 'pointer' }}>
                  View All Events →
                </span>
              </div>
            </div>

          </Col>
        </Row>
      </div>

      {/* Full-Width: Uploaded Photos By Members */}
      <div className="px-4 py-4 border-bottom" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.08)' }}>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h3 className="fw-bold font-heading text-dark m-0 d-flex align-items-center gap-2 text-nowrap" style={{ fontSize: '1.25rem' }}>
            <FaCamera className="text-success" style={{ fontSize: '1.15rem' }} /> Uploaded Photos By Members
          </h3>
        </div>
        
        <div className="position-relative px-2">
          {/* Side Floating Arrow Buttons */}
          <Button 
            ref={photosPrevRef}
            variant="link"
            className="side-arrow-btn prev-btn slider-arrow-btn"
          ><FaChevronLeft size={14} /></Button>
          <Button 
            ref={photosNextRef}
            variant="link"
            className="side-arrow-btn next-btn slider-arrow-btn"
          ><FaChevronRight size={14} /></Button>

          <Swiper
            modules={[Navigation]}
            navigation={{ prevEl: photosPrevRef.current, nextEl: photosNextRef.current }}
            onSwiper={(swiper) => {
              setTimeout(() => {
                if (swiper.params && swiper.params.navigation) {
                  swiper.params.navigation.prevEl = photosPrevRef.current;
                  swiper.params.navigation.nextEl = photosNextRef.current;
                  swiper.navigation.destroy();
                  swiper.navigation.init();
                  swiper.navigation.update();
                }
              });
            }}
            spaceBetween={16}
            slidesPerView={1.5}
            breakpoints={{
              576: { slidesPerView: 2.2 },
              768: { slidesPerView: 3.2 },
              992: { slidesPerView: 4.5 },
              1200: { slidesPerView: 5 }
            }}
            className="photos-swiper"
          >
            {photosList.map((photo, index) => (
              <SwiperSlide key={index}>
                <motion.div 
                  whileHover={{ scale: 1.04, y: -2 }} 
                  className="rounded-0 overflow-hidden border shadow-sm" 
                  style={{ height: '150px', borderColor: 'rgba(0,0,0,0.08)', cursor: 'pointer', borderRadius: '0px' }}
                  onClick={() => router.push('/login')}
                >
                  <img src={photo} alt="Member upload" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        
        <div className="text-end mt-3">
          <span onClick={() => router.push('/login')} className="text-info small fw-bold cursor-pointer text-decoration-none hover-underline" style={{ cursor: 'pointer' }}>
            View All Uploads →
          </span>
        </div>
      </div>

      {/* Full-Width: Members Section */}
      <div id="members" className="px-4 py-4" style={{ backgroundColor: '#ffffff' }}>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h3 className="fw-bold font-heading text-dark m-0 d-flex align-items-center gap-2 text-nowrap" style={{ fontSize: '1.25rem' }}>
            <FaUsers className="text-primary" style={{ fontSize: '1.15rem' }} /> Members
          </h3>
        </div>

        <div className="position-relative px-2">
          {/* Side Floating Arrow Buttons */}
          <Button 
            ref={membersPrevRef}
            variant="link"
            className="side-arrow-btn prev-btn slider-arrow-btn"
          ><FaChevronLeft size={14} /></Button>
          <Button 
            ref={membersNextRef}
            variant="link"
            className="side-arrow-btn next-btn slider-arrow-btn"
          ><FaChevronRight size={14} /></Button>

          <Swiper
            modules={[Navigation]}
            navigation={{ prevEl: membersPrevRef.current, nextEl: membersNextRef.current }}
            onSwiper={(swiper) => {
              setTimeout(() => {
                if (swiper.params && swiper.params.navigation) {
                  swiper.params.navigation.prevEl = membersPrevRef.current;
                  swiper.params.navigation.nextEl = membersNextRef.current;
                  swiper.navigation.destroy();
                  swiper.navigation.init();
                  swiper.navigation.update();
                }
              });
            }}
            spaceBetween={16}
            slidesPerView={1.5}
            breakpoints={{
              576: { slidesPerView: 2.2 },
              768: { slidesPerView: 3.2 },
              992: { slidesPerView: 4.2 },
              1200: { slidesPerView: 5 }
            }}
            className="members-swiper"
          >
            {membersList.map((member, idx) => (
              <SwiperSlide key={idx}>
                <Card className="glass-card text-dark border overflow-hidden shadow-sm h-100 d-flex flex-column align-items-center text-center position-relative pb-3" style={{ borderColor: 'rgba(0,0,0,0.06)', borderRadius: '0px' }}>
                  {/* Top Cover Banner */}
                  <div style={{
                    height: '60px',
                    width: '100%',
                    background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 1
                  }} />
                  
                  {/* Avatar overlapping cover */}
                  <div className="position-relative mt-4 mb-2" style={{ zIndex: 2 }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '4px solid #ffffff',
                      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)'
                    }}>
                      <img 
                        src={member.img} 
                        alt={member.name} 
                        className="w-100 h-100" 
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  </div>

                  <Card.Body className="p-3 pt-0 w-100 d-flex flex-column align-items-center flex-grow-1" style={{ zIndex: 2 }}>
                    {/* Name */}
                    <h6 className="fw-bold font-heading mb-1 text-dark text-truncate w-100" style={{ fontSize: '0.92rem' }}>{member.name}</h6>
                    
                    {/* Role Badge */}
                    <div className="mb-2">
                      <span className="badge px-2 py-1 rounded-pill small" style={{ 
                        fontSize: '0.68rem', 
                        fontWeight: '600',
                        backgroundColor: member.role === 'Ambassador' ? 'rgba(14, 165, 233, 0.1)' : member.role === 'Moderator' ? 'rgba(147, 51, 234, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: member.role === 'Ambassador' ? '#0ea5e9' : member.role === 'Moderator' ? '#9333ea' : '#10b981'
                      }}>
                        {member.role}
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="d-flex justify-content-center text-warning gap-1 mb-2" style={{ fontSize: '10px' }}>
                      {[...Array(member.rating || 5)].map((_, i) => <FaStar key={i} />)}
                    </div>

                    {/* Location */}
                    <div className="text-secondary mb-3 w-100 text-truncate" style={{ fontSize: '0.78rem' }}>
                      <FaMapMarkerAlt className="text-muted me-1" size={10} /> {member.address}
                    </div>
                    
                    {/* Action Button */}
                    <Button 
                      onClick={() => router.push('/login')} 
                      variant="primary" 
                      size="sm" 
                      className="w-100 rounded-0 mt-auto fw-bold py-1.5 d-flex align-items-center justify-content-center gap-1 shadow-sm member-connect-btn"
                      style={{ 
                        fontSize: '0.8rem', 
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                        border: 'none',
                        borderRadius: '0px'
                      }}
                    >
                      Connect
                    </Button>
                  </Card.Body>
                </Card>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        
        <div className="text-end mt-3">
          <span onClick={() => router.push('/login')} className="text-info small fw-bold cursor-pointer text-decoration-none hover-underline" style={{ cursor: 'pointer' }}>
            View All Members →
          </span>
        </div>
      </div>
    </div>

      {/* Footer */}
      <footer id="contact" className="py-5 mt-auto border-top text-light" style={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.06)' }}>
        <Container fluid className="px-4">
          <Row className="gy-4 mb-4">
            {/* Column 1: Brand Info */}
            <Col xs={12} md={6} lg={4}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <img src="/logo/logo.png" alt="IncredibleBD Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
              </div>
              <p className="small text-secondary mb-4" style={{ maxWidth: '300px' }}>
                Discover the raw beauty of Bangladesh. Explore top destinations, local festivals, and connect with fellow travellers across the country.
              </p>
              {/* Social links */}
              <div className="d-flex gap-3">
                {['facebook', 'twitter', 'instagram', 'youtube'].map((social) => (
                  <span 
                    key={social}
                    style={{ cursor: 'pointer', width: '32px', height: '32px', border: '1px solid rgba(255,255,255,0.1)' }} 
                    className="rounded-circle d-flex align-items-center justify-content-center text-secondary social-btn bg-opacity-10 bg-white"
                    onClick={() => router.push('/login')}
                  >
                    <span className="small text-capitalize font-heading" style={{ fontSize: '11px', fontWeight: 'bold' }}>{social[0]}</span>
                  </span>
                ))}
              </div>
            </Col>

            {/* Column 2: Quick Links */}
            <Col xs={6} md={3} lg={2}>
              <h6 className="fw-bold text-white mb-3 font-heading" style={{ fontSize: '0.9rem' }}>Quick Links</h6>
              <ul className="list-unstyled d-flex flex-column gap-2 small">
                <li><span style={{ cursor: 'pointer' }} onClick={() => router.push('/login')} className="hover-white">Explore Places</span></li>
                <li><span style={{ cursor: 'pointer' }} onClick={() => router.push('/login')} className="hover-white">Upcoming Events</span></li>
                <li><span style={{ cursor: 'pointer' }} onClick={() => router.push('/login')} className="hover-white">Our Community</span></li>
                <li><span style={{ cursor: 'pointer' }} onClick={() => router.push('/login')} className="hover-white">Help Center</span></li>
              </ul>
            </Col>

            {/* Column 3: Top Destinations */}
            <Col xs={6} md={3} lg={2}>
              <h6 className="fw-bold text-white mb-3 font-heading" style={{ fontSize: '0.9rem' }}>Destinations</h6>
              <ul className="list-unstyled d-flex flex-column gap-2 small">
                <li><span style={{ cursor: 'pointer' }} onClick={() => router.push('/login')} className="hover-white">Cox's Bazar</span></li>
                <li><span style={{ cursor: 'pointer' }} onClick={() => router.push('/login')} className="hover-white">Sajek Valley</span></li>
                <li><span style={{ cursor: 'pointer' }} onClick={() => router.push('/login')} className="hover-white">Sylhet Tea Gardens</span></li>
                <li><span style={{ cursor: 'pointer' }} onClick={() => router.push('/login')} className="hover-white">Sundarbans</span></li>
              </ul>
            </Col>

            {/* Column 4: Contact Info */}
            <Col xs={12} md={6} lg={4}>
              <h6 className="fw-bold text-white mb-3 font-heading" style={{ fontSize: '0.9rem' }}>Contact & Support</h6>
              <ul className="list-unstyled d-flex flex-column gap-3 small">
                <li className="d-flex align-items-start gap-2">
                  <FaMapMarkerAlt className="text-info mt-1" />
                  <span>Road 12, Banani, Dhaka, Bangladesh</span>
                </li>
                <li className="d-flex align-items-center gap-2">
                  <span className="text-info" style={{ fontSize: '1.1rem' }}>✉</span>
                  <span>support@incrediblebd.com</span>
                </li>
                <li className="d-flex align-items-center gap-2">
                  <div className="badge bg-danger bg-opacity-20 text-danger border border-danger border-opacity-30 px-3 py-2 fw-bold d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                    <FaPhone className="phone-vibrate-icon" /> 01812212111
                  </div>
                </li>
              </ul>
            </Col>
          </Row>

          <hr className="border-secondary my-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 small text-secondary">
            <span>IncredibleBD © 2026. All Rights Reserved.</span>
            <div className="d-flex gap-4">
              <span style={{ cursor: 'pointer' }} onClick={() => router.push('/login')} className="hover-white">Privacy Policy</span>
              <span style={{ cursor: 'pointer' }} onClick={() => router.push('/login')} className="hover-white">Terms of Use</span>
            </div>
          </div>
        </Container>
      </footer>

      {/* Slide-out Left Sidebar Drawer */}
      <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="start" className="light-theme-landing">
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title className="fw-bold font-heading text-dark">Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="py-4 px-3" style={{ backgroundColor: '#ffffff' }}>
          {renderVerticalMenuContent()}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
}

/* ==========================================
   FEED PAGE COMPONENT (Logged In)
   ========================================== */
function FeedPageContent() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState('discover');
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingStories, setLoadingStories] = useState(false);

  // New Post State
  const [postContent, setPostContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [postLocation, setPostLocation] = useState('');
  const [postType, setPostType] = useState('text'); // 'text', 'image', 'video', 'story', 'reels'
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  // Story Modal
  const [selectedStory, setSelectedStory] = useState(null);
  const [showStoryModal, setShowStoryModal] = useState(false);

  const fileInputRef = useRef(null);

  // Load Stories & Feeds
  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    fetchFeed(activeTab);
  }, [activeTab]);

  const fetchStories = async () => {
    try {
      setLoadingStories(true);
      const res = await API.get('/posts/stories');
      setStories(res.data.stories);
      setLoadingStories(false);
    } catch (err) {
      console.error(err);
      setLoadingStories(false);
    }
  };

  const fetchFeed = async (feedType) => {
    try {
      setLoadingPosts(true);
      const res = await API.get(`/posts/feed?type=${feedType}`);
      setPosts(res.data.posts);
      setLoadingPosts(false);
    } catch (err) {
      console.error(err);
      setLoadingPosts(false);
    }
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingMedia(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await API.post('/media/upload', formData);
      setMediaFile(res.data.url);
      setPostType(file.type.startsWith('video/') ? 'video' : 'image');
      setUploadingMedia(false);
    } catch (err) {
      console.error(err);
      alert('Media upload failed. Try again.');
      setUploadingMedia(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postContent.trim() && !mediaFile) return;

    try {
      const payload = {
        content: postContent,
        type: postType === 'text' && mediaFile ? 'image' : postType,
        mediaUrls: mediaFile ? [mediaFile] : [],
        location: postLocation ? { name: postLocation } : undefined
      };

      const res = await API.post('/posts', payload);
      setPosts([res.data.post, ...posts]);
      
      // Reset
      setPostContent('');
      setMediaFile(null);
      setPostLocation('');
      setPostType('text');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStorySubmit = async (file) => {
    setUploadingMedia(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const mediaRes = await API.post('/media/upload', formData);
      await API.post('/posts', {
        type: 'story',
        mediaUrls: [mediaRes.data.url]
      });
      fetchStories();
      setUploadingMedia(false);
    } catch (err) {
      console.error(err);
      setUploadingMedia(false);
    }
  };

  const handleReaction = async (postId) => {
    try {
      const res = await API.post(`/posts/react/${postId}`, { type: 'Like' });
      setPosts(posts.map(p => {
        if (p._id === postId) {
          return { 
            ...p, 
            likesCount: res.data.likesCount
          };
        }
        return p;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <MainLayout>
      <Row className="g-4">
        {/* Feed and Stories Column */}
        <Col lg={8}>
          {/* Stories Section */}
          <div className="mb-4 d-flex align-items-center gap-3 overflow-x-auto py-2 px-1 scroll-smooth">
            {/* Create Story Button */}
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              className="d-flex flex-column align-items-center justify-content-center text-center p-2 rounded-3 border border-secondary"
              style={{ minWidth: '85px', height: '110px', background: 'var(--bg-secondary)', cursor: 'pointer', borderStyle: 'dashed' }}
              onClick={() => fileInputRef.current.click()}
            >
              <span style={{ fontSize: '1.8rem' }}>+</span>
              <span className="small text-secondary fw-bold mt-1">Add Story</span>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="d-none" 
                accept="image/*,video/*" 
                onChange={(e) => handleStorySubmit(e.target.files[0])} 
              />
            </motion.div>

            {/* Render Active Stories */}
            {stories.map((story) => (
              <motion.div 
                key={story._id}
                whileHover={{ scale: 1.05 }}
                className="d-flex flex-column align-items-center justify-content-center text-center p-1 rounded-circle border border-info"
                style={{ minWidth: '85px', height: '85px', cursor: 'pointer' }}
                onClick={() => {
                  setSelectedStory(story);
                  setShowStoryModal(true);
                }}
              >
                <img
                  src={story.user?.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}
                  alt={story.user?.displayName}
                  className="rounded-circle"
                  width="70"
                  height="70"
                  style={{ objectFit: 'cover' }}
                />
              </motion.div>
            ))}
          </div>

          {/* Create Post Section */}
          <Card className="glass-card mb-4 border-secondary p-3 text-white">
            <Form onSubmit={handleCreatePost}>
              <div className="d-flex gap-3 align-items-start mb-3">
                <img
                  src={user?.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}
                  alt={user?.displayName || 'User'}
                  className="rounded-circle"
                  width="44"
                  height="44"
                />
                <Form.Control
                  as="textarea"
                  rows={2}
                  className="bg-transparent border-0 text-white p-0 shadow-none resize-none"
                  placeholder="Where are you traveling to next?"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />
              </div>

              {mediaFile && (
                <div className="mb-3 position-relative">
                  {postType === 'video' ? (
                    <video src={mediaFile} controls className="w-100 rounded-3" style={{ maxHeight: '300px' }} />
                  ) : (
                    <img src={mediaFile} alt="Upload preview" className="w-100 rounded-3" style={{ maxHeight: '300px', objectFit: 'cover' }} />
                  )}
                  <Button 
                    variant="danger" 
                    size="sm" 
                    className="position-absolute top-0 end-0 m-2 rounded-circle"
                    onClick={() => { setMediaFile(null); setPostType('text'); }}
                  >
                    ×
                  </Button>
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary">
                <div className="d-flex gap-3">
                  <Form.Label htmlFor="upload-media" className="m-0 text-info" style={{ cursor: 'pointer' }}>
                    <FaImage className="me-1" /> Add Media
                  </Form.Label>
                  <input
                    id="upload-media"
                    type="file"
                    className="d-none"
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                  />

                  <div className="d-flex align-items-center text-warning" style={{ cursor: 'pointer' }}>
                    <FaMapMarkerAlt className="me-1" />
                    <input
                      type="text"
                      placeholder="Add Location"
                      value={postLocation}
                      onChange={(e) => setPostLocation(e.target.value)}
                      className="bg-transparent border-0 text-white text-warning small w-50 p-0 ms-1 shadow-none"
                      style={{ fontSize: '14px' }}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={uploadingMedia} className="btn-gradient px-4 py-1.5 d-flex align-items-center gap-2">
                  {uploadingMedia ? <Spinner animation="border" size="sm" /> : <><FaPaperPlane /> Post</>}
                </Button>
              </div>
            </Form>
          </Card>

          {/* Feed Switcher */}
          <Tabs
            id="feed-tabs"
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4 border-secondary border-bottom justify-content-start"
          >
            <Tab eventKey="discover" title="Discover" />
            <Tab eventKey="following" title="Following" />
            <Tab eventKey="trending" title="Trending" />
          </Tabs>

          {/* Post Lists */}
          {loadingPosts ? (
            <div className="text-center py-5"><Spinner animation="border" variant="info" /></div>
          ) : posts.length === 0 ? (
            <Alert variant="dark" className="border-secondary text-white text-center">No posts to display in this feed yet.</Alert>
          ) : (
            <AnimatePresence>
              {posts.map((post) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="glass-card mb-4 border-secondary text-white">
                    <Card.Body>
                      {/* Header */}
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <img
                          src={post.user?.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}
                          alt={post.user?.displayName}
                          className="rounded-circle border border-info"
                          width="40"
                          height="40"
                          style={{ cursor: 'pointer' }}
                          onClick={() => router.push(`/u/${post.user?.username}`)}
                        />
                        <div>
                          <div className="fw-bold d-flex align-items-center gap-1" style={{ cursor: 'pointer' }} onClick={() => router.push(`/u/${post.user?.username}`)}>
                            {post.user?.displayName}
                            {post.user?.isVerified && <span className="text-info" style={{ fontSize: '12px' }}>✓</span>}
                          </div>
                          <div className="small text-secondary">@{post.user?.username} • {new Date(post.createdAt).toLocaleDateString()}</div>
                        </div>

                        {post.location?.name && (
                          <div className="ms-auto text-warning small d-flex align-items-center gap-1">
                            <FaMapMarkerAlt /> {post.location.name}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <Card.Text>{post.content}</Card.Text>

                      {/* Media */}
                      {post.mediaUrls && post.mediaUrls.length > 0 && (
                        <div className="mb-3 rounded-3 overflow-hidden border border-secondary">
                          {post.type === 'video' ? (
                            <video src={post.mediaUrls[0]} controls className="w-100" style={{ maxHeight: '450px' }} />
                          ) : (
                            <img src={post.mediaUrls[0]} alt="Post media" className="w-100 img-fluid" style={{ maxHeight: '450px', objectFit: 'cover' }} />
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="d-flex justify-content-between align-items-center pt-3 border-top border-secondary">
                        <Button 
                          variant="link" 
                          onClick={() => handleReaction(post._id)} 
                          className="text-secondary d-flex align-items-center gap-1 p-0 text-decoration-none"
                        >
                          <FaHeart className="text-danger" />
                          <span>{post.likesCount}</span>
                        </Button>

                        <Button 
                          variant="link" 
                          onClick={() => router.push(`/u/${post.user?.username}?post=${post._id}`)} 
                          className="text-secondary d-flex align-items-center gap-1 p-0 text-decoration-none"
                        >
                          <FaComment />
                          <span>{post.commentsCount} Comments</span>
                        </Button>

                        <Button variant="link" className="text-secondary d-flex align-items-center gap-1 p-0 text-decoration-none">
                          <FaShare /> Share
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </Col>

        {/* Suggested Travelers Sidebar Column */}
        <Col lg={4} className="d-none d-lg-block">
          <Card className="glass-card border-secondary text-white p-3">
            <Card.Title className="fw-bold mb-3 font-heading">Popular Travelers</Card.Title>
            <hr className="border-secondary mb-3 mt-0" />
            
            {/* Suggested listing */}
            <div className="d-flex flex-column gap-3">
              {[
                { name: 'Sajid Islam', username: 'sajid_traveller', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80', bio: 'Backpacker in Europe' },
                { name: 'Fahmida Rahman', username: 'fahmida_r', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80', bio: 'Mountain climber' },
                { name: 'David Miller', username: 'david_m', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80', bio: 'Exploring Asia' }
              ].map((traveler) => (
                <div key={traveler.username} className="d-flex align-items-center gap-2 justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <img src={traveler.img} alt={traveler.name} className="rounded-circle border border-info" width="40" height="40" style={{ objectFit: 'cover' }} />
                    <div>
                      <div className="fw-bold small">{traveler.name}</div>
                      <div className="text-secondary small">@{traveler.username}</div>
                    </div>
                  </div>
                  <Button variant="outline-info" size="sm" className="rounded-pill px-3">Follow</Button>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Story View Modal */}
      <Modal show={showStoryModal} onHide={() => setShowStoryModal(false)} centered size="lg" className="story-viewer-modal">
        <Modal.Header closeButton className="border-0 text-white" closeVariant="white" style={{ background: '#000' }}>
          <Modal.Title className="small text-secondary">
            Story by @{selectedStory?.user?.username}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 text-center" style={{ background: '#000' }}>
          {selectedStory && (
            <div>
              {selectedStory.mediaUrls[0]?.includes('/media/stream') || selectedStory.mediaUrls[0]?.endsWith('.mp4') ? (
                <video src={selectedStory.mediaUrls[0]} controls autoPlay className="w-100" style={{ maxHeight: '80vh' }} />
              ) : (
                <img src={selectedStory.mediaUrls[0]} alt="Story" className="w-100 img-fluid" style={{ maxHeight: '80vh', objectFit: 'contain' }} />
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </MainLayout>
  );
}
