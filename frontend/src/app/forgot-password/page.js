'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import API from '../../services/api.js';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await API.post('/auth/forgot-password', { email });
      setSuccess(res.data.message);
      setLoading(false);
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Password reset request failed.');
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100" style={{
      backgroundImage: 'linear-gradient(rgba(10, 13, 20, 0.85), rgba(10, 13, 20, 0.95)), url("https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <Container style={{ maxWidth: '450px' }}>
        <Card className="glass-panel border-0 text-white p-4 shadow-lg">
          <Card.Body>
            <div className="text-center mb-4">
              <span style={{ fontSize: '3.5rem' }}>🔒</span>
              <h2 className="fw-bold text-gradient mt-2 font-heading">Forgot Password</h2>
              <p className="text-muted">Enter your email and we'll send you a reset OTP</p>
            </div>

            {error && <Alert variant="danger" className="border-0 bg-danger text-white">{error}</Alert>}
            {success && <Alert variant="success" className="border-0 bg-success text-white">{success}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-4" controlId="email">
                <Form.Label className="text-secondary small">Email Address</Form.Label>
                <Form.Control
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Group>

              <Button type="submit" disabled={loading} className="w-100 btn-gradient py-2 mb-3">
                {loading ? <Spinner animation="border" size="sm" /> : 'Send Reset Code'}
              </Button>
            </Form>

            <div className="text-center small">
              <Link href="/login" style={{ color: '#0ea5e9' }} className="text-decoration-none">
                Back to Sign In
              </Link>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
