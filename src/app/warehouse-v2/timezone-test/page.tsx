'use client';

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { getClientTimezoneDebug, getClientVietnamToday, getClientVietnamYesterday } from '@/utils/clientTimezone';

const TimezoneTestPage: React.FC = () => {
  const [clientDebug, setClientDebug] = useState<any>(null);
  const [serverDebug, setServerDebug] = useState<any>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const debug = getClientTimezoneDebug();
    setClientDebug(debug);
    console.log('Client Timezone Debug:', debug);
  }, []);

  const testDashboardAPI = async () => {
    setLoading(true);
    try {
      const today = getClientVietnamToday();
      const yesterday = getClientVietnamYesterday();
      
      const params = new URLSearchParams({
        clientToday: today,
        clientYesterday: yesterday,
        timezoneOverride: 'client'
      });

      const response = await fetch(`/api/dashboard/stats?${params.toString()}`);
      const result = await response.json();
      
      setApiResponse(result);
      setServerDebug(result.debug || null);
      
      console.log('API Response:', result);
      console.log('Server Debug:', result.debug);
    } catch (error) {
      console.error('API Test Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const comparison = clientDebug && serverDebug ? {
    clientToday: clientDebug.vietnamToday,
    serverToday: serverDebug.timezone?.vietnam,
    match: clientDebug.vietnamToday === serverDebug.timezone?.vietnam,
    clientTimezone: clientDebug.clientTimezone,
    serverTimezone: serverDebug.timezone?.serverTimezone,
    environment: serverDebug.timezone?.environment
  } : null;

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-clock text-primary me-2"></i>
          Timezone Test
        </h2>
        <Button variant="primary" onClick={testDashboardAPI} disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Testing...
            </>
          ) : (
            <>
              <i className="fas fa-play me-1"></i>
              Test Dashboard API
            </>
          )}
        </Button>
      </div>

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-desktop me-2"></i>
                Client-side Debug
              </h5>
            </Card.Header>
            <Card.Body>
              {clientDebug ? (
                <div>
                  <div className="mb-3">
                    <strong>Client Time:</strong> {clientDebug.clientTime}
                  </div>
                  <div className="mb-3">
                    <strong>Client Timezone:</strong> {clientDebug.clientTimezone}
                  </div>
                  <div className="mb-3">
                    <strong>Vietnam Today:</strong> 
                    <span className="badge bg-primary ms-2">{clientDebug.vietnamToday}</span>
                  </div>
                  <div className="mb-3">
                    <strong>Vietnam Yesterday:</strong> 
                    <span className="badge bg-secondary ms-2">{clientDebug.vietnamYesterday}</span>
                  </div>
                  <div className="mb-3">
                    <strong>Environment:</strong> {clientDebug.environment}
                  </div>
                  <div className="text-muted">
                    <small>{clientDebug.note}</small>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" />
                  <div className="mt-2">Loading client debug...</div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-server me-2"></i>
                Server-side Debug
              </h5>
            </Card.Header>
            <Card.Body>
              {serverDebug ? (
                <div>
                  <div className="mb-3">
                    <strong>Server Time:</strong> {serverDebug.timezone?.server}
                  </div>
                  <div className="mb-3">
                    <strong>Server Timezone:</strong> {serverDebug.timezone?.serverTimezone}
                  </div>
                  <div className="mb-3">
                    <strong>Vietnam Today:</strong> 
                    <span className="badge bg-primary ms-2">{serverDebug.timezone?.vietnam}</span>
                  </div>
                  <div className="mb-3">
                    <strong>Environment:</strong> {serverDebug.timezone?.environment}
                  </div>
                  <div className="text-muted">
                    <small>{serverDebug.timezone?.explanation}</small>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 text-muted">
                  <i className="fas fa-info-circle fa-2x mb-2"></i>
                  <div>Click &quot;Test Dashboard API&quot; to get server debug info</div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {comparison && (
        <Row>
          <Col md={12}>
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="fas fa-balance-scale me-2"></i>
                  Comparison
                </h5>
              </Card.Header>
              <Card.Body>
                <Alert variant={comparison.match ? 'success' : 'warning'}>
                  <div className="d-flex align-items-center">
                    <i className={`fas ${comparison.match ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2`}></i>
                    <div>
                      <strong>
                        {comparison.match ? 'Timezone Match ✓' : 'Timezone Mismatch ⚠️'}
                      </strong>
                      <div className="mt-2">
                        <div>Client Today: <code>{comparison.clientToday}</code></div>
                        <div>Server Today: <code>{comparison.serverToday}</code></div>
                        <div>Client Timezone: <code>{comparison.clientTimezone}</code></div>
                        <div>Server Timezone: <code>{comparison.serverTimezone}</code></div>
                        <div>Environment: <code>{comparison.environment}</code></div>
                      </div>
                    </div>
                  </div>
                </Alert>
                
                {!comparison.match && (
                  <Alert variant="info">
                    <strong>Solution:</strong> The frontend now uses client-side timezone calculation 
                    to ensure consistent dates regardless of server timezone differences.
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {apiResponse && (
        <Row>
          <Col md={12}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  <i className="fas fa-code me-2"></i>
                  API Response
                </h5>
              </Card.Header>
              <Card.Body>
                <pre style={{ maxHeight: '400px', overflow: 'auto' }}>
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default TimezoneTestPage;
