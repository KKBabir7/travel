'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Container, Row, Col, Nav, Navbar } from 'react-bootstrap';
import { FaChartBar, FaUsers, FaFlag, FaHome, FaAngleLeft } from 'react-icons/fa';
import MainLayout from '../../components/MainLayout.js';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    const isAdmin = user.roles.some(role => ['Admin', 'Super Admin'].includes(role));
    if (!isAdmin) {
      router.push('/'); // Redirect normal users away
    }
  }, [user, isAuthenticated, router]);

  if (!user || !user.roles.some(role => ['Admin', 'Super Admin'].includes(role))) {
    return <div className="text-center mt-5 text-white">Verifying credentials...</div>;
  }

  const adminNavs = [
    { name: 'Dashboard', path: '/admintravelsmain/dashboard', icon: <FaChartBar /> },
    { name: 'Users Management', path: '/admintravelsmain/users', icon: <FaUsers /> },
    { name: 'Moderation Reports', path: '/admintravelsmain/reports', icon: <FaFlag /> }
  ];

  return (
    <MainLayout>
      <Container fluid className="px-0">
        {/* Admin Sub-Header */}
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom border-secondary mb-4 bg-tertiary rounded-3 glass-panel">
          <div>
            <h3 className="fw-bold font-heading text-white m-0">🛠️ System Control Panel</h3>
            <span className="small text-warning">Super Admin Dashboard</span>
          </div>
          <Link href="/" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <FaAngleLeft /> Back to Social Feed
          </Link>
        </div>

        <Row>
          {/* Admin Sub Sidebar */}
          <Col md={3} className="mb-4">
            <Card className="glass-card border-secondary text-white p-2">
              <Nav className="flex-column gap-1">
                {adminNavs.map((nav) => {
                  const isActive = pathname === nav.path;
                  return (
                    <Nav.Link
                      key={nav.name}
                      as={Link}
                      href={nav.path}
                      className={`nav-link-custom ${isActive ? 'active' : ''}`}
                    >
                      {nav.icon}
                      <span>{nav.name}</span>
                    </Nav.Link>
                  );
                })}
              </Nav>
            </Card>
          </Col>

          {/* Admin Content */}
          <Col md={9}>
            {children}
          </Col>
        </Row>
      </Container>
    </MainLayout>
  );
}
