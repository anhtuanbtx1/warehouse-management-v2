import type { ProductLookupRecord } from '@/types/qr-imei-payment';
import type { ApiResponse, PaginatedResponse } from '@/types/warehouse';

interface ProductLookupApiRecord {
  ProductID: number;
  ProductName: string;
  ProductCode?: string | null;
  IMEI: string;
  Status: string;
  SalePrice?: number | null;
}

interface ProductLookupFetchResponse {
  ok: boolean;
  status: number;
  json(): Promise<ApiResponse<PaginatedResponse<ProductLookupApiRecord>>>;
}

export interface LookupProductByImeiResponse {
  found: boolean;
  product?: ProductLookupRecord;
  errorMessage?: string;
}

export type ProductLookupFetcher = (
  input: string,
  init?: RequestInit
) => Promise<ProductLookupFetchResponse>;

const PRODUCT_LOOKUP_ENDPOINT = '/api/products-v2';

export const normalizeLookupImei = (imei: string): string => imei.replace(/\s+/g, '').trim();

export const normalizeProductLookupRecord = (
  record: ProductLookupApiRecord
): ProductLookupRecord => ({
  ProductID: record.ProductID,
  ProductName: record.ProductName,
  ProductCode: record.ProductCode ?? undefined,
  IMEI: normalizeLookupImei(record.IMEI),
  Status: record.Status,
  IsSaleReady: record.Status.toUpperCase() === 'IN_STOCK',
  SalePrice: typeof record.SalePrice === 'number' ? record.SalePrice : undefined,
});

export const pickExactImeiMatch = (
  products: ProductLookupApiRecord[],
  imei: string
): ProductLookupApiRecord | undefined => {
  const normalizedImei = normalizeLookupImei(imei);

  return products.find((product) => normalizeLookupImei(product.IMEI) === normalizedImei);
};

export class ProductLookupService {
  constructor(private readonly fetcher: ProductLookupFetcher = fetch as ProductLookupFetcher) {}

  async lookupProductByImei(imei: string): Promise<LookupProductByImeiResponse> {
    const normalizedImei = normalizeLookupImei(imei);

    if (!normalizedImei) {
      return {
        found: false,
        errorMessage: 'IMEI trong, khong the tra cuu san pham.',
      };
    }

    const query = new URLSearchParams({
      search: normalizedImei,
      limit: '10',
    });

    try {
      const response = await this.fetcher(`${PRODUCT_LOOKUP_ENDPOINT}?${query.toString()}`);

      if (!response.ok) {
        return {
          found: false,
          errorMessage: `Khong the tra cuu san pham theo IMEI (${response.status}).`,
        };
      }

      const result = await response.json();
      const records = result.data?.data ?? [];
      const matchedProduct = pickExactImeiMatch(records, normalizedImei);

      if (!matchedProduct) {
        return {
          found: false,
          errorMessage: 'Khong tim thay san pham phu hop voi IMEI da quet.',
        };
      }

      return {
        found: true,
        product: normalizeProductLookupRecord(matchedProduct),
      };
    } catch (error) {
      console.error('Error looking up product by IMEI:', error);

      return {
        found: false,
        errorMessage: 'Co loi xay ra khi tra cuu san pham theo IMEI.',
      };
    }
  }
}

export const lookupProductByImei = async (
  imei: string,
  fetcher?: ProductLookupFetcher
): Promise<LookupProductByImeiResponse> => {
  const service = new ProductLookupService(fetcher);
  return service.lookupProductByImei(imei);
};
