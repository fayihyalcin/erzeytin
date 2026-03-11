import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface CustomerAddress {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  postalCode: string;
  line1: string;
  line2: string;
}

export interface CustomerPaymentCard {
  id: string;
  label: string;
  holderName: string;
  maskedNumber: string;
  provider: string;
  expiresAt: string;
  isDefault: boolean;
}

export interface CustomerPreferences {
  newsletter: boolean;
  sms: boolean;
  campaignEmail: boolean;
}

export interface CustomerSessionUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
  addresses: CustomerAddress[];
  paymentCards: CustomerPaymentCard[];
  orderNumbers: string[];
  preferences: CustomerPreferences;
}

interface CustomerAccount extends CustomerSessionUser {
  password: string;
  updatedAt: string;
}

interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

interface CustomerAddressInput {
  id?: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  postalCode: string;
  line1: string;
  line2: string;
}

interface CustomerPaymentCardInput {
  id?: string;
  label: string;
  holderName: string;
  number: string;
  provider: string;
  expiresAt: string;
  isDefault: boolean;
}

interface UpdateProfileInput {
  fullName: string;
  phone: string;
}

interface CheckoutAccountInput {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  district: string;
  postalCode: string;
  line1: string;
  line2: string;
}

interface CheckoutAccountResult {
  created: boolean;
  generatedPassword: string | null;
}

interface CustomerAuthContextValue {
  user: CustomerSessionUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  register: (input: RegisterInput) => Promise<void>;
  ensureCheckoutAccount: (input: CheckoutAccountInput) => Promise<CheckoutAccountResult>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (input: UpdateProfileInput) => void;
  upsertAddress: (input: CustomerAddressInput) => void;
  removeAddress: (addressId: string) => void;
  upsertPaymentCard: (input: CustomerPaymentCardInput) => void;
  removePaymentCard: (cardId: string) => void;
  updatePreferences: (input: CustomerPreferences) => void;
  addOrderNumber: (orderNumber: string) => void;
  linkOrderToEmail: (orderNumber: string, email: string) => void;
}

const DEFAULT_PREFERENCES: CustomerPreferences = {
  newsletter: true,
  sms: false,
  campaignEmail: true,
};

const ACCOUNTS_STORAGE_KEY = 'zeytin_customer_accounts_v1';
const SESSION_STORAGE_KEY = 'zeytin_customer_session_v1';

const CustomerAuthContext = createContext<CustomerAuthContextValue | undefined>(undefined);

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function sanitizeText(value: string) {
  return value.trim();
}

function normalizeOrderNumbers(orderNumbers: string[]) {
  const unique = new Set<string>();

  for (const value of orderNumbers) {
    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }
    unique.add(trimmed.toUpperCase());
  }

  return [...unique];
}

function toMaskedCardNumber(number: string) {
  const digits = number.replace(/\D/g, '');
  const tail = digits.slice(-4).padStart(4, '0');
  return `**** **** **** ${tail}`;
}

function normalizeAddress(input: CustomerAddressInput): CustomerAddress {
  return {
    id: input.id || createId(),
    title: sanitizeText(input.title),
    fullName: sanitizeText(input.fullName),
    phone: sanitizeText(input.phone),
    city: sanitizeText(input.city),
    district: sanitizeText(input.district),
    postalCode: sanitizeText(input.postalCode),
    line1: sanitizeText(input.line1),
    line2: sanitizeText(input.line2),
  };
}

function createCheckoutPassword(phone: string, email: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 6) {
    return digits.slice(-6);
  }

  const localPart = normalizeEmail(email)
    .split('@')[0]
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 6);

  return (localPart || '123456').padEnd(6, '0');
}

function createCheckoutAddress(input: CheckoutAccountInput): CustomerAddress | null {
  const city = sanitizeText(input.city);
  const district = sanitizeText(input.district);
  const line1 = sanitizeText(input.line1);

  if (!city || !district || !line1) {
    return null;
  }

  return normalizeAddress({
    title: 'Teslimat Adresi',
    fullName: input.fullName,
    phone: input.phone,
    city,
    district,
    postalCode: input.postalCode,
    line1,
    line2: input.line2,
  });
}

function mergeCheckoutAddress(addresses: CustomerAddress[], nextAddress: CustomerAddress | null) {
  if (!nextAddress) {
    return addresses;
  }

  const matchingIndex = addresses.findIndex(
    (address) =>
      address.line1 === nextAddress.line1 &&
      address.city === nextAddress.city &&
      address.district === nextAddress.district,
  );

  if (matchingIndex >= 0) {
    const next = [...addresses];
    next[matchingIndex] = {
      ...next[matchingIndex],
      ...nextAddress,
      id: next[matchingIndex].id,
    };
    return next;
  }

  return [nextAddress, ...addresses];
}

function normalizeCard(input: CustomerPaymentCardInput): CustomerPaymentCard {
  return {
    id: input.id || createId(),
    label: sanitizeText(input.label),
    holderName: sanitizeText(input.holderName),
    maskedNumber: toMaskedCardNumber(input.number),
    provider: sanitizeText(input.provider),
    expiresAt: sanitizeText(input.expiresAt),
    isDefault: Boolean(input.isDefault),
  };
}

function parseStoredAddress(input: unknown): CustomerAddress | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const record = input as Partial<CustomerAddress>;
  return normalizeAddress({
    id: record.id,
    title: String(record.title ?? ''),
    fullName: String(record.fullName ?? ''),
    phone: String(record.phone ?? ''),
    city: String(record.city ?? ''),
    district: String(record.district ?? ''),
    postalCode: String(record.postalCode ?? ''),
    line1: String(record.line1 ?? ''),
    line2: String(record.line2 ?? ''),
  });
}

function parseStoredCard(input: unknown): CustomerPaymentCard | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const record = input as Partial<CustomerPaymentCard>;
  const label = sanitizeText(String(record.label ?? ''));
  const holderName = sanitizeText(String(record.holderName ?? ''));
  const maskedNumber = sanitizeText(String(record.maskedNumber ?? ''));
  const provider = sanitizeText(String(record.provider ?? ''));
  const expiresAt = sanitizeText(String(record.expiresAt ?? ''));

  if (!label || !holderName || !maskedNumber) {
    return null;
  }

  return {
    id: String(record.id ?? createId()),
    label,
    holderName,
    maskedNumber,
    provider,
    expiresAt,
    isDefault: Boolean(record.isDefault),
  };
}

function toSessionUser(account: CustomerAccount): CustomerSessionUser {
  return {
    id: account.id,
    fullName: account.fullName,
    email: account.email,
    phone: account.phone,
    createdAt: account.createdAt,
    addresses: account.addresses,
    paymentCards: account.paymentCards,
    orderNumbers: account.orderNumbers,
    preferences: account.preferences,
  };
}

function parseAccountsStorage() {
  if (typeof window === 'undefined') {
    return [] as CustomerAccount[];
  }

  try {
    const raw = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      return [] as CustomerAccount[];
    }

    const parsed = JSON.parse(raw) as CustomerAccount[];
    if (!Array.isArray(parsed)) {
      return [] as CustomerAccount[];
    }

    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== 'object') {
          return null;
        }

        const email = normalizeEmail(String(entry.email ?? ''));
        const password = String(entry.password ?? '');
        const fullName = sanitizeText(String(entry.fullName ?? ''));
        if (!email || !password || !fullName) {
          return null;
        }

        return {
          id: String(entry.id ?? createId()),
          fullName,
          email,
          phone: sanitizeText(String(entry.phone ?? '')),
          password,
          createdAt: String(entry.createdAt ?? new Date().toISOString()),
          updatedAt: String(entry.updatedAt ?? new Date().toISOString()),
          addresses: Array.isArray(entry.addresses)
            ? entry.addresses
                .map((item) => parseStoredAddress(item))
                .filter((item): item is CustomerAddress => item !== null)
            : [],
          paymentCards: Array.isArray(entry.paymentCards)
            ? entry.paymentCards
                .map((item) => parseStoredCard(item))
                .filter((item): item is CustomerPaymentCard => item !== null)
            : [],
          orderNumbers: normalizeOrderNumbers(
            Array.isArray(entry.orderNumbers)
              ? entry.orderNumbers.map((item) => String(item ?? ''))
              : [],
          ),
          preferences:
            entry.preferences && typeof entry.preferences === 'object'
              ? {
                  newsletter: Boolean(entry.preferences.newsletter),
                  sms: Boolean(entry.preferences.sms),
                  campaignEmail: Boolean(entry.preferences.campaignEmail),
                }
              : { ...DEFAULT_PREFERENCES },
        } satisfies CustomerAccount;
      })
      .filter((entry): entry is CustomerAccount => entry !== null);
  } catch {
    return [] as CustomerAccount[];
  }
}

function parseSessionStorage() {
  if (typeof window === 'undefined') {
    return null as string | null;
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  const value = raw.trim();
  return value || null;
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<CustomerAccount[]>(parseAccountsStorage);
  const [sessionUserId, setSessionUserId] = useState<string | null>(parseSessionStorage);
  const [loading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!sessionUserId) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(SESSION_STORAGE_KEY, sessionUserId);
  }, [sessionUserId]);

  const user = useMemo(() => {
    if (!sessionUserId) {
      return null;
    }

    const current = accounts.find((entry) => entry.id === sessionUserId);
    if (!current) {
      return null;
    }

    return toSessionUser(current);
  }, [accounts, sessionUserId]);

  useEffect(() => {
    if (!sessionUserId) {
      return;
    }

    const exists = accounts.some((entry) => entry.id === sessionUserId);
    if (!exists) {
      setSessionUserId(null);
    }
  }, [accounts, sessionUserId]);

  const register = useCallback(async (input: RegisterInput) => {
    const fullName = sanitizeText(input.fullName);
    const email = normalizeEmail(input.email);
    const phone = sanitizeText(input.phone);
    const password = input.password;

    if (fullName.length < 2) {
      throw new Error('Ad soyad en az 2 karakter olmalıdır.');
    }
    if (!email || !email.includes('@')) {
      throw new Error('Geçerli bir e-posta adresi giriniz.');
    }
    if (password.length < 6) {
      throw new Error('Şifre en az 6 karakter olmalıdır.');
    }

    const exists = accounts.some((account) => normalizeEmail(account.email) === email);
    if (exists) {
      throw new Error('Bu e-posta ile kayıtlı bir hesap zaten var.');
    }

    const now = new Date().toISOString();
    const next: CustomerAccount = {
      id: createId(),
      fullName,
      email,
      phone,
      password,
      createdAt: now,
      updatedAt: now,
      addresses: [],
      paymentCards: [],
      orderNumbers: [],
      preferences: { ...DEFAULT_PREFERENCES },
    };

    setAccounts((current) => [...current, next]);
    setSessionUserId(next.id);
  }, [accounts]);

  const ensureCheckoutAccount = useCallback(
    async (input: CheckoutAccountInput) => {
      const fullName = sanitizeText(input.fullName);
      const email = normalizeEmail(input.email);
      const phone = sanitizeText(input.phone);
      const checkoutAddress = createCheckoutAddress({
        ...input,
        fullName,
        email,
        phone,
      });

      if (fullName.length < 2) {
        throw new Error('Ad soyad en az 2 karakter olmal\u0131d\u0131r.');
      }

      if (!email || !email.includes('@')) {
        throw new Error('Ge\u00e7erli bir e-posta adresi giriniz.');
      }

      if (phone.replace(/\D/g, '').length < 10) {
        throw new Error('Ge\u00e7erli bir telefon numaras\u0131 giriniz.');
      }

      const existingAccount = accounts.find((account) => normalizeEmail(account.email) === email);
      if (existingAccount) {
        setAccounts((current) =>
          current.map((entry) => {
            if (entry.id !== existingAccount.id) {
              return entry;
            }

            return {
              ...entry,
              fullName,
              phone,
              addresses: mergeCheckoutAddress(entry.addresses, checkoutAddress),
              updatedAt: new Date().toISOString(),
            };
          }),
        );
        setSessionUserId(existingAccount.id);

        return {
          created: false,
          generatedPassword: null,
        } satisfies CheckoutAccountResult;
      }

      const now = new Date().toISOString();
      const generatedPassword = createCheckoutPassword(phone, email);
      const next: CustomerAccount = {
        id: createId(),
        fullName,
        email,
        phone,
        password: generatedPassword,
        createdAt: now,
        updatedAt: now,
        addresses: checkoutAddress ? [checkoutAddress] : [],
        paymentCards: [],
        orderNumbers: [],
        preferences: { ...DEFAULT_PREFERENCES },
      };

      setAccounts((current) => [...current, next]);
      setSessionUserId(next.id);

      return {
        created: true,
        generatedPassword,
      } satisfies CheckoutAccountResult;
    },
    [accounts],
  );

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = password;
    const account = accounts.find((entry) => entry.email === normalizedEmail);
    if (!account || account.password !== normalizedPassword) {
      throw new Error('E-posta veya şifre hatalı.');
    }

    setSessionUserId(account.id);
  }, [accounts]);

  const logout = useCallback(() => {
    setSessionUserId(null);
  }, []);

  const withCurrentAccount = useCallback(
    (updater: (account: CustomerAccount) => CustomerAccount) => {
      if (!sessionUserId) {
        return;
      }

      setAccounts((current) =>
        current.map((entry) => {
          if (entry.id !== sessionUserId) {
            return entry;
          }

          const next = updater(entry);
          return {
            ...next,
            updatedAt: new Date().toISOString(),
          };
        }),
      );
    },
    [sessionUserId],
  );

  const updateProfile = useCallback(
    (input: UpdateProfileInput) => {
      const fullName = sanitizeText(input.fullName);
      const phone = sanitizeText(input.phone);
      if (fullName.length < 2) {
        throw new Error('Ad soyad en az 2 karakter olmalıdır.');
      }

      withCurrentAccount((current) => ({
        ...current,
        fullName,
        phone,
      }));
    },
    [withCurrentAccount],
  );

  const upsertAddress = useCallback(
    (input: CustomerAddressInput) => {
      const address = normalizeAddress(input);
      if (address.title.length < 2 || address.city.length < 2 || address.line1.length < 5) {
        throw new Error('Adres bilgileri eksik.');
      }

      withCurrentAccount((current) => {
        const existingIndex = current.addresses.findIndex((item) => item.id === address.id);
        if (existingIndex < 0) {
          return {
            ...current,
            addresses: [...current.addresses, address],
          };
        }

        const next = [...current.addresses];
        next[existingIndex] = address;
        return {
          ...current,
          addresses: next,
        };
      });
    },
    [withCurrentAccount],
  );

  const removeAddress = useCallback(
    (addressId: string) => {
      withCurrentAccount((current) => ({
        ...current,
        addresses: current.addresses.filter((item) => item.id !== addressId),
      }));
    },
    [withCurrentAccount],
  );

  const upsertPaymentCard = useCallback(
    (input: CustomerPaymentCardInput) => {
      const card = normalizeCard(input);
      if (card.label.length < 2 || card.holderName.length < 2 || card.expiresAt.length < 4) {
        throw new Error('Kart bilgileri eksik.');
      }

      withCurrentAccount((current) => {
        const existingIndex = current.paymentCards.findIndex((item) => item.id === card.id);
        const normalizedCards = card.isDefault
          ? current.paymentCards.map((item) => ({ ...item, isDefault: false }))
          : [...current.paymentCards];

        if (existingIndex < 0) {
          return {
            ...current,
            paymentCards: [...normalizedCards, card],
          };
        }

        const next = [...normalizedCards];
        next[existingIndex] = card;
        return {
          ...current,
          paymentCards: next,
        };
      });
    },
    [withCurrentAccount],
  );

  const removePaymentCard = useCallback(
    (cardId: string) => {
      withCurrentAccount((current) => ({
        ...current,
        paymentCards: current.paymentCards.filter((item) => item.id !== cardId),
      }));
    },
    [withCurrentAccount],
  );

  const updatePreferences = useCallback(
    (input: CustomerPreferences) => {
      withCurrentAccount((current) => ({
        ...current,
        preferences: {
          newsletter: Boolean(input.newsletter),
          sms: Boolean(input.sms),
          campaignEmail: Boolean(input.campaignEmail),
        },
      }));
    },
    [withCurrentAccount],
  );

  const addOrderNumber = useCallback(
    (orderNumber: string) => {
      const normalized = orderNumber.trim().toUpperCase();
      if (!normalized) {
        return;
      }

      withCurrentAccount((current) => {
        const hasOrder = current.orderNumbers.includes(normalized);
        if (hasOrder) {
          return current;
        }

        return {
          ...current,
          orderNumbers: [...current.orderNumbers, normalized],
        };
      });
    },
    [withCurrentAccount],
  );

  const linkOrderToEmail = useCallback((orderNumber: string, email: string) => {
    const normalizedOrderNumber = orderNumber.trim().toUpperCase();
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedOrderNumber || !normalizedEmail) {
      return;
    }

    setAccounts((current) =>
      current.map((entry) => {
        if (entry.email !== normalizedEmail) {
          return entry;
        }

        if (entry.orderNumbers.includes(normalizedOrderNumber)) {
          return entry;
        }

        return {
          ...entry,
          orderNumbers: [...entry.orderNumbers, normalizedOrderNumber],
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }, []);

  const value = useMemo<CustomerAuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      register,
      ensureCheckoutAccount,
      login,
      logout,
      updateProfile,
      upsertAddress,
      removeAddress,
      upsertPaymentCard,
      removePaymentCard,
      updatePreferences,
      addOrderNumber,
      linkOrderToEmail,
    }),
    [
      user,
      loading,
      register,
      ensureCheckoutAccount,
      login,
      logout,
      updateProfile,
      upsertAddress,
      removeAddress,
      upsertPaymentCard,
      removePaymentCard,
      updatePreferences,
      addOrderNumber,
      linkOrderToEmail,
    ],
  );

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth sadece CustomerAuthProvider içinde kullanılabilir.');
  }

  return context;
}
