import {
  canStartPayment,
  type ImeiPaymentSessionState,
  type PaymentResult,
} from '@/types/qr-imei-payment';
import type { ApiResponse } from '@/types/warehouse';

export interface ImeiPaymentRequest {
  ProductID: number;
  SalePrice: number;
  PaymentMethod: string;
  IncludeCable?: boolean;
  CableBatchId?: number;
  CablePrice?: number;
  ScannedIMEI?: string;
}

export interface SubmitImeiPaymentInput {
  session: ImeiPaymentSessionState;
  salePrice?: number;
  paymentMethod?: string;
  includeCable?: boolean;
  cableBatchId?: number;
  cablePrice?: number;
}

interface SalesApiSuccessPayload {
  InvoiceNumber?: string;
}

interface SalesApiResponse extends ApiResponse<SalesApiSuccessPayload> {
  error?: string;
}

interface PaymentSubmissionResponse {
  ok: boolean;
  status: number;
  json(): Promise<SalesApiResponse>;
}

export type PaymentSubmissionFetcher = (
  input: string,
  init?: RequestInit
) => Promise<PaymentSubmissionResponse>;

const SALES_ENDPOINT = '/api/sales';
const DEFAULT_PAYMENT_METHOD = 'CASH';

export const resolveImeiPaymentSalePrice = (
  input: SubmitImeiPaymentInput
): number | null => {
  const explicitSalePrice = input.salePrice;

  if (typeof explicitSalePrice === 'number' && explicitSalePrice > 0) {
    return explicitSalePrice;
  }

  const sessionSalePrice = input.session.product?.SalePrice;
  if (typeof sessionSalePrice === 'number' && sessionSalePrice > 0) {
    return sessionSalePrice;
  }

  return null;
};

export const createImeiPaymentRequest = (
  input: SubmitImeiPaymentInput
): ImeiPaymentRequest => {
  const { session } = input;

  if (!canStartPayment(session)) {
    throw new Error(
      'Phien thanh toan IMEI chua du dieu kien submit. Nhan vien phai xac nhan dung san pham khop voi IMEI da quet.'
    );
  }

  if (!session.product) {
    throw new Error('Khong tim thay san pham trong phien thanh toan hien tai.');
  }

  if (session.product.IMEI !== session.extractedImei) {
    throw new Error('San pham hien tai khong khop voi IMEI da quet trong phien.');
  }

  const salePrice = resolveImeiPaymentSalePrice(input);
  if (salePrice === null) {
    throw new Error('Khong co gia ban hop le de tao payload thanh toan IMEI.');
  }

  return {
    ProductID: session.product.ProductID,
    SalePrice: salePrice,
    PaymentMethod: input.paymentMethod ?? DEFAULT_PAYMENT_METHOD,
    IncludeCable: input.includeCable ?? false,
    CableBatchId: input.cableBatchId,
    CablePrice: input.cablePrice,
    // Keep scanned IMEI attached to the adapted payload for traceability.
    ScannedIMEI: session.extractedImei,
  };
};

export class PaymentSubmissionAdapter {
  constructor(private readonly fetcher: PaymentSubmissionFetcher = fetch as PaymentSubmissionFetcher) {}

  createRequest(input: SubmitImeiPaymentInput): ImeiPaymentRequest {
    return createImeiPaymentRequest(input);
  }

  async submitPayment(input: SubmitImeiPaymentInput): Promise<PaymentResult> {
    let payload: ImeiPaymentRequest;

    try {
      payload = this.createRequest(input);
    } catch (error) {
      return {
        success: false,
        errorMessage:
          error instanceof Error ? error.message : 'Khong the tao payload thanh toan IMEI.',
      };
    }

    try {
      const response = await this.fetcher(SALES_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          errorMessage: result.error || `Thanh toan that bai (${response.status}).`,
        };
      }

      return {
        success: true,
        invoiceNumber: result.data?.InvoiceNumber,
      };
    } catch (error) {
      console.error('Error submitting IMEI payment:', error);

      return {
        success: false,
        errorMessage: 'Co loi xay ra khi gui giao dich thanh toan IMEI.',
      };
    }
  }
}

export const submitImeiPayment = async (
  input: SubmitImeiPaymentInput,
  fetcher?: PaymentSubmissionFetcher
): Promise<PaymentResult> => {
  const adapter = new PaymentSubmissionAdapter(fetcher);
  return adapter.submitPayment(input);
};
