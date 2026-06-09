'use client';

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { loginSuccess } from '../../redux/authSlice.js';
import API from '../../services/api.js';

export default function VerifyOtpPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await API.post('/auth/verify-otp', { email, otp });
      setSuccess('Email verified successfully! Logging you in...');
      dispatch(loginSuccess(res.data));
      setLoading(false);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Verification failed. Please check the code.');
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100" style={{
      backgroundImage: 'linear-gradient(rgba(10, 13, 20, 0.85), rgba(10, 13, 20, 0.95)), url("https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <Container style={{ maxWidth: '450px' }}>
        <Card className="glass-panel border-0 text-white p-4 shadow-lg">
          <Card.Body>
            <div className="text-center mb-4">
              <span style={{ fontSize: '3.5rem' }}>✉️</span>
              <h2 className="fw-bold text-gradient mt-2 font-heading">Verify Email</h2>
              <p className="text-muted">Enter the 6-digit code sent to your email</p>
            </div>

            {error && <Alert variant="danger" className="border-0 bg-danger text-white">{error}</Alert>}
            {success && <Alert variant="success" className="border-0 bg-success text-white">{success}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="email">
                <Form.Label className="text-secondary small">Email Address</Form.Label>
                <Form.Control
                  type="email"
                  required
                  readOnly
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-4" controlId="otp">
                <Form.Label className="text-secondary small">6-Digit OTP</Form.Label>
                <Form.Control
                  type="text"
                  required
                  placeholder="e.g. 123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="text-center fw-bold fs-4"
                  style={{ letterSpacing: '4px' }}
                />
              </Form.Group>

              <Button type="submit" disabled={loading} className="w-100 btn-gradient py-2 mb-3">
                {loading ? <Spinner animation="border" size="sm" /> : 'Verify & Continue'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
