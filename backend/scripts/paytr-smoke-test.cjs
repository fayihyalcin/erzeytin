const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');

const apiBaseUrl = (process.env.PAYTR_SMOKE_BASE_URL || 'http://localhost:3000/api').replace(
  /\/+$/,
  '',
);
const storefrontOrigin = (process.env.PAYTR_SMOKE_ORIGIN || 'http://localhost:5173').replace(
  /\/+$/,
  '',
);
const adminUsername =
  process.env.PAYTR_SMOKE_ADMIN_USERNAME || process.env.ADMIN_USERNAME || 'admin';
const adminPassword =
  process.env.PAYTR_SMOKE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'admin123';

function log(step, detail) {
  process.stdout.write(`[PAYTR smoke] ${step}${detail ? `: ${detail}` : ''}\n`);
}

function parseBoolean(value) {
  if (typeof value !== 'string') {
    return false;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function toMinorUnits(value) {
  const parsed = Number(value);
  assert.ok(Number.isFinite(parsed), `Expected numeric amount, received "${value}"`);
  return String(Math.round(parsed * 100));
}

function createCallbackHash(merchantOid, merchantSalt, status, totalAmount, merchantKey) {
  return createHmac('sha256', merchantKey)
    .update(`${merchantOid}${merchantSalt}${status}${totalAmount}`)
    .digest('base64');
}

async function requestJson(path, init = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, init);
  const bodyText = await response.text();
  const data = bodyText ? JSON.parse(bodyText) : null;

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${path}: ${bodyText || response.statusText}`);
  }

  return data;
}

async function requestText(path, init = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, init);
  const bodyText = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    text: bodyText,
  };
}

function buildCheckoutPayload(product, quantity, overrides = {}) {
  return {
    customerName: overrides.customerName || 'PAYTR Smoke Test',
    customerEmail: overrides.customerEmail || 'paytr-smoke@example.com',
    customerPhone: overrides.customerPhone || '05300000000',
    shippingAddress: {
      fullName: overrides.customerName || 'PAYTR Smoke Test',
      phone: overrides.customerPhone || '05300000000',
      country: 'Turkiye',
      city: 'Bursa',
      district: 'Mudanya',
      postalCode: '16940',
      line1: 'Test Mahallesi Odeme Sokak 1',
      line2: '',
    },
    billingAddress: {
      fullName: overrides.customerName || 'PAYTR Smoke Test',
      phone: overrides.customerPhone || '05300000000',
      country: 'Turkiye',
      city: 'Bursa',
      district: 'Mudanya',
      postalCode: '16940',
      line1: 'Test Mahallesi Odeme Sokak 1',
      line2: '',
    },
    items: [
      {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity,
        unitPrice: Number(product.price),
        imageUrl: product.featuredImage || '',
      },
    ],
    shippingFee: 0,
    taxAmount: 0,
    discountAmount: 0,
    currency: 'TRY',
    paymentMethod: 'CARD',
    paymentStatus: 'PENDING',
    paymentProvider: 'PAYTR',
    shippingMethod: 'Standart Kargo',
    customerNote: overrides.customerNote || 'PAYTR smoke test order',
  };
}

async function createCheckout(product, quantity, overrides) {
  const payload = buildCheckoutPayload(product, quantity, overrides);
  return requestJson('/shop/payments/paytr/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: storefrontOrigin,
      Referer: `${storefrontOrigin}/cart`,
    },
    body: JSON.stringify(payload),
  });
}

async function fetchOrder(orderNumber) {
  return requestJson(`/shop/orders/${encodeURIComponent(orderNumber)}`);
}

async function postCallback({ merchantOid, status, totalAmount, merchantKey, merchantSalt, extra = {} }) {
  const form = new URLSearchParams({
    merchant_oid: merchantOid,
    status,
    total_amount: totalAmount,
    hash: createCallbackHash(merchantOid, merchantSalt, status, totalAmount, merchantKey),
    ...extra,
  });

  return requestText('/shop/payments/paytr/callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });
}

async function main() {
  log('start', apiBaseUrl);

  const publicSettings = await requestJson('/settings/public');
  assert.equal(parseBoolean(publicSettings.paytrEnabled), true, 'PAYTR should be enabled');
  log('public settings', 'PAYTR enabled');

  const login = await requestJson('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: adminUsername,
      password: adminPassword,
    }),
  });

  assert.ok(login.accessToken, 'Admin access token is required for smoke test');
  log('auth', `logged in as ${adminUsername}`);

  const settings = await requestJson('/settings', {
    headers: {
      Authorization: `Bearer ${login.accessToken}`,
    },
  });

  assert.ok(settings.paytrMerchantKey, 'PAYTR merchant key is missing');
  assert.ok(settings.paytrMerchantSalt, 'PAYTR merchant salt is missing');
  assert.ok(settings.paytrMerchantId, 'PAYTR merchant id is missing');
  log('settings', `merchant ${settings.paytrMerchantId} loaded`);

  const productList = await requestJson('/catalog/public/products?page=1&pageSize=10');
  const products = Array.isArray(productList) ? productList : productList.items || [];
  const product = products.find((item) => Number(item.stock) >= 3);
  assert.ok(product, 'No in-stock product found for smoke test');

  const stockBefore = Number(product.stock);
  log('product', `${product.name} stock=${stockBefore}`);

  const successCheckout = await createCheckout(product, 1, {
    customerName: 'PAYTR Success Test',
    customerEmail: 'paytr-success@example.com',
    customerPhone: '05301110000',
    customerNote: 'PAYTR smoke test success flow',
  });

  assert.ok(successCheckout.iframeToken, 'Success checkout should return iframe token');
  assert.ok(successCheckout.iframeUrl, 'Success checkout should return iframe url');
  log('checkout success flow', successCheckout.orderNumber);

  const pendingSuccessOrder = await fetchOrder(successCheckout.orderNumber);
  assert.equal(pendingSuccessOrder.paymentStatus, 'PENDING');
  assert.equal(pendingSuccessOrder.status, 'NEW');

  const invalidHashResult = await requestText('/shop/payments/paytr/callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      merchant_oid: successCheckout.merchantOid,
      status: 'success',
      total_amount: toMinorUnits(pendingSuccessOrder.grandTotal),
      hash: 'INVALID_HASH',
      payment_type: 'card',
    }).toString(),
  });

  assert.equal(invalidHashResult.ok, false, 'Invalid hash callback must be rejected');
  log('security', `invalid hash rejected with ${invalidHashResult.status}`);

  const successCallback = await postCallback({
    merchantOid: successCheckout.merchantOid,
    status: 'success',
    totalAmount: toMinorUnits(pendingSuccessOrder.grandTotal),
    merchantKey: settings.paytrMerchantKey,
    merchantSalt: settings.paytrMerchantSalt,
    extra: {
      payment_type: 'card',
      test_mode: '1',
    },
  });

  assert.equal(successCallback.status, 200);
  assert.equal(successCallback.text.trim(), 'OK');

  const paidOrder = await fetchOrder(successCheckout.orderNumber);
  assert.equal(paidOrder.paymentStatus, 'PAID');
  assert.equal(paidOrder.status, 'CONFIRMED');
  assert.equal(paidOrder.paymentTransactions[0]?.status, 'PAID');
  assert.equal(paidOrder.paymentTransactions[0]?.callbackCount, 1);
  log('callback success flow', `${paidOrder.orderNumber} -> ${paidOrder.paymentStatus}`);

  const repeatedSuccessCallback = await postCallback({
    merchantOid: successCheckout.merchantOid,
    status: 'success',
    totalAmount: toMinorUnits(paidOrder.grandTotal),
    merchantKey: settings.paytrMerchantKey,
    merchantSalt: settings.paytrMerchantSalt,
    extra: {
      payment_type: 'card',
      test_mode: '1',
    },
  });

  assert.equal(repeatedSuccessCallback.status, 200);
  assert.equal(repeatedSuccessCallback.text.trim(), 'OK');

  const idempotentOrder = await fetchOrder(successCheckout.orderNumber);
  assert.equal(idempotentOrder.paymentStatus, 'PAID');
  assert.equal(idempotentOrder.status, 'CONFIRMED');
  assert.equal(idempotentOrder.paymentTransactions[0]?.callbackCount, 2);
  log('callback idempotency', `${idempotentOrder.orderNumber} callbackCount=2`);

  const failedCheckout = await createCheckout(product, 2, {
    customerName: 'PAYTR Failure Test',
    customerEmail: 'paytr-failure@example.com',
    customerPhone: '05302220000',
    customerNote: 'PAYTR smoke test failure flow',
  });

  assert.ok(failedCheckout.iframeToken, 'Failure flow checkout should still return iframe token');
  log('checkout failure flow', failedCheckout.orderNumber);

  const pendingFailedOrder = await fetchOrder(failedCheckout.orderNumber);
  assert.equal(pendingFailedOrder.paymentStatus, 'PENDING');
  assert.equal(pendingFailedOrder.status, 'NEW');

  const failedCallback = await postCallback({
    merchantOid: failedCheckout.merchantOid,
    status: 'failed',
    totalAmount: toMinorUnits(pendingFailedOrder.grandTotal),
    merchantKey: settings.paytrMerchantKey,
    merchantSalt: settings.paytrMerchantSalt,
    extra: {
      payment_type: 'card',
      failed_reason_code: '99',
      failed_reason_msg: 'Smoke test bank decline',
      test_mode: '1',
    },
  });

  assert.equal(failedCallback.status, 200);
  assert.equal(failedCallback.text.trim(), 'OK');

  const failedOrder = await fetchOrder(failedCheckout.orderNumber);
  assert.equal(failedOrder.paymentStatus, 'FAILED');
  assert.equal(failedOrder.status, 'CANCELLED');
  assert.equal(failedOrder.paymentTransactions[0]?.status, 'FAILED');
  assert.equal(failedOrder.paymentTransactions[0]?.callbackCount, 1);
  assert.equal(failedOrder.paymentTransactions[0]?.failureMessage, 'Smoke test bank decline');
  log('callback failure flow', `${failedOrder.orderNumber} -> ${failedOrder.paymentStatus}`);

  const productsAfter = await requestJson('/catalog/public/products?page=1&pageSize=10');
  const afterList = Array.isArray(productsAfter) ? productsAfter : productsAfter.items || [];
  const productAfter = afterList.find((item) => item.id === product.id);
  assert.ok(productAfter, 'Unable to reload test product after callbacks');

  const stockAfter = Number(productAfter.stock);
  assert.equal(
    stockAfter,
    stockBefore - 1,
    'Only the successful order should reduce stock after failure rollback',
  );

  log('stock', `${stockBefore} -> ${stockAfter}`);
  log(
    'complete',
    `success=${successCheckout.orderNumber}, failed=${failedCheckout.orderNumber}, stock=${stockAfter}`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  process.stderr.write(`[PAYTR smoke] FAILED\n${message}\n`);
  process.exitCode = 1;
});
