/**
 * Web Crypto API-based PIN and Password hashing using PBKDF2.
 * Never stores plain-text PIN or password.
 */

// Helper to convert buffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate random cryptographic salt
export function generateSalt(length = 16): string {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return bufferToHex(array.buffer);
}

// Derive PBKDF2 hash using Web Crypto API
export async function hashSecret(secret: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const saltBuffer = new Uint8Array(
    saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const exported = await window.crypto.subtle.exportKey('raw', key);
  return bufferToHex(exported);
}

// Verify entered secret against hash and salt
export async function verifySecret(
  secret: string,
  saltHex: string,
  expectedHash: string
): Promise<boolean> {
  try {
    const derived = await hashSecret(secret, saltHex);
    return derived === expectedHash;
  } catch (err) {
    console.error('Failed to verify secret:', err);
    return false;
  }
}
