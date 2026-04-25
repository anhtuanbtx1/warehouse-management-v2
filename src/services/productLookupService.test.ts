import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ProductLookupService,
  normalizeProductLookupRecord,
  pickExactImeiMatch,
  type ProductLookupFetcher,
} from '@/services/productLookupService';

test('normalizes product lookup records with sale-ready status and optional fields', () => {
  const record = normalizeProductLookupRecord({
    ProductID: 101,
    ProductName: 'iPhone 14 Pro Max',
    ProductCode: null,
    IMEI: ' 3567 8901 2345 678 ',
    Status: 'IN_STOCK',
    SalePrice: 25990000,
  });

  assert.deepEqual(record, {
    ProductID: 101,
    ProductName: 'iPhone 14 Pro Max',
    ProductCode: undefined,
    IMEI: '356789012345678',
    Status: 'IN_STOCK',
    IsSaleReady: true,
    SalePrice: 25990000,
  });
});

test('selects the exact IMEI match from products-v2 search results', () => {
  const match = pickExactImeiMatch(
    [
      {
        ProductID: 1,
        ProductName: 'Mismatch',
        IMEI: '490154203237518',
        Status: 'IN_STOCK',
      },
      {
        ProductID: 2,
        ProductName: 'Matched Product',
        ProductCode: 'IP14PM-256',
        IMEI: '3567 8901 2345 678',
        Status: 'SOLD',
        SalePrice: 18990000,
      },
    ],
    '356789012345678'
  );

  assert.equal(match?.ProductID, 2);
});

test('returns a normalized lookup result when the current product flow returns an exact IMEI match', async () => {
  const fetcher: ProductLookupFetcher = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      data: {
        data: [
          {
            ProductID: 7,
            ProductName: 'Samsung S24 Ultra',
            ProductCode: 'SS24U-512',
            IMEI: '356789012345678',
            Status: 'IN_STOCK',
            SalePrice: 29990000,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    }),
  });

  const service = new ProductLookupService(fetcher);
  const result = await service.lookupProductByImei('3567 8901 2345 678');

  assert.deepEqual(result, {
    found: true,
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
});

test('returns not found when products-v2 search does not include an exact IMEI match', async () => {
  const fetcher: ProductLookupFetcher = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      data: {
        data: [
          {
            ProductID: 8,
            ProductName: 'Nearby Match',
            IMEI: '356789012345679',
            Status: 'IN_STOCK',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    }),
  });

  const service = new ProductLookupService(fetcher);
  const result = await service.lookupProductByImei('356789012345678');

  assert.deepEqual(result, {
    found: false,
    errorMessage: 'Khong tim thay san pham phu hop voi IMEI da quet.',
  });
});
