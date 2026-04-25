export type PaymentSessionStatus =
  | 'READY_FOR_SCAN'
  | 'LOOKING_UP_PRODUCT'
  | 'ERROR'
  | 'AWAITING_CONFIRMATION'
  | 'PAYING'
  | 'PAYMENT_SUCCESS';

export interface ProductLookupRecord {
  ProductID: number;
  ProductName: string;
  ProductCode?: string;
  IMEI: string;
  Status: string;
  IsSaleReady: boolean;
  SalePrice?: number;
}

export interface PaymentResult {
  success: boolean;
  invoiceNumber?: string;
  errorMessage?: string;
}

export interface ImeiPaymentStatusNotice {
  variant: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  detail: string;
}

export type ExtractImeiErrorCode =
  | 'EMPTY_SCAN'
  | 'IMEI_NOT_FOUND'
  | 'MULTIPLE_IMEI_FOUND'
  | 'INVALID_FORMAT';

export interface SessionConfirmationState {
  checkedByStaff: boolean;
  checkedAt: string | null;
}

export interface ImeiPaymentSessionState {
  sessionId: string;
  status: PaymentSessionStatus;
  rawScanValue: string | null;
  extractedImei: string | null;
  parserErrorCode: ExtractImeiErrorCode | null;
  product: ProductLookupRecord | null;
  confirmation: SessionConfirmationState;
  paymentResult: PaymentResult | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export const canConfirmProductCheck = (session: ImeiPaymentSessionState): boolean => {
  if (session.status !== 'AWAITING_CONFIRMATION') {
    return false;
  }

  if (!session.extractedImei || !session.product) {
    return false;
  }

  return session.product.IsSaleReady && session.product.IMEI === session.extractedImei;
};

export const canStartPayment = (session: ImeiPaymentSessionState): boolean =>
  canConfirmProductCheck(session) && session.confirmation.checkedByStaff;

export const canSafelyCloseImeiPaymentSession = (
  session: ImeiPaymentSessionState
): boolean => session.status !== 'PAYING';

export const getImeiPaymentStatusNotice = (
  session: ImeiPaymentSessionState
): ImeiPaymentStatusNotice => {
  if (session.status === 'PAYMENT_SUCCESS') {
    return {
      variant: 'success',
      title: 'Thanh toan da hoan tat',
      detail: session.paymentResult?.invoiceNumber
        ? `Da tao giao dich ${session.paymentResult.invoiceNumber}. Ban co the dong submenu hoac tao phien quet moi ngay bay gio.`
        : 'Giao dich da duoc tao thanh cong. Ban co the dong submenu hoac tao phien quet moi ngay bay gio.',
    };
  }

  if (session.status === 'PAYING') {
    return {
      variant: 'info',
      title: 'Dang tao giao dich thanh toan',
      detail: 'Vui long doi den khi he thong tra ket qua. Submenu tam thoi khoa thao tac dong de tranh bo sot trang thai giao dich.',
    };
  }

  if (session.paymentResult && !session.paymentResult.success) {
    return {
      variant: 'warning',
      title: 'Thanh toan chua hoan tat',
      detail:
        'Thong tin IMEI va san pham van duoc giu lai. Neu thong tin van dung, hay thu lai thanh toan; neu nghi ngo payload quet khong con phu hop, hay quet lai de mo phien moi.',
    };
  }

  if (session.status === 'ERROR') {
    if (session.product && !session.product.IsSaleReady) {
      return {
        variant: 'warning',
        title: 'San pham chua san sang ban',
        detail:
          'Khong nen thu lai thanh toan voi thiet bi nay trong phien hien tai. Hay quay lai kiem tra trang thai hang hoa hoac quet thiet bi khac.',
      };
    }

    if (session.parserErrorCode || !session.product) {
      return {
        variant: 'warning',
        title: 'Can quet lai du lieu',
        detail:
          'Phien hien tai khong giu duoc mot ban ghi hop le de thanh toan. Hay quet lai ma QR de tra cuu lai san pham dung voi IMEI vua nhan.',
      };
    }

    return {
      variant: 'danger',
      title: 'Khong the tiep tuc voi phien hien tai',
      detail:
        'He thong dang giu thong bao loi. Ban co the xoa thao tac hien tai de bat dau lai, hoac tao phien moi neu can doi sang mot lan quet khac.',
    };
  }

  if (canStartPayment(session)) {
    return {
      variant: 'info',
      title: 'San sang thanh toan',
      detail: 'Thong tin san pham da duoc xac nhan. Ban co the gui giao dich ngay trong phien hien tai.',
    };
  }

  if (canConfirmProductCheck(session)) {
    return {
      variant: 'info',
      title: 'Can xac nhan truoc khi thanh toan',
      detail: 'Hay doi chieu lai ten san pham, ma san pham va IMEI truoc khi mo khoa nut thanh toan.',
    };
  }

  if (session.status === 'LOOKING_UP_PRODUCT') {
    return {
      variant: 'info',
      title: 'Dang tra cuu san pham',
      detail: 'He thong dang tim ban ghi trung khop voi IMEI vua quet trong nguon du lieu ban hang hien tai.',
    };
  }

  return {
    variant: 'info',
    title: 'San sang nhan luot quet moi',
    detail: 'Mo submenu va dua con tro vao o nhap de may quet day payload vao phien hien tai.',
  };
};

const createSessionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `imei-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const createInitialImeiPaymentSession = (): ImeiPaymentSessionState => {
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

export const resetImeiPaymentSession = (
  _session: ImeiPaymentSessionState
): ImeiPaymentSessionState => createInitialImeiPaymentSession();

export const createNewImeiPaymentSession = (): ImeiPaymentSessionState =>
  createInitialImeiPaymentSession();
