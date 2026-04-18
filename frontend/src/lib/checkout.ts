export const PAYTR_PHONE_MESSAGE =
  'PAYTR için cep telefonu numarasını 05xx xxx xx xx veya +90 5xx xxx xx xx formatında girin.';

export function normalizeCheckoutPhone(value: string) {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  if (digits.startsWith('90') && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith('0') && digits.length === 11) {
    return digits;
  }

  if (digits.length === 10 && digits.startsWith('5')) {
    return `0${digits}`;
  }

  return digits;
}

export function isValidCheckoutPhone(value: string) {
  const normalized = normalizeCheckoutPhone(value);
  return /^05\d{9}$/.test(normalized) || /^905\d{9}$/.test(normalized);
}
