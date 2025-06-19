'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Container, Row, Col, Spinner } from 'react-bootstrap';

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  permissions: string[];
}

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuthentication();
  }, [pathname]);

  const checkAuthentication = () => {
    try {
      // Skip auth check for login page
      if (pathname === '/warehouse-v2/login') {
        setIsAuthenticated(true);
        return;
      }

      const token = localStorage.getItem('warehouse_auth_token');
      const userStr = localStorage.getItem('warehouse_user');

      if (!token || !userStr) {
        // No token or user data, redirect to login
        router.push('/warehouse-v2/login');
        return;
      }

      // Parse user data
      const userData = JSON.parse(userStr);
      setUser(userData);
      setIsAuthenticated(true);

      // Optional: Verify token with server
      // verifyTokenWithServer(token);

    } catch (error) {
      console.error('Auth check error:', error);
      // Clear invalid data and redirect to login
      localStorage.removeItem('warehouse_auth_token');
      localStorage.removeItem('warehouse_user');
      router.push('/warehouse-v2/login');
    }
  };

  const verifyTokenWithServer = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error('Invalid token');
      }
    } catch (error) {
      console.error('Token verification error:', error);
      // Clear invalid token and redirect to login
      localStorage.removeItem('warehouse_auth_token');
      localStorage.removeItem('warehouse_user');
      router.push('/warehouse-v2/login');
    }
  };

  // Show loading spinner while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <Container>
          <Row className="justify-content-center">
            <Col xs="auto">
              <div className="text-center">
                <Spinner animation="border" variant="primary" className="mb-3" />
                <div className="text-muted">Đang kiểm tra đăng nhập...</div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  // If not authenticated and not on login page, don't render children
  if (!isAuthenticated && pathname !== '/warehouse-v2/login') {
    return null;
  }

  // If authenticated or on login page, render children
  return <>{children}</>;
};

export default AuthGuard;
