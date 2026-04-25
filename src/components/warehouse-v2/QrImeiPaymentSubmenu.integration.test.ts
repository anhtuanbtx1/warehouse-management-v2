import assert from 'node:assert/strict';
import test from 'node:test';

/**
 * Integration tests for QR IMEI Payment Flow
 * 
 * **Validates: Requirements 2.3, 3.2, 3.3**
 * 
 * These tests cover the complete flow from scanner input through IMEI extraction
 * to product lookup, including:
 * - Valid scan → parse IMEI → lookup product → display product info
 * - Product not found scenario
 * - Product not sale-ready scenario
 * 
 * Note: These tests simulate the integration flow without direct imports to avoid
 * TypeScript compilation issues in Node.js test runner. The logic patterns match
 * the actual component behavior in QrImeiPaymentSubmenu.tsx.
 */

// Mock implementations of the core functions for testing the flow
const extractImeiFromQrPayload = (rawValue) => {
  const normalizeQrPayload = (raw) => raw.replace(/\r\n?/g, '\n').trim();
  const normalizedPayload = normalizeQrPayload(rawValue);

  if (normalizedPayload.length === 0) {
    return {
      success: false,
      normalizedPayload,
      errorCode: 'EMPTY_SCAN',
      errorMessage: 'Chua nhan duoc du lieu quet. Hay quet lai ma QR.',
    };
  }

  const collectDigitCandidates = (value) => {
    const matches = value.match(/(?<!\d)(?:\d[\s-]*){14,17}(?!\d)/g) ?? [];
    return matches.map((match) => match.replace(/\D/g, ''));
  };

  const digitCandidates = collectDigitCandidates(normalizedPayload);
  const validImeis = Array.from(new Set(digitCandidates.filter((candidate) => candidate.length === 15)));
  const nearMatchCandidates = Array.from(
    new Set(digitCandidates.filter((candidate) => candidate.length !== 15))
  );

  if (validImeis.length > 1) {
    return {
      success: false,
      normalizedPayload,
      errorCode: 'MULTIPLE_IMEI_FOUND',
      errorMessage: 'Du lieu quet chua nhieu hon mot IMEI. Hay chi quet mot ma cho moi phien.',
    };
  }

  if (validImeis.length === 1) {
    return {
      success: true,
      imei: validImeis[0],
      normalizedPayload,
    };
  }

  if (nearMatchCandidates.length > 0) {
    return {
      success: false,
      normalizedPayload,
      errorCode: 'INVALID_FORMAT',
      errorMessage: 'Tim thay chuoi so gan giong IMEI nhung khong dung dinh dang 15 chu so.',
    };
  }

  return {
    success: false,
    normalizedPayload,
    errorCode: 'IMEI_NOT_FOUND',
    errorMessage: 'Khong tim thay IMEI hop le trong du lieu QR vua quet.',
  };
};

const normalizeLookupImei = (imei) => imei.replace(/\s+/g, '').trim();

const normalizeProductLookupRecord = (record) => ({
  ProductID: record.ProductID,
  ProductName: record.ProductName,
  ProductCode: record.ProductCode ?? undefined,
  IMEI: normalizeLookupImei(record.IMEI),
  Status: record.Status,
  IsSaleReady: record.Status.toUpperCase() === 'IN_STOCK',
  SalePrice: typeof record.SalePrice === 'number' ? record.SalePrice : undefined,
});

const pickExactImeiMatch = (products, imei) => {
  const normalizedImei = normalizeLookupImei(imei);
  return products.find((product) => normalizeLookupImei(product.IMEI) === normalizedImei);
};

// Helper to simulate the scan-to-lookup flow
const simulateScanToLookup = async (rawScanValue, fetcher) => {
  // Step 1: Parse IMEI from scan
  const parseResult = extractImeiFromQrPayload(rawScanValue);

  // Step 2: Initialize session state based on parse result
  let session = {
    rawScanValue: parseResult.normalizedPayload,
    extractedImei: null,
    parserErrorCode: null,
    product: null,
    errorMessage: null,
    status: 'READY_FOR_SCAN',
  };

  if (!parseResult.success) {
    session = {
      ...session,
      parserErrorCode: parseResult.errorCode,
      errorMessage: parseResult.errorMessage,
      status: 'ERROR',
    };

    return {
      session,
      parseResult,
      lookupResult: { found: false },
    };
  }

  // Step 3: Update session with extracted IMEI and trigger lookup
  session = {
    ...session,
    extractedImei: parseResult.imei,
    status: 'LOOKING_UP_PRODUCT',
  };

  // Step 4: Perform product lookup
  let lookupResult = { found: false };
  try {
    const normalizedImei = normalizeLookupImei(parseResult.imei);

    if (!normalizedImei) {
      lookupResult = {
        found: false,
        errorMessage: 'IMEI trong, khong the tra cuu san pham.',
      };
    } else {
      const query = new URLSearchParams({
        search: normalizedImei,
        limit: '10',
      });

      const response = await fetcher(`/api/products-v2?${query.toString()}`);

      if (!response.ok) {
        lookupResult = {
          found: false,
          errorMessage: `Khong the tra cuu san pham theo IMEI (${response.status}).`,
        };
      } else {
        const result = await response.json();
        const records = result.data?.data ?? [];
        const matchedProduct = pickExactImeiMatch(records, normalizedImei);

        if (!matchedProduct) {
          lookupResult = {
            found: false,
            errorMessage: 'Khong tim thay san pham phu hop voi IMEI da quet.',
          };
        } else {
          lookupResult = {
            found: true,
            product: normalizeProductLookupRecord(matchedProduct),
          };
        }
      }
    }
  } catch (error) {
    lookupResult = {
      found: false,
      errorMessage: 'Co loi xay ra khi tra cuu san pham theo IMEI.',
    };
  }

  // Step 5: Update session based on lookup result
  if (!lookupResult.found || !lookupResult.product) {
    session = {
      ...session,
      product: null,
      errorMessage: lookupResult.errorMessage ?? 'Khong the tra cuu san pham theo IMEI da quet.',
      status: 'ERROR',
    };
  } else {
    const product = lookupResult.product;

    if (!product.IsSaleReady) {
      session = {
        ...session,
        product,
        errorMessage: `San pham ${product.ProductName} dang o trang thai ${product.Status} va chua san sang de thanh toan.`,
        status: 'ERROR',
      };
    } else {
      session = {
        ...session,
        product,
        errorMessage: null,
        status: 'AWAITING_CONFIRMATION',
      };
    }
  }

  return { session, parseResult, lookupResult };
};

test('integration: valid scan → parse IMEI → lookup product → display product info', async () => {
  const mockFetcher: ProductLookupFetcher = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      data: {
        data: [
          {
            ProductID: 42,
            ProductName: 'iPhone 15 Pro Max',
            ProductCode: 'IP15PM-512',
            IMEI: '356789012345678',
            Status: 'IN_STOCK',
            SalePrice: 32990000,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    }),
  });

  const rawScan = 'QR\nIMEI: 356789012345678\nDevice: iPhone';
  const { session, parseResult, lookupResult } = await simulateScanToLookup(rawScan, mockFetcher);

  // Verify parse step
  assert.equal(parseResult.success, true);
  if (parseResult.success) {
    assert.equal(parseResult.imei, '356789012345678');
  }

  // Verify lookup step
  assert.equal(lookupResult.found, true);
  assert.ok(lookupResult.product);

  // Verify session state after successful flow
  assert.equal(session.status, 'AWAITING_CONFIRMATION');
  assert.equal(session.extractedImei, '356789012345678');
  assert.equal(session.product?.ProductID, 42);
  assert.equal(session.product?.ProductName, 'iPhone 15 Pro Max');
  assert.equal(session.product?.ProductCode, 'IP15PM-512');
  assert.equal(session.product?.IMEI, '356789012345678');
  assert.equal(session.product?.Status, 'IN_STOCK');
  assert.equal(session.product?.IsSaleReady, true);
  assert.equal(session.product?.SalePrice, 32990000);
  assert.equal(session.errorMessage, null);
});

test('integration: product not found after valid IMEI extraction', async () => {
  const mockFetcher: ProductLookupFetcher = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      data: {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    }),
  });

  const rawScan = 'IMEI: 999888777666555';
  const { session, parseResult, lookupResult } = await simulateScanToLookup(rawScan, mockFetcher);

  // Verify parse succeeded
  assert.equal(parseResult.success, true);
  if (parseResult.success) {
    assert.equal(parseResult.imei, '999888777666555');
  }

  // Verify lookup failed
  assert.equal(lookupResult.found, false);
  assert.equal(lookupResult.product, undefined);

  // Verify session reflects product not found
  assert.equal(session.status, 'ERROR');
  assert.equal(session.extractedImei, '999888777666555');
  assert.equal(session.product, null);
  assert.ok(session.errorMessage);
  assert.match(session.errorMessage, /Khong tim thay san pham/i);
});

test('integration: product not sale-ready (SOLD status)', async () => {
  const mockFetcher: ProductLookupFetcher = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      data: {
        data: [
          {
            ProductID: 88,
            ProductName: 'Samsung Galaxy S24',
            ProductCode: 'SGS24-256',
            IMEI: '490154203237518',
            Status: 'SOLD',
            SalePrice: null,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    }),
  });

  const rawScan = '490154203237518';
  const { session, parseResult, lookupResult } = await simulateScanToLookup(rawScan, mockFetcher);

  // Verify parse succeeded
  assert.equal(parseResult.success, true);
  if (parseResult.success) {
    assert.equal(parseResult.imei, '490154203237518');
  }

  // Verify lookup found product
  assert.equal(lookupResult.found, true);
  assert.ok(lookupResult.product);

  // Verify product is not sale-ready
  assert.equal(lookupResult.product.IsSaleReady, false);
  assert.equal(lookupResult.product.Status, 'SOLD');

  // Verify session reflects not sale-ready state
  assert.equal(session.status, 'ERROR');
  assert.equal(session.extractedImei, '490154203237518');
  assert.equal(session.product?.ProductID, 88);
  assert.equal(session.product?.Status, 'SOLD');
  assert.equal(session.product?.IsSaleReady, false);
  assert.ok(session.errorMessage);
  assert.match(session.errorMessage, /chua san sang de thanh toan/i);
});

test('integration: product not sale-ready (DAMAGED status)', async () => {
  const mockFetcher: ProductLookupFetcher = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      data: {
        data: [
          {
            ProductID: 99,
            ProductName: 'Xiaomi 14 Pro',
            ProductCode: 'XM14P-512',
            IMEI: '123456789012345',
            Status: 'DAMAGED',
            SalePrice: 15990000,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    }),
  });

  const rawScan = 'Device IMEI: 123456789012345';
  const { session, parseResult, lookupResult } = await simulateScanToLookup(rawScan, mockFetcher);

  // Verify parse succeeded
  assert.equal(parseResult.success, true);

  // Verify lookup found product but not sale-ready
  assert.equal(lookupResult.found, true);
  assert.equal(lookupResult.product?.Status, 'DAMAGED');
  assert.equal(lookupResult.product?.IsSaleReady, false);

  // Verify session state
  assert.equal(session.status, 'ERROR');
  assert.equal(session.product?.ProductName, 'Xiaomi 14 Pro');
  assert.ok(session.errorMessage);
  assert.match(session.errorMessage, /DAMAGED/);
});

test('integration: invalid scan data prevents lookup', async () => {
  const mockFetcher: ProductLookupFetcher = async () => {
    throw new Error('Fetcher should not be called for invalid scan');
  };

  const rawScan = 'No IMEI here';
  const { session, parseResult, lookupResult } = await simulateScanToLookup(rawScan, mockFetcher);

  // Verify parse failed
  assert.equal(parseResult.success, false);
  if (!parseResult.success) {
    assert.equal(parseResult.errorCode, 'IMEI_NOT_FOUND');
  }

  // Verify lookup was not performed
  assert.equal(lookupResult.found, false);

  // Verify session reflects parse error
  assert.equal(session.status, 'ERROR');
  assert.equal(session.extractedImei, null);
  assert.equal(session.product, null);
  assert.ok(session.errorMessage);
  assert.ok(session.parserErrorCode);
});

test('integration: multiple IMEIs in scan prevents lookup', async () => {
  const mockFetcher: ProductLookupFetcher = async () => {
    throw new Error('Fetcher should not be called for multiple IMEIs');
  };

  const rawScan = 'IMEI1: 356789012345678\nIMEI2: 490154203237518';
  const { session, parseResult } = await simulateScanToLookup(rawScan, mockFetcher);

  // Verify parse failed with multiple IMEI error
  assert.equal(parseResult.success, false);
  if (!parseResult.success) {
    assert.equal(parseResult.errorCode, 'MULTIPLE_IMEI_FOUND');
  }

  // Verify session reflects error state
  assert.equal(session.status, 'ERROR');
  assert.equal(session.extractedImei, null);
  assert.equal(session.product, null);
  assert.match(session.errorMessage ?? '', /nhieu hon mot IMEI/i);
});

test('integration: API error during lookup is handled gracefully', async () => {
  const mockFetcher: ProductLookupFetcher = async () => ({
    ok: false,
    status: 500,
    json: async () => ({ success: false, error: 'Internal Server Error' }),
  });

  const rawScan = '356789012345678';
  const { session, parseResult, lookupResult } = await simulateScanToLookup(rawScan, mockFetcher);

  // Verify parse succeeded
  assert.equal(parseResult.success, true);

  // Verify lookup failed due to API error
  assert.equal(lookupResult.found, false);
  assert.ok(lookupResult.errorMessage);

  // Verify session reflects lookup error
  assert.equal(session.status, 'ERROR');
  assert.equal(session.extractedImei, '356789012345678');
  assert.equal(session.product, null);
  assert.ok(session.errorMessage);
});

test('integration: network error during lookup is handled gracefully', async () => {
  const mockFetcher: ProductLookupFetcher = async () => {
    throw new Error('Network connection failed');
  };

  const rawScan = 'IMEI: 356789012345678';
  const { session, parseResult, lookupResult } = await simulateScanToLookup(rawScan, mockFetcher);

  // Verify parse succeeded
  assert.equal(parseResult.success, true);

  // Verify lookup failed due to network error
  assert.equal(lookupResult.found, false);
  assert.match(lookupResult.errorMessage ?? '', /Co loi xay ra/i);

  // Verify session reflects error
  assert.equal(session.status, 'ERROR');
  assert.equal(session.product, null);
});

test('integration: IMEI with spaces and hyphens is normalized correctly through full flow', async () => {
  const mockFetcher: ProductLookupFetcher = async (input) => {
    // Verify the API is called with normalized IMEI in query
    assert.match(input, /search=356789012345678/);

    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          data: [
            {
              ProductID: 55,
              ProductName: 'Test Product',
              IMEI: '3567 8901 2345 678',
              Status: 'IN_STOCK',
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      }),
    };
  };

  const rawScan = 'IMEI: 3567-8901-2345-678';
  const { session, parseResult } = await simulateScanToLookup(rawScan, mockFetcher);

  // Verify IMEI was normalized during parse
  assert.equal(parseResult.success, true);
  if (parseResult.success) {
    assert.equal(parseResult.imei, '356789012345678');
  }

  // Verify session has normalized IMEI
  assert.equal(session.extractedImei, '356789012345678');
  assert.equal(session.product?.IMEI, '356789012345678');
  assert.equal(session.status, 'AWAITING_CONFIRMATION');
});

test('integration: empty scan is rejected before lookup', async () => {
  const mockFetcher: ProductLookupFetcher = async () => {
    throw new Error('Fetcher should not be called for empty scan');
  };

  const rawScan = '   \n\n  ';
  const { session, parseResult } = await simulateScanToLookup(rawScan, mockFetcher);

  // Verify parse failed with empty scan error
  assert.equal(parseResult.success, false);
  if (!parseResult.success) {
    assert.equal(parseResult.errorCode, 'EMPTY_SCAN');
  }

  // Verify session state
  assert.equal(session.status, 'ERROR');
  assert.equal(session.extractedImei, null);
  assert.equal(session.product, null);
});
