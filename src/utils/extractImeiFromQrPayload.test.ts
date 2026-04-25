import assert from 'node:assert/strict';
import test from 'node:test';
import { extractImeiFromQrPayload } from '@/utils/extractImeiFromQrPayload';

test('extracts a single normalized IMEI from mixed QR payload text', () => {
  const result = extractImeiFromQrPayload('  QR\r\nIMEI: 3567 8901 2345 678\r\n  ');

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.imei, '356789012345678');
    assert.equal(result.normalizedPayload, 'QR\nIMEI: 3567 8901 2345 678');
  }
});

test('returns EMPTY_SCAN for blank payload', () => {
  const result = extractImeiFromQrPayload('   \r\n  ');

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errorCode, 'EMPTY_SCAN');
  }
});

test('returns IMEI_NOT_FOUND when payload has no IMEI candidate', () => {
  const result = extractImeiFromQrPayload('serial=ABC123; model=test');

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errorCode, 'IMEI_NOT_FOUND');
  }
});

test('returns MULTIPLE_IMEI_FOUND when payload contains more than one IMEI', () => {
  const result = extractImeiFromQrPayload('356789012345678 / 490154203237518');

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errorCode, 'MULTIPLE_IMEI_FOUND');
  }
});

test('returns INVALID_FORMAT when payload has near-match numeric candidate only', () => {
  const result = extractImeiFromQrPayload('IMEI=35678901234567');

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errorCode, 'INVALID_FORMAT');
  }
});

test('extracts IMEI with various spacing and formatting patterns', () => {
  const result = extractImeiFromQrPayload('356789012345678');

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.imei, '356789012345678');
  }
});

test('extracts IMEI with hyphens and spaces mixed', () => {
  const result = extractImeiFromQrPayload('3567-8901-2345-678');

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.imei, '356789012345678');
  }
});

test('normalizes multiple line breaks and carriage returns', () => {
  const result = extractImeiFromQrPayload('QR\r\n\r\nIMEI: 356789012345678\r\n\r\nEnd');

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.imei, '356789012345678');
    assert.match(result.normalizedPayload, /QR\n\nIMEI: 356789012345678\n\nEnd/);
  }
});

test('handles IMEI with leading zeros correctly', () => {
  const result = extractImeiFromQrPayload('012345678901234');

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.imei, '012345678901234');
  }
});

test('rejects IMEI with 14 digits (too short)', () => {
  const result = extractImeiFromQrPayload('35678901234567');

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errorCode, 'INVALID_FORMAT');
  }
});

test('rejects IMEI with 16 digits (too long)', () => {
  const result = extractImeiFromQrPayload('3567890123456789');

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errorCode, 'INVALID_FORMAT');
  }
});

test('deduplicates identical IMEI candidates appearing multiple times', () => {
  const result = extractImeiFromQrPayload('356789012345678 and 356789012345678');

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.imei, '356789012345678');
  }
});

test('rejects when multiple distinct IMEIs are present', () => {
  const result = extractImeiFromQrPayload('IMEI1: 356789012345678, IMEI2: 490154203237518');

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errorCode, 'MULTIPLE_IMEI_FOUND');
  }
});

test('handles payload with IMEI surrounded by non-digit characters', () => {
  const result = extractImeiFromQrPayload('Device IMEI: 356789012345678 (Active)');

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.imei, '356789012345678');
  }
});

test('preserves normalized payload in error result', () => {
  const result = extractImeiFromQrPayload('  \r\nNo IMEI here\r\n  ');

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.normalizedPayload, 'No IMEI here');
  }
});

test('returns meaningful error message for empty scan', () => {
  const result = extractImeiFromQrPayload('');

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.errorMessage, /Chua nhan duoc du lieu quet/i);
  }
});

test('returns meaningful error message for multiple IMEIs', () => {
  const result = extractImeiFromQrPayload('356789012345678 490154203237518');

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.errorMessage, /nhieu hon mot IMEI/i);
  }
});

test('returns meaningful error message for invalid format', () => {
  const result = extractImeiFromQrPayload('IMEI=35678901234567');

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.errorMessage, /khong dung dinh dang/i);
  }
});

test('returns meaningful error message for IMEI not found', () => {
  const result = extractImeiFromQrPayload('serial=ABC123');

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.errorMessage, /Khong tim thay IMEI/i);
  }
});
