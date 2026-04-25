import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canConfirmProductCheck,
  canSafelyCloseImeiPaymentSession,
  canStartPayment,
  createInitialImeiPaymentSession,
  createNewImeiPaymentSession,
  getImeiPaymentStatusNotice,
  resetImeiPaymentSession,
  type ImeiPaymentSessionState,
} from '@/types/qr-imei-payment';

const createAwaitingConfirmationSession = (): ImeiPaymentSessionState => ({
  ...createInitialImeiPaymentSession(),
  status: 'AWAITING_CONFIRMATION',
  extractedImei: '356789012345678',
  product: {
    ProductID: 7,
    ProductName: 'Samsung S24 Ultra',
    ProductCode: 'SS24U-512',
    IMEI: '356789012345678',
    Status: 'IN_STOCK',
    IsSaleReady: true,
    SalePrice: 29990000,
  },
});

test('allows staff confirmation only when the session has one sale-ready product matching the extracted IMEI', () => {
  const session = createAwaitingConfirmationSession();

  assert.equal(canConfirmProductCheck(session), true);
  assert.equal(canStartPayment(session), false);
});

test('blocks confirmation when the session product and extracted IMEI do not match exactly', () => {
  const session = createAwaitingConfirmationSession();
  session.product = {
    ...session.product!,
    IMEI: '490154203237518',
  };

  assert.equal(canConfirmProductCheck(session), false);
});

test('allows payment only after staff confirms the checked product information', () => {
  const session = createAwaitingConfirmationSession();
  session.confirmation = {
    checkedByStaff: true,
    checkedAt: '2025-01-01T00:00:00.000Z',
  };

  assert.equal(canStartPayment(session), true);
});

test('initial sessions start without any persisted payment result', () => {
  const session = createInitialImeiPaymentSession();

  assert.equal(session.paymentResult, null);
});

test('resetting the current operation clears all session data and returns to ready-for-scan', () => {
  const session = createAwaitingConfirmationSession();
  session.rawScanValue = 'qr:356789012345678';
  session.parserErrorCode = 'INVALID_FORMAT';
  session.paymentResult = {
    success: false,
    errorMessage: 'temporary error',
  };
  session.errorMessage = 'lookup failed';
  session.confirmation = {
    checkedByStaff: true,
    checkedAt: '2025-01-01T00:00:00.000Z',
  };

  const resetSession = resetImeiPaymentSession(session);

  assert.equal(resetSession.status, 'READY_FOR_SCAN');
  assert.notEqual(resetSession.sessionId, session.sessionId);
  assert.equal(resetSession.rawScanValue, null);
  assert.equal(resetSession.extractedImei, null);
  assert.equal(resetSession.parserErrorCode, null);
  assert.equal(resetSession.product, null);
  assert.deepEqual(resetSession.confirmation, {
    checkedByStaff: false,
    checkedAt: null,
  });
  assert.equal(resetSession.paymentResult, null);
  assert.equal(resetSession.errorMessage, null);
});

test('starting a new session after success creates a distinct session id without carrying scan state forward', () => {
  const successfulSession = createAwaitingConfirmationSession();
  successfulSession.status = 'PAYMENT_SUCCESS';
  successfulSession.rawScanValue = 'qr:356789012345678';
  successfulSession.paymentResult = {
    success: true,
    invoiceNumber: 'HD2025000001',
  };
  successfulSession.confirmation = {
    checkedByStaff: true,
    checkedAt: '2025-01-01T00:00:00.000Z',
  };

  const nextSession = createNewImeiPaymentSession();

  assert.equal(nextSession.status, 'READY_FOR_SCAN');
  assert.notEqual(nextSession.sessionId, successfulSession.sessionId);
  assert.equal(nextSession.rawScanValue, null);
  assert.equal(nextSession.extractedImei, null);
  assert.equal(nextSession.product, null);
  assert.equal(nextSession.paymentResult, null);
  assert.equal(nextSession.errorMessage, null);
});

test('blocks submenu close while payment submission is in progress', () => {
  const session = createAwaitingConfirmationSession();
  session.status = 'PAYING';

  assert.equal(canSafelyCloseImeiPaymentSession(session), false);
});

test('allows submenu close after payment is complete and returns retry guidance after failure', () => {
  const successSession = createAwaitingConfirmationSession();
  successSession.status = 'PAYMENT_SUCCESS';
  successSession.confirmation = {
    checkedByStaff: true,
    checkedAt: '2025-01-01T00:00:00.000Z',
  };
  successSession.paymentResult = {
    success: true,
    invoiceNumber: 'HD2025000001',
  };

  assert.equal(canSafelyCloseImeiPaymentSession(successSession), true);
  assert.match(getImeiPaymentStatusNotice(successSession).detail, /dong submenu hoac tao phien quet moi/i);

  const failedSession = createAwaitingConfirmationSession();
  failedSession.paymentResult = {
    success: false,
    errorMessage: 'temporary error',
  };

  const notice = getImeiPaymentStatusNotice(failedSession);
  assert.equal(notice.variant, 'warning');
  assert.match(notice.detail, /thu lai thanh toan/i);
  assert.match(notice.detail, /quet lai/i);
});
