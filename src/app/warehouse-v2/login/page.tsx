'use client';

import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useRouter } from 'next/navigation';

const WarehouseLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/warehouse-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (result.success) {
        // Store auth token in localStorage
        localStorage.setItem('warehouse_auth_token', result.token);
        localStorage.setItem('warehouse_user', JSON.stringify(result.user));
        
        // Redirect to warehouse dashboard
        router.push('/warehouse-v2');
      } else {
        setError(result.error || 'Đăng nhập thất bại');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Có lỗi xảy ra khi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="warehouse-login min-vh-100 d-flex align-items-center justify-content-center">
      <Container fluid>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col xl={4} lg={5} md={6} sm={8} xs={11}>
            <Card className="shadow-lg border-0 login-card">
              <Card.Body className="p-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="mb-3">
                    <span style={{ fontSize: '3rem' }}>📱</span>
                  </div>
                  <h2 className="fw-bold text-dark mb-2">
                    Hệ thống quản lý kho
                  </h2>
                  <p className="text-muted">
                    Đăng nhập để truy cập hệ thống quản lý kho
                  </p>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="danger" className="mb-4">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                  </Alert>
                )}

                {/* Login Form */}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      <i className="fas fa-user me-2"></i>
                      Tên đăng nhập
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Nhập tên đăng nhập"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="py-2"
                      style={{ fontSize: '1rem' }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">
                      <i className="fas fa-lock me-2"></i>
                      Mật khẩu
                    </Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Nhập mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="py-2"
                      style={{ fontSize: '1rem' }}
                    />
                  </Form.Group>

                  <div className="d-grid">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={loading}
                      className="py-2 fw-semibold"
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Đang đăng nhập...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-sign-in-alt me-2"></i>
                          Đăng nhập
                        </>
                      )}
                    </Button>
                  </div>
                </Form>

                {/* Demo Credentials
                <div className="mt-4 p-3 bg-light rounded">
                  <h6 className="fw-semibold mb-2">
                    <i className="fas fa-info-circle me-2 text-info"></i>
                    Tài khoản demo:
                  </h6>
                  <div className="small">
                    <div><strong>Admin:</strong> admin / admin123</div>
                    <div><strong>Manager:</strong> manager / manager123</div>
                    <div><strong>Staff:</strong> staff / staff123</div>
                  </div>
                </div> */}
              </Card.Body>
            </Card>

            {/* Footer */}
            <div className="text-center mt-4" style={{ fontSize: '0.8rem', color: 'black' }}>
              
                © 2025 Hệ thống Quản lý Kho thiết kế bởi AT
            
            </div>
          </Col>
        </Row>
      </Container>

      {/* Custom Styles */}
      <style jsx global>{`
        .warehouse-login {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
          overflow: hidden;
        }

        .warehouse-login::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%);
          pointer-events: none;
        }

        .warehouse-login .login-card {
          border-radius: 1.5rem;
          backdrop-filter: blur(20px);
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow:
            0 25px 50px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          position: relative;
          z-index: 1;
          max-width: 450px;
          margin: 0 auto;
        }

        .warehouse-login .card-body {
          padding: 3rem 2.5rem;
        }

        .warehouse-login .form-control {
          border-radius: 0.75rem;
          border: 2px solid #e9ecef;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.9);
          padding: 0.75rem 1rem;
          font-size: 1rem;
        }

        .warehouse-login .form-control:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.25rem rgba(102, 126, 234, 0.25);
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 1);
        }

        .warehouse-login .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 0.75rem;
          padding: 0.875rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .warehouse-login .btn-primary:hover {
          background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .warehouse-login .btn-primary:active {
          transform: translateY(0);
        }

        .warehouse-login .form-label {
          font-weight: 600;
          color: #495057;
          margin-bottom: 0.5rem;
        }

        .warehouse-login .alert {
          border-radius: 0.75rem;
          border: none;
          background: rgba(220, 53, 69, 0.1);
          color: #721c24;
          border-left: 4px solid #dc3545;
        }

        .warehouse-login .bg-light {
          background: rgba(248, 249, 250, 0.8) !important;
          border-radius: 0.75rem;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .warehouse-login .card-body {
            padding: 2rem 1.5rem;
          }

          .warehouse-login .login-card {
            margin: 1rem;
          }
        }

        @media (max-width: 576px) {
          .warehouse-login .card-body {
            padding: 1.5rem 1rem;
          }
        }

        /* Center the container perfectly */
        .warehouse-login .container-fluid {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .warehouse-login .row {
          width: 100%;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default WarehouseLoginPage;
