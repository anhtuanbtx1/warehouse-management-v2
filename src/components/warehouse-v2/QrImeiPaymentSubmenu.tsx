'use client';

import React, { useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Modal, Row } from 'react-bootstrap';
import { useToast } from '@/contexts/ToastContext';
import { useScanInputCapture } from '@/hooks/useScanInputCapture';
import { lookupProductByImei } from '@/services/productLookupService';
import { extractImeiFromQrPayload } from '@/utils/extractImeiFromQrPayload';
import type { ProductLookupRecord } from '@/types/qr-imei-payment';

interface ImeiLookupSubmenuProps {
  isOpen: boolean;
  onClose: () => void;
  onProductFound?: (product: ProductLookupRecord) => void;
}

const ImeiLookupSubmenu: React.FC<ImeiLookupSubmenuProps> = ({
  isOpen,
  onClose,
  onProductFound,
}) => {
  const { showError, showInfo, showWarning } = useToast();
  const [imei, setImei] = useState('');
  const [product, setProduct] = useState<ProductLookupRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookupCount, setLookupCount] = useState(0);

  async function handleScanReceived(rawValue: string) {
    const parseResult = extractImeiFromQrPayload(rawValue);

    if (!parseResult.success) {
      setError(parseResult.errorMessage);
      setProduct(null);
      showWarning('Loi parse IMEI', parseResult.errorMessage);
      return;
    }

    await performLookup(parseResult.imei);
  }

  const scanInputCapture = useScanInputCapture({
    isActive: isOpen,
    disabled: loading,
    onScanReceived: handleScanReceived,
  });

  async function performLookup(searchImei: string) {
    setLoading(true);
    setError(null);
    setProduct(null);
    setLookupCount((prev) => prev + 1);

    try {
      const result = await lookupProductByImei(searchImei);

      if (!result.found || !result.product) {
        const msg = result.errorMessage ?? 'Khong tim thay san pham voi IMEI nay.';
        setError(msg);
        showWarning('Khong tim thay', msg);
        return;
      }

      setProduct(result.product);
      setImei(searchImei);
      showInfo('Tim thay san pham', `${result.product.ProductName}`);
      onProductFound?.(result.product);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Co loi xay ra.';
      setError(msg);
      showError('Loi tra cuu', msg);
    } finally {
      setLoading(false);
      scanInputCapture.resetScanValue();
    }
  }

  const handleManualLookup = async () => {
    if (!imei.trim()) {
      showWarning('Canh bao', 'Vui long nhap hoac quet IMEI.');
      return;
    }
    await performLookup(imei.trim());
  };

  const handleReset = () => {
    setImei('');
    setProduct(null);
    setError(null);
    scanInputCapture.resetScanValue();
  };

  return (
    <Modal show={isOpen} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <span className="me-2">🔍</span>
          Tra cuu san pham theo IMEI
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="info" className="mb-4">
          Quet QR hoac nhap IMEI de tra cuu thong tin san pham.
        </Alert>

        <Form.Group className="mb-3">
          <Form.Label>Quet QR hoac nhap IMEI</Form.Label>
          <Form.Control
            ref={scanInputCapture.inputRef}
            as="textarea"
            rows={3}
            value={scanInputCapture.scanValue}
            placeholder="Quet QR hoac nhap IMEI, nhan Enter de tra cuu."
            onChange={(e) => scanInputCapture.setScanValue(e.target.value)}
            onKeyDown={scanInputCapture.handleKeyDown}
            onBlur={scanInputCapture.handleBlur}
            disabled={loading}
          />
          <Form.Text className="text-muted">
            Nhan Enter sau khi quet hoac nhap IMEI.
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Hoac nhap IMEI tay</Form.Label>
          <div className="d-flex gap-2">
            <Form.Control
              type="text"
              placeholder="Nhap IMEI (15 so)"
              value={imei}
              onChange={(e) => setImei(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleManualLookup();
              }}
            />
            <Button
              variant="primary"
              onClick={handleManualLookup}
              disabled={loading || !imei.trim()}
            >
              {loading ? 'Dang tra cuu...' : 'Tra cuu'}
            </Button>
          </div>
        </Form.Group>

        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {product && (
          <Card className="mb-3 border-success">
            <Card.Header className="bg-success text-white">
              <strong>Thong tin san pham</strong>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={6}>
                  <small className="text-muted d-block">Ten san pham</small>
                  <div className="fw-semibold">{product.ProductName}</div>
                </Col>
                <Col md={6}>
                  <small className="text-muted d-block">IMEI</small>
                  <code>{product.IMEI}</code>
                </Col>
                <Col md={6}>
                  <small className="text-muted d-block">Trang thai</small>
                  <Badge bg={product.IsSaleReady ? 'success' : 'warning'}>
                    {product.Status}
                  </Badge>
                </Col>
                <Col md={6}>
                  <small className="text-muted d-block">Gia ban</small>
                  <div className="fw-semibold">
                    {product.SalePrice ? `${product.SalePrice.toLocaleString('vi-VN')} VND` : 'Chua co gia'}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        <Card className="mb-3 border-info">
          <Card.Header className="bg-info text-white">
            <strong>Thong ke</strong>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={6}>
                <small className="text-muted d-block">So lan tra cuu</small>
                <div className="fs-5 fw-bold">{lookupCount}</div>
              </Col>
              <Col md={6}>
                <small className="text-muted d-block">Trang thai</small>
                <Badge bg={loading ? 'warning' : product ? 'success' : 'secondary'}>
                  {loading ? 'Dang tra cuu' : product ? 'Tim thay' : 'Cho nhap'}
                </Badge>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <div className="d-flex gap-2">
          <Button variant="secondary" onClick={handleReset}>
            Xoa
          </Button>
          <Button variant="outline-secondary" onClick={onClose}>
            Dong
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ImeiLookupSubmenu;
