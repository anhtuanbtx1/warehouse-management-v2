import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createImeiPaymentRequest,
  PaymentSubmissionAdapter,
  resolveImeiPaymentSalePrice,
  type PaymentSubmissionFetcher,
} from '@/services/paymentSubmissionAdapter';
import {
  createInitialImeiPaymentSession,
  type ImeiPaymentSessionState,
} from '@/types/qr-imei-payment';

const createConfirmedSession = (): ImeiPaymentSessionState => ({
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
  confirmation: {
    checkedByStaff: true,
    checkedAt: '2025-01-01T00:00:00.000Z',
  },
});

test('prefers explicit sale price and otherwise falls back to the looked-up product sale price', () => {
  const session = createConfirmedSession();

  assert.equal(resolveImeiPaymentSalePrice({ session, salePrice: 31500000 }), 31500000);
  assert.equal(resolveImeiPaymentSalePrice({ session }), 29990000);
});

test('maps a confirmed IMEI session to the existing sales payload with IMEI traceability', () => {
  const payload = createImeiPaymentRequest({
    session: createConfirmedSession(),
    paymentMethod: 'TRANSFER',
  });

  assert.deepEqual(payload, {
    ProductID: 7,
    SalePrice: 29990000,
    PaymentMethod: 'TRANSFER',
    IncludeCable: false,
    CableBatchId: undefined,
    CablePrice: undefined,
    ScannedIMEI: '356789012345678',
  });
});

test('rejects payload creation when the session product does not match the scanned IMEI', () => {
  const session = createConfirmedSession();
  session.product = {
    ...session.product!,
    IMEI: '490154203237518',
  };

  assert.throws(
    () => createImeiPaymentRequest({ session }),
    /khop voi IMEI da quet/i
  );
});

test('submits the mapped payload to the existing sales endpoint', async () => {
  let receivedInput = '';
  let receivedInit: RequestInit | undefined;

  const fetcher: PaymentSubmissionFetcher = async (input, init) => {
    receivedInput = input;
    receivedInit = init;

    return {
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        data: {
          InvoiceNumber: 'HD2025000001',
        },
      }),
    };
  };

  const adapter = new PaymentSubmissionAdapter(fetcher);
  const result = await adapter.submitPayment({
    session: createConfirmedSession(),
    paymentMethod: 'CARD',
  });

  assert.equal(receivedInput, '/api/sales');
  assert.equal(receivedInit?.method, 'POST');
  assert.deepEqual(receivedInit?.headers, {
    'Content-Type': 'application/json',
  });
  assert.deepEqual(JSON.parse(String(receivedInit?.body)), {
    ProductID: 7,
    SalePrice: 29990000,
    PaymentMethod: 'CARD',
    IncludeCable: false,
    ScannedIMEI: '356789012345678',
  });
  assert.deepEqual(result, {
    success: true,
    invoiceNumber: 'HD2025000001',
  });
});

test('returns a validation error result instead of submitting when the session is not confirmed', async () => {
  const session = createConfirmedSession();
  session.confirmation = {
    checkedByStaff: false,
    checkedAt: null,
  };

  const fetcher: PaymentSubmissionFetcher = async () => {
    throw new Error('fetch should not be called');
  };

  const adapter = new PaymentSubmissionAdapter(fetcher);
  const result = await adapter.submitPayment({ session });

  assert.equal(result.success, false);
  assert.match(result.errorMessage ?? '', /chua du dieu kien submit/i);
});
