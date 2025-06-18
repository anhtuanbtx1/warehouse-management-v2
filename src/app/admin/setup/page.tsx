'use client';

import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge } from 'react-bootstrap';

const AdminSetupPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const setupSampleData = async () => {
    try {
      setLoading(true);
      setError('');
      setResult(null);

      const response = await fetch('/api/setup-sample-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Setup failed');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Setup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/test-connection');
      const data = await response.json();
      
      if (data.success) {
        setResult({
          message: 'Database connection successful',
          data: data.data
        });
      } else {
        setError(data.error || 'Connection failed');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Row>
        <Col md={8} className="mx-auto">
          <Card>
            <Card.Header>
              <h4 className="mb-0">
                <i className="fas fa-cogs me-2"></i>
                Admin Setup - Database & Sample Data
              </h4>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <h5>Database Setup</h5>
                <p className="text-muted">
                  Setup database tables and sample data for testing the warehouse management system.
                </p>
              </div>

              {error && (
                <Alert variant="danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              {result && (
                <Alert variant="success">
                  <h6>
                    <i className="fas fa-check-circle me-2"></i>
                    {result.message}
                  </h6>
                  {result.data && (
                    <div className="mt-2">
                      {result.data.categoriesCount && (
                        <Badge bg="info" className="me-2">
                          {result.data.categoriesCount} Categories
                        </Badge>
                      )}
                      {result.data.batchesCount && (
                        <Badge bg="primary" className="me-2">
                          {result.data.batchesCount} Batches
                        </Badge>
                      )}
                      {result.data.productsCount && (
                        <Badge bg="success" className="me-2">
                          {result.data.productsCount} Products
                        </Badge>
                      )}
                      {result.data.tables && (
                        <div className="mt-2">
                          <small>Tables: {result.data.tables.join(', ')}</small>
                        </div>
                      )}
                    </div>
                  )}
                </Alert>
              )}

              <Row>
                <Col md={6} className="mb-3">
                  <Card className="h-100">
                    <Card.Body className="text-center">
                      <i className="fas fa-database fa-3x text-primary mb-3"></i>
                      <h6>Test Database Connection</h6>
                      <p className="text-muted small">
                        Verify database connectivity and check existing tables
                      </p>
                      <Button 
                        variant="outline-primary" 
                        onClick={testConnection}
                        disabled={loading}
                        className="w-100"
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-plug me-2"></i>
                            Test Connection
                          </>
                        )}
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6} className="mb-3">
                  <Card className="h-100">
                    <Card.Body className="text-center">
                      <i className="fas fa-box-open fa-3x text-success mb-3"></i>
                      <h6>Setup Sample Data</h6>
                      <p className="text-muted small">
                        Create sample categories, batches, and products for testing
                      </p>
                      <Button 
                        variant="success" 
                        onClick={setupSampleData}
                        disabled={loading}
                        className="w-100"
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Setting up...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-magic me-2"></i>
                            Setup Sample Data
                          </>
                        )}
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <div className="mt-4">
                <h6>Sample Data Includes:</h6>
                <ul className="text-muted">
                  <li><strong>5 Categories:</strong> iPhone 16, iPhone 15, Samsung S24, Xiaomi 14, OPPO Find X7</li>
                  <li><strong>3 Import Batches:</strong> With different product categories</li>
                  <li><strong>7 Products:</strong> With unique IMEI codes and realistic prices</li>
                  <li><strong>Sales Tables:</strong> For invoice and sales tracking</li>
                </ul>
              </div>

              <div className="mt-4 p-3 bg-light rounded">
                <h6>Next Steps:</h6>
                <ol className="mb-0">
                  <li>Test database connection first</li>
                  <li>Setup sample data if needed</li>
                  <li>Go to <a href="/warehouse-v2" className="text-decoration-none">Dashboard</a> to see the data</li>
                  <li>Test import, sales, and inventory features</li>
                </ol>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminSetupPage;
