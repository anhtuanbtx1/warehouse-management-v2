'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Modal, Row } from 'react-bootstrap';
import { useToast } from '@/contexts/ToastContext';
import { useScanInputCapture } from '@/hooks/useScanInputCapture';
import { lookupProductByImei } from '@/services/productLookupService';
import { submitImeiPayment } from '@/services/paymentSubmissionAdapter';
import { extractImeiFromQrPayload } from '@/utils/extractImeiFromQrPayload';
import {
  canConfirmProductCheck,
  canSafelyCloseImeiPaymentSession,
  canStartPayment,
  createInitialImeiPaymentSession,
  createNewImeiPaymentSession,
  getImeiPaymentStatusNotice,
  type ImeiPaymentSessionState,
  type PaymentResult,
  type PaymentSessionStatus,
  resetImeiPaymentSession,
} from '@/types/qr-imei-payment';

interface QrImeiPaymentSubmenuProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: (result: PaymentResult) => void;
}

const statusConfig: Record<
  PaymentSessionStatus,
  { label: string; badge: string; hint: string }
> = {
  READY_FOR_SCAN: {
    label: 'San sang quet',
    badge: 'secondary',
    hint: 'Phien hien tai da duoc khoi tao va dang cho du lieu tu may quet.',
  },
  LOOKING_UP_PRODUCT: {
    label: 'Dang tra cuu san pham',
    badge: 'primary',
    hint: 'Da parse duoc IMEI va dang dong bo voi nguon du lieu san pham hien tai.',
  },
  ERROR: {
    label: 'Loi phien',
    badge: 'danger',
    hint: 'Phien giu thong bao loi parser hoac lookup va cho phep quet lai trong cung session.',
  },
  AWAITING_CONFIRMATION: {
    label: 'Cho xac nhan',
    badge: 'warning',
    hint: 'San pham da duoc tim thay va san sang de nhan vien kiem tra truoc khi thanh toan.',
  },
  PAYING: {
    label: 'Dang thanh toan',
    badge: 'info',
    hint: 'Tam khoa thao tac de tranh submit trung trong luc tao giao dich.',
  },
  PAYMENT_SUCCESS: {
    label: 'Thanh toan thanh cong',
    badge: 'success',
    hint: 'Phien hoan tat va san sang chuyen sang mot phien moi khong dung lai du lieu cu.',
  },
};

const parserStatusCopy: Record<
  PaymentSessionStatus,
  {
    title: string;
    detail: string;
    tone: 'muted' | 'danger' | 'success';
  }
> = {
  READY_FOR_SCAN: {
    title: 'Dang cho raw scan moi',
    detail: 'May quet se day payload vao o nhap, sau do parser tu dong chuan hoa, tim IMEI va kich hoat lookup.',
    tone: 'muted',
  },
  LOOKING_UP_PRODUCT: {
    title: 'Dang tra cuu san pham theo IMEI vua parse',
    detail: 'UI tam khoa buoc tiep theo cho den khi nhan duoc ket qua khop chinh xac tu luong san pham hien tai.',
    tone: 'muted',
  },
  ERROR: {
    title: 'Session dang giu thong diep loi de cho lan quet moi',
    detail: 'UI xoa du lieu san pham cu khi parser that bai hoac lookup khong thanh cong de tranh nham lan.',
    tone: 'danger',
  },
  AWAITING_CONFIRMATION: {
    title: 'Parser va lookup da hoan tat',
    detail: 'IMEI hop le da duoc gan voi dung mot ban ghi san pham san sang ban trong session hien tai.',
    tone: 'success',
  },
  PAYING: {
    title: 'Dang giu khoa thao tac cho buoc thanh toan',
    detail: 'Session khong nhan them du lieu moi trong khi phien dang o buoc thanh toan.',
    tone: 'muted',
  },
  PAYMENT_SUCCESS: {
    title: 'Phien da hoan tat',
    detail: 'Co the tao phien moi ma khong dung lai payload, IMEI hoac san pham cua phien truoc.',
    tone: 'success',
  },
};

const formatStatusLabel = (status: string) => {
  const normalizedStatus = status.trim().toUpperCase();

  if (normalizedStatus === 'IN_STOCK') {
    return 'Con hang';
  }

  if (normalizedStatus === 'SOLD') {
    return 'Da ban';
  }

  if (normalizedStatus === 'DAMAGED') {
    return 'Hong';
  }

  if (normalizedStatus === 'RETURNED') {
    return 'Tra lai';
  }

  return status;
};

const QrImeiPaymentSubmenu: React.FC<QrImeiPaymentSubmenuProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const { showError, showInfo, showWarning } = useToast();
  const [session, setSession] = useState<ImeiPaymentSessionState>(
    createInitialImeiPaymentSession
  );
  const [sessionCounter, setSessionCounter] = useState(1);
  const lookupRequestRef = useRef(0);
  const [testScanCounter, setTestScanCounter] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    lookupRequestRef.current += 1;
    setSession(createNewImeiPaymentSession());
    setSessionCounter(1);
  }, [isOpen]);

  const statusMeta = useMemo(() => statusConfig[session.status], [session.status]);
  const parserMeta = useMemo(() => parserStatusCopy[session.status], [session.status]);
  const statusNotice = useMemo(() => getImeiPaymentStatusNotice(session), [session]);
  const canConfirmCurrentProduct = useMemo(() => canConfirmProductCheck(session), [session]);
  const canSubmitCurrentPayment = useMemo(() => canStartPayment(session), [session]);
  const canCloseSession = useMemo(() => canSafelyCloseImeiPaymentSession(session), [session]);

  const updateSession = (updater: (current: ImeiPaymentSessionState) => ImeiPaymentSessionState) => {
    setSession((current) => {
      const next = updater(current);
      return {
        ...next,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleResetCurrent = () => {
    lookupRequestRef.current += 1;
    updateSession((current) => resetImeiPaymentSession(current));
  };

  const handleRequestClose = () => {
    if (!canCloseSession) {
      showInfo(
        'Dang tao giao dich',
        'Vui long doi he thong tra ket qua thanh toan truoc khi dong submenu de tranh mat dau vet phien hien tai.',
        3000
      );
      return;
    }

    onClose();
  };

  const handleStartNewSession = () => {
    lookupRequestRef.current += 1;
    setSession(createNewImeiPaymentSession());
    setSessionCounter((current) => current + 1);
  };

  const handleScanReceived = async (rawValue: string) => {
    const parseResult = extractImeiFromQrPayload(rawValue);
    const lookupRequestId = lookupRequestRef.current + 1;

    lookupRequestRef.current = lookupRequestId;

    if (!parseResult.success) {
      updateSession((current) => ({
        ...current,
        rawScanValue: parseResult.normalizedPayload,
        extractedImei: null,
        parserErrorCode: parseResult.errorCode,
        product: null,
        paymentResult: null,
        errorMessage: parseResult.errorMessage,
        status: 'ERROR',
      }));
      return;
    }

    updateSession((current) => ({
      ...current,
      rawScanValue: parseResult.normalizedPayload,
      extractedImei: parseResult.imei,
      parserErrorCode: null,
      product: null,
      paymentResult: null,
      errorMessage: null,
      status: 'LOOKING_UP_PRODUCT',
    }));

    const lookupResult = await lookupProductByImei(parseResult.imei);

    if (lookupRequestRef.current !== lookupRequestId) {
      return;
    }

    if (!lookupResult.found || !lookupResult.product) {
      const lookupErrorMessage = lookupResult.errorMessage ?? 'Khong the tra cuu san pham theo IMEI da quet.';

      updateSession((current) => ({
        ...current,
        product: null,
        paymentResult: null,
        errorMessage: lookupErrorMessage,
        status: 'ERROR',
      }));

      if (lookupErrorMessage.includes('Khong tim thay')) {
        showWarning('Khong tim thay san pham', lookupErrorMessage);
      } else {
        showError('Loi tra cuu san pham', lookupErrorMessage);
      }
      return;
    }

    const product = lookupResult.product;

    if (!product.IsSaleReady) {
      const notSaleReadyMessage = `San pham ${product.ProductName} dang o trang thai ${formatStatusLabel(
        product.Status
      )} va chua san sang de thanh toan.`;

      updateSession((current) => ({
        ...current,
        product,
        paymentResult: null,
        errorMessage: notSaleReadyMessage,
        status: 'ERROR',
      }));
      showWarning('San pham chua san sang ban', notSaleReadyMessage);
      return;
    }

    updateSession((current) => ({
      ...current,
      product,
      confirmation: {
        checkedByStaff: false,
        checkedAt: null,
      },
      paymentResult: null,
      errorMessage: null,
      status: 'AWAITING_CONFIRMATION',
    }));
    showInfo('Da tim thay san pham', `San pham ${product.ProductName} da duoc gan vao session hien tai.`);
  };

  const scanInputCapture = useScanInputCapture({
    isActive: isOpen,
    disabled:
      session.status === 'PAYING' ||
      session.status === 'LOOKING_UP_PRODUCT' ||
      session.status === 'PAYMENT_SUCCESS',
    onScanReceived: handleScanReceived,
  });

  useEffect(() => {
    scanInputCapture.resetScanValue();
  }, [scanInputCapture.resetScanValue, session.sessionId]);

  const handleToggleConfirmation = (checked: boolean) => {
    updateSession((current) => {
      if (!canConfirmProductCheck(current)) {
        return {
          ...current,
          confirmation: {
            checkedByStaff: false,
            checkedAt: null,
          },
        };
      }

      return {
        ...current,
        confirmation: {
          checkedByStaff: checked,
          checkedAt: checked ? new Date().toISOString() : null,
        },
      };
    });
  };

  const handleTestScan = () => {
    console.log('Test Scan button clicked');
    const testImei = '123456789012345';

    showInfo('Test Scan', 'Dang nap IMEI mau: 123456789012345');
    setTestScanCounter((prev) => prev + 1);

    // Khi bam nut test, textarea se blur. Chan hook tu focus nguoc lai vao o quet.
    scanInputCapture.ignoreNextBlur();
    handleScanReceived(testImei);
  };

  const handleStartPayment = async () => {
    const currentSession = session;

    if (!canStartPayment(currentSession)) {
      updateSession((current) => ({
        ...current,
        errorMessage:
          'Chi duoc thanh toan sau khi nhan vien xac nhan da kiem tra dung thong tin san pham trong session hien tai.',
      }));
      return;
    }

    updateSession((current) => {
      if (!canStartPayment(current) || current.status === 'PAYING') {
        return current;
      }

      return {
        ...current,
        status: 'PAYING',
        paymentResult: null,
        errorMessage: null,
      };
    });

    const result = await submitImeiPayment({ session: currentSession });

    updateSession((current) => {
      if (current.sessionId !== currentSession.sessionId) {
        return current;
      }

      if (result.success) {
        return {
          ...current,
          status: 'PAYMENT_SUCCESS',
          paymentResult: result,
          errorMessage: null,
        };
      }

      return {
        ...current,
        status: 'AWAITING_CONFIRMATION',
        paymentResult: result,
        errorMessage:
          result.errorMessage ??
          'Khong the tao giao dich thanh toan cho san pham dang hien thi. Neu thong tin san pham van dung, vui long thu lai; neu nghi ngo luot quet da sai, hay quet lai.',
      };
    });

    if (result.success) {
      onPaymentSuccess?.(result);
      showInfo(
        'Thanh toan thanh cong',
        result.invoiceNumber
          ? `Da tao giao dich ${result.invoiceNumber} cho san pham trong session hien tai.`
          : 'Da tao giao dich thanh cong cho san pham trong session hien tai.'
      );
      return;
    }

    showError(
      'Thanh toan that bai',
      result.errorMessage ??
        'Khong the tao giao dich thanh toan cho san pham dang hien thi. Neu thong tin san pham van dung, vui long thu lai; neu nghi ngo luot quet da sai, hay quet lai.'
    );
  };

  return (
    <Modal show={isOpen} onHide={handleRequestClose} size="lg" centered backdrop={session.status === 'PAYING' ? 'static' : true} keyboard={canCloseSession}>
      <Modal.Header closeButton>
        <Modal.Title>
          <span className="me-2">📷</span>
          Thanh toan IMEI bang may quet QR
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="info" className="mb-4">
          Submenu dang nhan raw scan truc tiep tu may quet, tu dong parse IMEI, tra cuu san pham va giu session chi voi mot ban ghi hop le cho moi lan quet.
        </Alert>

        <Card className="mb-3 border-0 bg-light-subtle">
          <Card.Body>
            <Row className="g-3 align-items-center">
              <Col md={8}>
                <div className="d-flex flex-column gap-2">
                  <div>
                    <small className="text-muted d-block">Ma phien</small>
                    <code>{session.sessionId}</code>
                  </div>
                  <div>
                    <small className="text-muted d-block">Trang thai</small>
                    <Badge bg={statusMeta.badge}>{statusMeta.label}</Badge>
                  </div>
                  <div>
                    <small className="text-muted d-block">Mo ta</small>
                    <span>{statusMeta.hint}</span>
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <div className="border rounded p-3 bg-white">
                  <small className="text-muted d-block">So thu tu phien</small>
                  <div className="fs-4 fw-bold">#{sessionCounter}</div>
                  <small className="text-muted d-block mt-3">Lan cap nhat cuoi</small>
                  <span>{new Date(session.updatedAt).toLocaleString('vi-VN')}</span>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Row className="g-3 mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Vung nhan du lieu tu may quet</Form.Label>
              <Form.Control
                ref={scanInputCapture.inputRef}
                as="textarea"
                rows={4}
                value={scanInputCapture.scanValue}
                placeholder="Mo submenu, dua con tro vao day va quet QR. Nhan Enter de chot raw scan hien tai."
                onChange={(event) => scanInputCapture.setScanValue(event.target.value)}
                onKeyDown={scanInputCapture.handleKeyDown}
                onBlur={scanInputCapture.handleBlur}
                disabled={
                  session.status === 'PAYING' ||
                  session.status === 'LOOKING_UP_PRODUCT' ||
                  session.status === 'PAYMENT_SUCCESS'
                }
              />
              <Form.Text className="text-muted">
                Moi phien chi giu mot payload dang hoat dong. Luot quet moi se thay the raw scan hien tai, xoa du lieu san pham cu va parser se kich hoat lookup ngay sau khi nhan Enter.
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Du lieu quet QR da chuan hoa</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={session.rawScanValue ?? ''}
                placeholder="Chua co raw scan duoc ghi nhan trong phien hien tai"
                readOnly
              />
            </Form.Group>
          </Col>
        </Row>

        <Alert variant={statusNotice.variant} className="mb-3">
          <div className="fw-semibold mb-1">{statusNotice.title}</div>
          <div className="small mb-0">{statusNotice.detail}</div>
        </Alert>

        {session.errorMessage ? (
          <Alert variant={session.product && !session.product.IsSaleReady ? 'warning' : 'danger'} className="mb-3">
            {session.errorMessage}
          </Alert>
        ) : null}

        <Row className="g-3 mb-3">
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>IMEI da trich xuat</Form.Label>
              <Form.Control
                value={session.extractedImei ?? ''}
                placeholder="Parser se dien IMEI hop le vao day de nhan vien kiem tra"
                readOnly
              />
              <Form.Text className="text-muted">
                IMEI hop le se duoc tu dong dua sang buoc tra cuu san pham ngay trong session hien tai.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ma loi parser</Form.Label>
              <Form.Control
                value={session.parserErrorCode ?? ''}
                placeholder="Khong co loi parser trong phien hien tai"
                readOnly
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Thong diep loi / ghi chu phien</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={session.errorMessage ?? ''}
                placeholder="Khong co loi trong phien hien tai"
                readOnly
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Card className="h-100 border-dashed">
              <Card.Body>
                <small className="text-muted d-block mb-2">Trang thai hand-off parser</small>
                <div
                  className={`fw-semibold mb-2 ${
                    parserMeta.tone === 'danger'
                      ? 'text-danger'
                      : parserMeta.tone === 'success'
                        ? 'text-success'
                        : ''
                  }`}
                >
                  {parserMeta.title}
                </div>
                <div className="text-muted small">{parserMeta.detail}</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className="mb-3">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <strong>Thong tin san pham theo IMEI</strong>
            <Badge bg={session.product?.IsSaleReady ? 'success' : 'secondary'}>
              {session.product ? 'Da dong bo' : 'Chua co san pham'}
            </Badge>
          </Card.Header>
          <Card.Body>
            {session.product ? (
              <Row className="g-3">
                <Col md={6}>
                  <small className="text-muted d-block">Ten san pham</small>
                  <div className="fw-semibold">{session.product.ProductName}</div>
                </Col>
                <Col md={6}>
                  <small className="text-muted d-block">Ma san pham</small>
                  <div>{session.product.ProductCode ?? 'Chua co ma san pham'}</div>
                </Col>
                <Col md={6}>
                  <small className="text-muted d-block">IMEI</small>
                  <code>{session.product.IMEI}</code>
                </Col>
                <Col md={6}>
                  <small className="text-muted d-block">Trang thai ban hang</small>
                  <div>
                    <Badge bg={session.product.IsSaleReady ? 'success' : 'warning'}>
                      {formatStatusLabel(session.product.Status)}
                    </Badge>
                  </div>
                </Col>
              </Row>
            ) : (
              <div className="text-muted small">
                Chua co ban ghi san pham nao duoc giu trong session hien tai. Neu lookup that bai, UI se xoa ket qua cu de cho phep quet lai an toan.
              </div>
            )}
          </Card.Body>
        </Card>

        <Card className="mb-3 border-info">
          <Card.Header className="bg-info text-white">
            <strong>🧪 Debug: Test Scan Counter</strong>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={6}>
                <small className="text-muted d-block">So lan bam Test Scan</small>
                <div className="fs-5 fw-bold text-info">{testScanCounter}</div>
              </Col>
              <Col md={6}>
                <small className="text-muted d-block">Raw Scan Value</small>
                <code className="d-block text-break">{session.rawScanValue || '(empty)'}</code>
              </Col>
              <Col md={6}>
                <small className="text-muted d-block">Extracted IMEI</small>
                <code className="d-block text-break">{session.extractedImei || '(empty)'}</code>
              </Col>
              <Col md={6}>
                <small className="text-muted d-block">Session Status</small>
                <Badge bg="secondary">{session.status}</Badge>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <strong>Vong doi phien co ban</strong>
            <Badge bg="dark">1 IMEI / 1 san pham / 1 phien</Badge>
          </Card.Header>
          <Card.Body>
            <Alert variant={session.confirmation.checkedByStaff ? 'success' : 'warning'} className="mb-3">
              <div className="fw-semibold mb-1">Buoc xac nhan truoc thanh toan</div>
              <div className="small mb-0">
                {canConfirmCurrentProduct
                  ? session.confirmation.checkedByStaff
                    ? 'Nhan vien da xac nhan da kiem tra dung thong tin san pham. Co the gui giao dich thanh toan cho session hien tai.'
                    : 'Session dang cho nhan vien danh dau da kiem tra thong tin san pham truoc khi mo khoa nut thanh toan.'
                  : 'Chi duoc xac nhan khi session dang giu dung mot IMEI va mot ban ghi san pham hop le, san sang ban.'}
              </div>
            </Alert>

            {session.paymentResult?.success ? (
              <Alert variant="success" className="mb-3">
                {session.paymentResult.invoiceNumber
                  ? `Da tao giao dich thanh cong voi ma ${session.paymentResult.invoiceNumber}.`
                  : 'Da tao giao dich thanh cong cho san pham trong session hien tai.'}
              </Alert>
            ) : null}

            <Form.Check
              id="staff-product-confirmation"
              type="checkbox"
              className="mb-3"
              label="Toi da kiem tra thong tin san pham va xac nhan day la thiet bi can thanh toan"
              checked={session.confirmation.checkedByStaff}
              disabled={!canConfirmCurrentProduct || session.status === 'PAYING' || session.status === 'PAYMENT_SUCCESS'}
              onChange={(event) => handleToggleConfirmation(event.target.checked)}
            />

            <Row className="g-3 mb-3">
              <Col md={6}>
                <small className="text-muted d-block">Trang thai xac nhan</small>
                <div className="fw-semibold">
                  {session.confirmation.checkedByStaff ? 'Da xac nhan' : 'Chua xac nhan'}
                </div>
              </Col>
              <Col md={6}>
                <small className="text-muted d-block">Thoi diem xac nhan</small>
                <div>
                  {session.confirmation.checkedAt
                    ? new Date(session.confirmation.checkedAt).toLocaleString('vi-VN')
                    : 'Chua co xac nhan'}
                </div>
              </Col>
            </Row>

            <div className="d-flex flex-wrap gap-2 mb-3">
              <Button
                variant={session.status === 'PAYMENT_SUCCESS' ? 'success' : 'outline-info'}
                onClick={handleStartPayment}
                disabled={!canSubmitCurrentPayment || session.status === 'PAYING' || session.status === 'PAYMENT_SUCCESS'}
              >
                {session.status === 'PAYING' ? 'Dang tao giao dich...' : 'Thanh toan san pham'}
              </Button>
              <Button
                variant="outline-warning"
                onClick={handleTestScan}
                disabled={false}
              >
                🧪 Test Scan (IMEI: 123456789012345)
              </Button>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <Button variant="secondary" onClick={handleResetCurrent}>
                Xoa thao tac hien tai
              </Button>
              <Button variant="success" onClick={handleStartNewSession}>
                Tao phien moi
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleRequestClose} disabled={!canCloseSession}>
          Dong submenu
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default QrImeiPaymentSubmenu;
