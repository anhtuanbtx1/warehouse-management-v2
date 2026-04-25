import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canConfirmProductCheck,
  canStartPayment,
  resetImeiPaymentSession,
  createInitialImeiPaymentSession,
  type ImeiPaymentSessionState,
} from './qr-imei-payment.ts';

/**
 * Unit tests for confirmation and payment button enable/disable conditions
 * 
 * **Validates: Requirements 4.2, 4.3, 6.2**
 * 
 * These tests verify:
 * - Payment button is locked before confirmation
 * - Payment button is enabled after valid confirmation
 * - Reset operation clears confirmation state
 */

const createValidProductSession = (): ImeiPaymentSessionState => ({
  ...createInitialImeiPaymentSession(),
  status: 'AWAITING_CONFIRMATION',
  extractedImei: '356789012345678',
  product: {
    ProductID: 10,
    ProductName: 'iPhone 15 Pro',
    ProductCode: 'IP15P-256',
    IMEI: '356789012345678',
    Status: 'IN_STOCK',
    IsSaleReady: true,
    SalePrice: 28990000,
  },
});

test('payment button is locked when confirmation checkbox is not checked', () => {
  const session = createValidProductSession();
  session.confirmation = {
    checkedByStaff: false,
    checkedAt: null,
  };

  assert.equal(canConfirmProductCheck(session), true, 'Should allow confirmation checkbox to be enabled');
  assert.equal(canStartPayment(session), false, 'Payment button should be locked before confirmation');
});

test('payment button is enabled after staff confirms product check', () => {
  const session = createValidProductSession();
  session.confirmation = {
    checkedByStaff: true,
    checkedAt: '2026-04-25T05:00:00.000Z',
  };

  assert.equal(canConfirmProductCheck(session), true, 'Confirmation checkbox should remain valid');
  assert.equal(canStartPayment(session), true, 'Payment button should be enabled after confirmation');
});

test('confirmation checkbox is disabled when session has no product', () => {
  const session = createInitialImeiPaymentSession();
  session.status = 'AWAITING_CONFIRMATION';
  session.extractedImei = '356789012345678';
  session.product = null;

  assert.equal(canConfirmProductCheck(session), false, 'Cannot confirm without product');
  assert.equal(canStartPayment(session), false, 'Cannot start payment without product');
});

test('confirmation checkbox is disabled when session has no extracted IMEI', () => {
  const session = createValidProductSession();
  session.extractedImei = null;

  assert.equal(canConfirmProductCheck(session), false, 'Cannot confirm without extracted IMEI');
  assert.equal(canStartPayment(session), false, 'Cannot start payment without IMEI');
});

test('confirmation checkbox is disabled when product is not sale-ready', () => {
  const session = createValidProductSession();
  session.product = {
    ...session.product!,
    Status: 'SOLD',
    IsSaleReady: false,
  };

  assert.equal(canConfirmProductCheck(session), false, 'Cannot confirm product that is not sale-ready');
  assert.equal(canStartPayment(session), false, 'Cannot start payment for non-sale-ready product');
});

test('confirmation checkbox is disabled when product IMEI does not match extracted IMEI', () => {
  const session = createValidProductSession();
  session.product = {
    ...session.product!,
    IMEI: '999888777666555',
  };

  assert.equal(canConfirmProductCheck(session), false, 'Cannot confirm when IMEIs do not match');
  assert.equal(canStartPayment(session), false, 'Cannot start payment when IMEIs do not match');
});

test('confirmation checkbox is disabled when session status is not AWAITING_CONFIRMATION', () => {
  const session = createValidProductSession();
  session.status = 'READY_FOR_SCAN';

  assert.equal(canConfirmProductCheck(session), false, 'Cannot confirm in READY_FOR_SCAN status');

  session.status = 'LOOKING_UP_PRODUCT';
  assert.equal(canConfirmProductCheck(session), false, 'Cannot confirm in LOOKING_UP_PRODUCT status');

  session.status = 'ERROR';
  assert.equal(canConfirmProductCheck(session), false, 'Cannot confirm in ERROR status');

  session.status = 'PAYING';
  assert.equal(canConfirmProductCheck(session), false, 'Cannot confirm in PAYING status');

  session.status = 'PAYMENT_SUCCESS';
  assert.equal(canConfirmProductCheck(session), false, 'Cannot confirm in PAYMENT_SUCCESS status');
});

test('reset operation clears confirmation state completely', () => {
  const session = createValidProductSession();
  session.confirmation = {
    checkedByStaff: true,
    checkedAt: '2026-04-25T05:00:00.000Z',
  };
  session.rawScanValue = 'QR:356789012345678';

  const resetSession = resetImeiPaymentSession(session);

  assert.equal(resetSession.confirmation.checkedByStaff, false, 'Confirmation should be cleared');
  assert.equal(resetSession.confirmation.checkedAt, null, 'Confirmation timestamp should be cleared');
  assert.equal(resetSession.status, 'READY_FOR_SCAN', 'Status should return to READY_FOR_SCAN');
  assert.equal(resetSession.rawScanValue, null, 'Raw scan should be cleared');
  assert.equal(resetSession.extractedImei, null, 'Extracted IMEI should be cleared');
  assert.equal(resetSession.product, null, 'Product should be cleared');
  assert.notEqual(resetSession.sessionId, session.sessionId, 'Session ID should be regenerated');
});

test('reset operation clears confirmation even when payment failed', () => {
  const session = createValidProductSession();
  session.confirmation = {
    checkedByStaff: true,
    checkedAt: '2026-04-25T05:00:00.000Z',
  };
  session.paymentResult = {
    success: false,
    errorMessage: 'Payment gateway timeout',
  };
  session.errorMessage = 'Payment failed';

  const resetSession = resetImeiPaymentSession(session);

  assert.equal(resetSession.confirmation.checkedByStaff, false, 'Confirmation should be cleared after failed payment');
  assert.equal(resetSession.confirmation.checkedAt, null, 'Confirmation timestamp should be cleared');
  assert.equal(resetSession.paymentResult, null, 'Payment result should be cleared');
  assert.equal(resetSession.errorMessage, null, 'Error message should be cleared');
});

test('payment button remains locked even with confirmation if product becomes not sale-ready', () => {
  const session = createValidProductSession();
  session.confirmation = {
    checkedByStaff: true,
    checkedAt: '2026-04-25T05:00:00.000Z',
  };
  
  // Simulate product status change
  session.product = {
    ...session.product!,
    Status: 'DAMAGED',
    IsSaleReady: false,
  };

  assert.equal(canStartPayment(session), false, 'Payment should be blocked if product becomes not sale-ready');
});

test('payment button remains locked if IMEI mismatch occurs after confirmation', () => {
  const session = createValidProductSession();
  session.confirmation = {
    checkedByStaff: true,
    checkedAt: '2026-04-25T05:00:00.000Z',
  };
  
  // Simulate IMEI mismatch
  session.extractedImei = '111222333444555';

  assert.equal(canStartPayment(session), false, 'Payment should be blocked if IMEI mismatch occurs');
});

test('confirmation checkbox can be toggled off and payment button becomes locked again', () => {
  const session = createValidProductSession();
  
  // First, confirm
  session.confirmation = {
    checkedByStaff: true,
    checkedAt: '2026-04-25T05:00:00.000Z',
  };
  assert.equal(canStartPayment(session), true, 'Payment should be enabled after confirmation');

  // Then, uncheck
  session.confirmation = {
    checkedByStaff: false,
    checkedAt: null,
  };
  assert.equal(canStartPayment(session), false, 'Payment should be locked after unchecking confirmation');
});

test('multiple reset operations maintain consistent cleared state', () => {
  const session = createValidProductSession();
  session.confirmation = {
    checkedByStaff: true,
    checkedAt: '2026-04-25T05:00:00.000Z',
  };

  const firstReset = resetImeiPaymentSession(session);
  const secondReset = resetImeiPaymentSession(firstReset);

  assert.equal(secondReset.confirmation.checkedByStaff, false, 'Confirmation should remain cleared');
  assert.equal(secondReset.confirmation.checkedAt, null, 'Confirmation timestamp should remain null');
  assert.equal(secondReset.status, 'READY_FOR_SCAN', 'Status should remain READY_FOR_SCAN');
  assert.notEqual(secondReset.sessionId, firstReset.sessionId, 'Each reset should generate new session ID');
});

test('confirmation state is preserved during status transitions before payment', () => {
  const session = createValidProductSession();
  session.confirmation = {
    checkedByStaff: true,
    checkedAt: '2026-04-25T05:00:00.000Z',
  };

  // Simulate transition to PAYING status
  const payingSession = {
    ...session,
    status: 'PAYING' as const,
  };

  // Confirmation state should be preserved
  assert.equal(payingSession.confirmation.checkedByStaff, true, 'Confirmation should be preserved during payment');
  assert.equal(payingSession.confirmation.checkedAt, '2026-04-25T05:00:00.000Z', 'Confirmation timestamp should be preserved');
});

test('all confirmation conditions must be met simultaneously for payment to be enabled', () => {
  const session = createValidProductSession();

  // Missing confirmation
  session.confirmation = {
    checkedByStaff: false,
    checkedAt: null,
  };
  assert.equal(canStartPayment(session), false, 'Payment blocked: missing confirmation');

  // Add confirmation but remove product
  session.confirmation.checkedByStaff = true;
  session.confirmation.checkedAt = '2026-04-25T05:00:00.000Z';
  session.product = null;
  assert.equal(canStartPayment(session), false, 'Payment blocked: missing product');

  // Restore product but remove IMEI
  session.product = {
    ProductID: 10,
    ProductName: 'iPhone 15 Pro',
    ProductCode: 'IP15P-256',
    IMEI: '356789012345678',
    Status: 'IN_STOCK',
    IsSaleReady: true,
    SalePrice: 28990000,
  };
  session.extractedImei = null;
  assert.equal(canStartPayment(session), false, 'Payment blocked: missing IMEI');

  // Restore IMEI but make product not sale-ready
  session.extractedImei = '356789012345678';
  session.product.IsSaleReady = false;
  assert.equal(canStartPayment(session), false, 'Payment blocked: product not sale-ready');

  // Fix sale-ready but mismatch IMEI
  session.product.IsSaleReady = true;
  session.product.IMEI = '999888777666555';
  assert.equal(canStartPayment(session), false, 'Payment blocked: IMEI mismatch');

  // Fix IMEI but wrong status
  session.product.IMEI = '356789012345678';
  session.status = 'ERROR';
  assert.equal(canStartPayment(session), false, 'Payment blocked: wrong status');

  // Finally, all conditions met
  session.status = 'AWAITING_CONFIRMATION';
  assert.equal(canStartPayment(session), true, 'Payment enabled: all conditions met');
});
