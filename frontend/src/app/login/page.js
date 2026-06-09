'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { loginStart, loginSuccess, loginFailure } from '../../redux/authSlice.js';
import API from '../../services/api.js';

export default function LoginPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());
    setLocalError('');

    try {
      const res = await API.post('/auth/login', formData);
      dispatch(loginSuccess(res.data));
      router.push('/');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid credentials. Please try again.';
      dispatch(loginFailure(errMsg));
      setLocalError(errMsg);
      
      // Redirect to OTP verification if email is not verified
      if (err.response?.status === 403 && errMsg.includes('OTP')) {
        router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
      }
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100" style={{
      backgroundImage: 'linear-gradient(rgba(10, 13, 20, 0.85), rgba(10, 13, 20, 0.95)), url("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <Container style={{ maxWidth: '450px' }}>
        <Card className="glass-panel border-0 text-white p-4 shadow-lg">
          <Card.Body>
            <div className="text-center mb-4">
              <span style={{ fontSize: '3.5rem' }}>✈️</span>
              <h2 className="fw-bold text-gradient mt-2 font-heading">TravelSphere</h2>
              <p className="text-muted">Start mapping your world adventure</p>
            </div>

            {localError && <Alert variant="danger" className="border-0 bg-danger text-white">{localError}</Alert>}

            <Form onSubmit={handleSubmit}>
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

              <Form.Group className="mb-3" controlId="password">
                <Form.Label className="text-secondary small">Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  required
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-4 d-flex justify-content-between align-items-center" controlId="rememberMe">
                <Form.Check
                  type="checkbox"
                  name="rememberMe"
                  label="Remember me"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="small text-secondary"
                />
                <Link href="/forgot-password" style={{ color: '#0ea5e9' }} className="small text-decoration-none">
                  Forgot Password?
                </Link>
              </Form.Group>

              <Button type="submit" disabled={loading} className="w-100 btn-gradient py-2 mb-3">
                {loading ? <Spinner animation="border" size="sm" /> : 'Sign In'}
              </Button>
            </Form>

            <div className="text-center text-secondary small mt-3">
              Don't have an account?{' '}
              <Link href="/register" style={{ color: '#0ea5e9' }} className="text-decoration-none fw-bold">
                Sign Up
              </Link>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
