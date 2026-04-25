export type ExtractImeiErrorCode =
  | 'EMPTY_SCAN'
  | 'IMEI_NOT_FOUND'
  | 'MULTIPLE_IMEI_FOUND'
  | 'INVALID_FORMAT';

export interface ExtractImeiSuccessResult {
  success: true;
  imei: string;
  normalizedPayload: string;
  errorCode?: undefined;
  errorMessage?: undefined;
}

export interface ExtractImeiErrorResult {
  success: false;
  normalizedPayload: string;
  errorCode: ExtractImeiErrorCode;
  errorMessage: string;
  imei?: undefined;
}

export type ExtractImeiResult = ExtractImeiSuccessResult | ExtractImeiErrorResult;

const normalizeQrPayload = (rawValue: string): string => rawValue.replace(/\r\n?/g, '\n').trim();

const collectDigitCandidates = (value: string): string[] => {
  const matches = value.match(/(?<!\d)(?:\d[\s-]*){14,17}(?!\d)/g) ?? [];
  return matches.map((match) => match.replace(/\D/g, ''));
};

export const extractImeiFromQrPayload = (rawValue: string): ExtractImeiResult => {
  const normalizedPayload = normalizeQrPayload(rawValue);

  if (normalizedPayload.length === 0) {
    return {
      success: false,
      normalizedPayload,
      errorCode: 'EMPTY_SCAN',
      errorMessage: 'Chua nhan duoc du lieu quet. Hay quet lai ma QR.',
    };
  }

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
