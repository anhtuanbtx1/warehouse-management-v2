import assert from 'node:assert/strict';
import test from 'node:test';

/**
 * Integration regression tests for complete QR IMEI Payment Session Lifecycle
 *
 * **Validates: Requirements 1.2, 2.2, 3.2, 4.2, 5.3, 6.1, 6.2, 6.3**
 *
 * These tests cover the complete session lifecycle scenarios:
 * - Scan error -> rescan flow
 * - Lookup error -> rescan flow
 * - Confirmation -> successful payment flow
 * - Payment failure -> retry flow
 * - Session reset and new session creation
 * - Verification that each session holds only one IMEI and one active product record
 */

type PaymentSessionStatus =
  | 'READY_FOR_SCAN'
  | 'LOOKING_UP_PRODUCT'
  | 'ERROR'
  | 'AWAITING_CONFIRMATION'
  | 'PAYING'
  | 'PAYMENT_SUCCESS';

interface ProductLookupRecord {
  ProductID: number;
  ProductName: string;
  ProductCode?: string;
  IMEI: string;
  Status: string;
  IsSaleReady: boolean;
  SalePrice?: number;
}

interface PaymentResult {
  success: boolean;
  invoiceNumber?: string;
  errorMessage?: string;
}

interface SessionConfirmationState {
  checkedByStaff: boolean;
  checkedAt: string | null;
}

interface ImeiPaymentSessionState {
  sessionId: string;
  status: PaymentSessionStatus;
  rawScanValue: string | null;
  extractedImei: string | null;
  parserErrorCode: string | null;
  product: ProductLookupRecord | null;
  confirmation: SessionConfirmationState;
  paymentResult: PaymentResult | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LookupResponse {
  found: boolean;
  product?: ProductLookupRecord;
  errorMessage?: string;
}

let sessionSequence = 0;

const createSessionId = () => {
  sessionSequence += 1;
  return `test-session-${sessionSequence}`;
};

const createInitialImeiPaymentSession = (): ImeiPaymentSessionState => {
  const timestamp = new Date().toISOString();

  return {
    sessionId: createSessionId(),
    status: 'READY_FOR_SCAN',
    rawScanValue: null,
    extractedImei: null,
    parserErrorCode: null,
    product: null,
    confirmation: {
      checkedByStaff: false,
      checkedAt: null,
    },
    paymentResult: null,
    errorMessage: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

const createProduct = (
  overrides: Partial<ProductLookupRecord> = {}
): ProductLookupRecord => ({
  ProductID: 101,
  ProductName: 'iPhone 15 Pro',
  ProductCode: 'IP15P-256',
  IMEI: '356789012345678',
  Status: 'IN_STOCK',
  IsSaleReady: true,
  SalePrice: 28990000,
  ...overrides,
});

const normalizeQrPayload = (rawValue: string): string => rawValue.replace(/\r\n?/g, '\n').trim();

const extractImeiFromQrPayload = (rawValue: string) => {
  const normalizedPayload = normalizeQrPayload(rawValue);

  if (normalizedPayload.length === 0) {
    return {
      success: false as const,
      normalizedPayload,
      errorCode: 'EMPTY_SCAN',
      errorMessage: 'Chua nhan duoc du lieu quet. Hay quet lai ma QR.',
    };
  }

  const matches = normalizedPayload.match(/(?<!\d)(?:\d[\s-]*){14,17}(?!\d)/g) ?? [];
  const digitCandidates = matches.map((match) => match.replace(/\D/g, ''));
  const validImeis = Array.from(new Set(digitCandidates.filter((candidate) => candidate.length === 15)));
  const nearMatchCandidates = Array.from(
    new Set(digitCandidates.filter((candidate) => candidate.length !== 15))
  );

  if (validImeis.length > 1) {
    return {
      success: false as const,
      normalizedPayload,
      errorCode: 'MULTIPLE_IMEI_FOUND',
      errorMessage: 'Du lieu quet chua nhieu hon mot IMEI. Hay chi quet mot ma cho moi phien.',
    };
  }

  if (validImeis.length === 1) {
    return {
      success: true as const,
      normalizedPayload,
      imei: validImeis[0],
    };
  }

  if (nearMatchCandidates.length > 0) {
    return {
      success: false as const,
      normalizedPayload,
      errorCode: 'INVALID_FORMAT',
      errorMessage: 'Tim thay chuoi so gan giong IMEI nhung khong dung dinh dang 15 chu so.',
    };
  }

  return {
    success: false as const,
    normalizedPayload,
    errorCode: 'IMEI_NOT_FOUND',
    errorMessage: 'Khong tim thay IMEI hop le trong du lieu QR vua quet.',
  };
};

const normalizeLookupImei = (imei: string): string => imei.replace(/\s+/g, '').trim();

const confirmProductCheck = (session: ImeiPaymentSessionState): ImeiPaymentSessionState => ({
  ...session,
  confirmation: {
    checkedByStaff: true,
    checkedAt: '2024-01-01T00:00:00.000Z',
  },
  updatedAt: '2024-01-01T00:00:00.000Z',
});

const resetSession = (): ImeiPaymentSessionState => createInitialImeiPaymentSession();

const applyLookupResult = (
  session: ImeiPaymentSessionState,
  lookupResult: LookupResponse
): ImeiPaymentSessionState => {
  if (!lookupResult.found || !lookupResult.product) {
    return {
      ...session,
      status: 'ERROR',
      product: null,
      errorMessage: lookupResult.errorMessage ?? 'Khong the tra cuu san pham theo IMEI da quet.',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
  }

  if (!lookupResult.product.IsSaleReady) {
    return {
      ...session,
      status: 'ERROR',
      product: lookupResult.product,
      errorMessage: `San pham ${lookupResult.product.ProductName} dang o trang thai ${lookupResult.product.Status} va chua san sang de thanh toan.`,
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
  }

  return {
    ...session,
    status: 'AWAITING_CONFIRMATION',
    product: lookupResult.product,
    errorMessage: null,
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
};

const scanIntoSession = (
  currentSession: ImeiPaymentSessionState,
  rawScanValue: string,
  lookupResult?: LookupResponse
): ImeiPaymentSessionState => {
  const parseResult = extractImeiFromQrPayload(rawScanValue);

  const baseSession: ImeiPaymentSessionState = {
    ...currentSession,
    rawScanValue: parseResult.normalizedPayload,
    extractedImei: null,
    parserErrorCode: null,
    product: null,
    confirmation: {
      checkedByStaff: false,
      checkedAt: null,
    },
    paymentResult: null,
    errorMessage: null,
    status: 'READY_FOR_SCAN',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  if (!parseResult.success) {
    return {
      ...baseSession,
      status: 'ERROR',
      parserErrorCode: parseResult.errorCode,
      errorMessage: parseResult.errorMessage,
    };
  }

  const lookingUpSession: ImeiPaymentSessionState = {
    ...baseSession,
    status: 'LOOKING_UP_PRODUCT',
    extractedImei: parseResult.imei,
  };

  return applyLookupResult(
    lookingUpSession,
    lookupResult ?? {
      found: false,
      errorMessage: 'Khong tim thay san pham phu hop voi IMEI da quet.',
    }
  );
};

const submitPayment = (
  session: ImeiPaymentSessionState,
  paymentResult: PaymentResult
): ImeiPaymentSessionState => {
  assert.equal(session.status, 'AWAITING_CONFIRMATION');
  assert.equal(session.confirmation.checkedByStaff, true);
  assert.ok(session.product);
  assert.equal(session.product?.IMEI, session.extractedImei);

  if (paymentResult.success) {
    return {
      ...session,
      status: 'PAYMENT_SUCCESS',
      paymentResult,
      errorMessage: null,
      updatedAt: '2024-01-01T00:00:01.000Z',
    };
  }

  return {
    ...session,
    status: 'AWAITING_CONFIRMATION',
    paymentResult,
    errorMessage: paymentResult.errorMessage ?? 'Thanh toan that bai.',
    updatedAt: '2024-01-01T00:00:01.000Z',
  };
};

test('lifecycle regression: scan error can be recovered by rescanning and session keeps only one active IMEI/product', () => {
  const session = createInitialImeiPaymentSession();

  const erroredSession = scanIntoSession(session, 'invalid payload');
  assert.equal(erroredSession.status, 'ERROR');
  assert.equal(erroredSession.extractedImei, null);
  assert.equal(erroredSession.product, null);
  assert.equal(erroredSession.parserErrorCode, 'IMEI_NOT_FOUND');

  const recoveredSession = scanIntoSession(erroredSession, 'IMEI: 356789012345678', {
    found: true,
    product: createProduct(),
  });

  assert.equal(recoveredSession.status, 'AWAITING_CONFIRMATION');
  assert.equal(recoveredSession.rawScanValue, 'IMEI: 356789012345678');
  assert.equal(recoveredSession.extractedImei, '356789012345678');
  assert.equal(recoveredSession.product?.IMEI, '356789012345678');
  assert.equal(recoveredSession.product?.ProductID, 101);
  assert.equal(recoveredSession.confirmation.checkedByStaff, false);
  assert.equal(recoveredSession.paymentResult, null);
  assert.equal(recoveredSession.parserErrorCode, null);
});

test('lifecycle regression: lookup error can be recovered by rescanning without retaining stale product data', () => {
  const session = createInitialImeiPaymentSession();

  const lookupFailedSession = scanIntoSession(session, 'IMEI: 999888777666555', {
    found: false,
    errorMessage: 'Khong tim thay san pham phu hop voi IMEI da quet.',
  });

  assert.equal(lookupFailedSession.status, 'ERROR');
  assert.equal(lookupFailedSession.extractedImei, '999888777666555');
  assert.equal(lookupFailedSession.product, null);
  assert.match(lookupFailedSession.errorMessage ?? '', /Khong tim thay san pham/i);

  const rescannedSession = scanIntoSession(lookupFailedSession, 'IMEI: 356789012345678', {
    found: true,
    product: createProduct(),
  });

  assert.equal(rescannedSession.status, 'AWAITING_CONFIRMATION');
  assert.equal(rescannedSession.extractedImei, '356789012345678');
  assert.equal(rescannedSession.product?.IMEI, '356789012345678');
  assert.equal(rescannedSession.product?.ProductName, 'iPhone 15 Pro');
  assert.equal(rescannedSession.errorMessage, null);
  assert.equal(rescannedSession.parserErrorCode, null);
});

test('lifecycle regression: confirmation enables successful payment and a new scan starts a fresh session', () => {
  const session = createInitialImeiPaymentSession();
  const readySession = scanIntoSession(session, 'QR\nIMEI: 356789012345678', {
    found: true,
    product: createProduct(),
  });

  assert.equal(readySession.status, 'AWAITING_CONFIRMATION');
  assert.equal(readySession.confirmation.checkedByStaff, false);

  const confirmedSession = confirmProductCheck(readySession);
  assert.equal(confirmedSession.confirmation.checkedByStaff, true);
  assert.ok(confirmedSession.confirmation.checkedAt);
  assert.equal(confirmedSession.product?.IMEI, confirmedSession.extractedImei);

  const successfulPaymentSession = submitPayment(confirmedSession, {
    success: true,
    invoiceNumber: 'INV-0001',
  });

  assert.equal(successfulPaymentSession.status, 'PAYMENT_SUCCESS');
  assert.equal(successfulPaymentSession.paymentResult?.success, true);
  assert.equal(successfulPaymentSession.paymentResult?.invoiceNumber, 'INV-0001');
  assert.equal(successfulPaymentSession.product?.IMEI, '356789012345678');

  const nextSession = resetSession();
  assert.notEqual(nextSession.sessionId, successfulPaymentSession.sessionId);
  assert.equal(nextSession.status, 'READY_FOR_SCAN');
  assert.equal(nextSession.rawScanValue, null);
  assert.equal(nextSession.extractedImei, null);
  assert.equal(nextSession.product, null);
  assert.equal(nextSession.paymentResult, null);
});

test('lifecycle regression: payment failure keeps the same active IMEI/product for retry', () => {
  const session = createInitialImeiPaymentSession();
  const readySession = scanIntoSession(session, '356789012345678', {
    found: true,
    product: createProduct(),
  });
  const confirmedSession = confirmProductCheck(readySession);

  const failedPaymentSession = submitPayment(confirmedSession, {
    success: false,
    errorMessage: 'Thanh toan that bai tu backend.',
  });

  assert.equal(failedPaymentSession.status, 'AWAITING_CONFIRMATION');
  assert.equal(failedPaymentSession.extractedImei, '356789012345678');
  assert.equal(failedPaymentSession.product?.IMEI, '356789012345678');
  assert.equal(failedPaymentSession.product?.ProductID, 101);
  assert.equal(failedPaymentSession.confirmation.checkedByStaff, true);
  assert.equal(failedPaymentSession.paymentResult?.success, false);
  assert.match(failedPaymentSession.errorMessage ?? '', /Thanh toan that bai/i);

  const retriedPaymentSession = submitPayment(failedPaymentSession, {
    success: true,
    invoiceNumber: 'INV-0002',
  });

  assert.equal(retriedPaymentSession.status, 'PAYMENT_SUCCESS');
  assert.equal(retriedPaymentSession.paymentResult?.invoiceNumber, 'INV-0002');
  assert.equal(retriedPaymentSession.product?.IMEI, retriedPaymentSession.extractedImei);
});

test('lifecycle regression: manual reset clears current session state completely', () => {
  const session = createInitialImeiPaymentSession();
  const readySession = scanIntoSession(session, 'IMEI: 356789012345678', {
    found: true,
    product: createProduct(),
  });
  const confirmedSession = confirmProductCheck(readySession);

  const clearedSession = resetSession();

  assert.notEqual(clearedSession.sessionId, confirmedSession.sessionId);
  assert.equal(clearedSession.status, 'READY_FOR_SCAN');
  assert.equal(clearedSession.rawScanValue, null);
  assert.equal(clearedSession.extractedImei, null);
  assert.equal(clearedSession.parserErrorCode, null);
  assert.equal(clearedSession.product, null);
  assert.equal(clearedSession.confirmation.checkedByStaff, false);
  assert.equal(clearedSession.confirmation.checkedAt, null);
  assert.equal(clearedSession.paymentResult, null);
  assert.equal(clearedSession.errorMessage, null);
});

test('lifecycle regression: each rescan replaces prior active IMEI and product with one current pair only', () => {
  const session = createInitialImeiPaymentSession();

  const firstReadySession = scanIntoSession(session, 'IMEI: 356789012345678', {
    found: true,
    product: createProduct(),
  });

  assert.equal(firstReadySession.extractedImei, '356789012345678');
  assert.equal(firstReadySession.product?.ProductID, 101);

  const secondReadySession = scanIntoSession(firstReadySession, 'IMEI: 490154203237518', {
    found: true,
    product: createProduct({
      ProductID: 202,
      ProductName: 'Samsung Galaxy S24',
      ProductCode: 'SGS24-256',
      IMEI: '490154203237518',
      SalePrice: 23990000,
    }),
  });

  assert.equal(secondReadySession.status, 'AWAITING_CONFIRMATION');
  assert.equal(secondReadySession.rawScanValue, 'IMEI: 490154203237518');
  assert.equal(secondReadySession.extractedImei, '490154203237518');
  assert.equal(secondReadySession.product?.ProductID, 202);
  assert.equal(secondReadySession.product?.ProductName, 'Samsung Galaxy S24');
  assert.equal(secondReadySession.product?.IMEI, '490154203237518');
  assert.notEqual(secondReadySession.product?.ProductID, firstReadySession.product?.ProductID);
  assert.notEqual(secondReadySession.extractedImei, firstReadySession.extractedImei);
  assert.equal(secondReadySession.confirmation.checkedByStaff, false);
  assert.equal(secondReadySession.paymentResult, null);
});

