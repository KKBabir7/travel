'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import API from '../../services/api.js';

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    displayName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await API.post('/auth/register', formData);
      setSuccess(res.data.message);
      setLoading(false);
      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
      }, 1500);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100" style={{
      backgroundImage: 'linear-gradient(rgba(10, 13, 20, 0.85), rgba(10, 13, 20, 0.95)), url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <Container style={{ maxWidth: '450px' }}>
        <Card className="glass-panel border-0 text-white p-4 shadow-lg">
          <Card.Body>
            <div className="text-center mb-4">
              <span style={{ fontSize: '3.5rem' }}>🌍</span>
              <h2 className="fw-bold text-gradient mt-2 font-heading">Join TravelSphere</h2>
              <p className="text-muted">Create an account to join travelers</p>
            </div>

            {error && <Alert variant="danger" className="border-0 bg-danger text-white">{error}</Alert>}
            {success && <Alert variant="success" className="border-0 bg-success text-white">{success}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="displayName">
                <Form.Label className="text-secondary small">Full Name</Form.Label>
                <Form.Control
                  type="text"
                  name="displayName"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.displayName}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="username">
                <Form.Label className="text-secondary small">Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  required
                  placeholder="e.g. johndoe"
                  value={formData.username}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="email">
                <Form.Label className="text-secondary small">Email Address</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  required
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-4" controlId="password">
                <Form.Label className="text-secondary small">Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  required
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </Form.Group>

              <Button type="submit" disabled={loading} className="w-100 btn-gradient py-2 mb-3">
                {loading ? <Spinner animation="border" size="sm" /> : 'Create Account'}
              </Button>
            </Form>

            <div className="text-center text-secondary small mt-3">
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#0ea5e9' }} className="text-decoration-none fw-bold">
                Sign In
              </Link>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
