import type { BankAccount } from '../types/api';

function createFallbackId(index: number) {
  return `bank-account-${index + 1}`;
}

export function normalizeBankAccount(input: Partial<BankAccount>, index = 0): BankAccount {
  return {
    id: String(input.id ?? createFallbackId(index)),
    bankName: String(input.bankName ?? '').trim(),
    branchName: String(input.branchName ?? '').trim(),
    accountHolder: String(input.accountHolder ?? '').trim(),
    iban: String(input.iban ?? '')
      .replace(/\s+/g, '')
      .toUpperCase(),
    accountNumber: String(input.accountNumber ?? '').trim(),
    currency: String(input.currency ?? 'TRY').trim().toUpperCase() || 'TRY',
    note: String(input.note ?? '').trim(),
    isActive: input.isActive !== false,
  };
}

export function isBankAccountComplete(input: Partial<BankAccount>) {
  return (
    String(input.bankName ?? '').trim().length > 0 &&
    String(input.accountHolder ?? '').trim().length > 0 &&
    String(input.iban ?? '')
      .replace(/\s+/g, '')
      .toUpperCase().length > 0
  );
}

function parseBankAccountsInternal(
  rawValue?: string | null,
  options?: { includeIncomplete?: boolean },
) {
  if (!rawValue?.trim()) {
    return [] as BankAccount[];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) {
      return [] as BankAccount[];
    }

    return parsed
      .map((item, index) =>
        item && typeof item === 'object'
          ? normalizeBankAccount(item as Partial<BankAccount>, index)
          : null,
      )
      .filter(
        (item): item is BankAccount =>
          item !== null &&
          (options?.includeIncomplete ? true : isBankAccountComplete(item)),
      );
  } catch {
    return [] as BankAccount[];
  }
}

export function parseBankAccounts(rawValue?: string | null) {
  return parseBankAccountsInternal(rawValue);
}

export function parseEditableBankAccounts(rawValue?: string | null) {
  return parseBankAccountsInternal(rawValue, { includeIncomplete: true });
}

export function stringifyBankAccounts(accounts: BankAccount[]) {
  return JSON.stringify(
    accounts.map((account, index) => normalizeBankAccount(account, index)),
  );
}

export function getActiveBankAccounts(accounts: BankAccount[]) {
  return accounts.filter((account) => account.isActive);
}

export function formatIban(value: string) {
  const compact = value.replace(/\s+/g, '').toUpperCase();
  return compact.replace(/(.{4})/g, '$1 ').trim();
}
