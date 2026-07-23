/**
 * Lightweight Kora Pay helper (frontend)
 *
 * NOTE: For security, keep your Kora secret key on a secure server.
 * This helper expects a server endpoint to create and verify payments.
 * - Client calls `POST /api/kora/create-payment` with { amount, currency, metadata }
 * - Server uses the secret key to create the payment and returns { checkoutUrl, reference }
 * - Optionally verify payments via `POST /api/kora/verify` on the server
 *
 * Put your public key in `VITE_KORA_PUBLIC_KEY` for client-side integrations.
 */

export async function createPaymentSession(payload = {}) {
  // payload: { amount, currency = 'NGN', metadata }
  try {
    const res = await fetch('/api/kora/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Failed to create payment session');
    return await res.json(); // { checkoutUrl, reference }
  } catch (err) {
    console.error('createPaymentSession error:', err);
    throw err;
  }
}

export async function verifyPayment(reference) {
  try {
    const res = await fetch('/api/kora/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference })
    });

    if (!res.ok) throw new Error('Failed to verify payment');
    return await res.json(); // { status, data }
  } catch (err) {
    console.error('verifyPayment error:', err);
    throw err;
  }
}

export function openCheckoutUrl(url) {
  if (!url) throw new Error('Invalid checkout url');
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default {
  createPaymentSession,
  verifyPayment,
  openCheckoutUrl
};
