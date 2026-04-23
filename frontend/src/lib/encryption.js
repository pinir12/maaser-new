// Server-side AES-256-GCM encryption for sensitive transaction fields
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getKey() {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  return crypto.createHash('sha256').update(secret).digest();
}

export function encrypt(text) {
  if (text == null || text === '') return text;
  const str = String(text);
  if (str.startsWith('enc:')) return str;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(str, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([tag, encrypted]);
  return `enc:${iv.toString('base64')}:${combined.toString('base64')}`;
}

export function decrypt(text) {
  if (text == null || text === '') return text;
  const str = String(text);
  if (!str.startsWith('enc:')) return str;
  const parts = str.split(':');
  if (parts.length !== 3) return str;
  const [, ivB64, combinedB64] = parts;
  const key = getKey();
  const iv = Buffer.from(ivB64, 'base64');
  const combined = Buffer.from(combinedB64, 'base64');
  const tag = combined.subarray(0, 16);
  const ciphertext = combined.subarray(16);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

// Text fields encrypted in-place
const SENSITIVE_FIELDS = ['description', 'recipient_name'];
// Numeric fields get separate _encrypted columns (originals zeroed out)
const NUMERIC_ENCRYPTED_FIELDS = ['amount', 'maaser_amount'];

export function encryptTransaction(txn) {
  const enc = { ...txn };
  for (const f of SENSITIVE_FIELDS) {
    if (enc[f] != null && !String(enc[f]).startsWith('enc:')) {
      enc[f] = encrypt(String(enc[f]));
    }
  }
  for (const f of NUMERIC_ENCRYPTED_FIELDS) {
    if (enc[f] != null) {
      enc[`${f}_encrypted`] = encrypt(String(enc[f]));
      enc[f] = 0; // zero out plain value — real value only in encrypted column
    }
  }
  return enc;
}

export function decryptTransaction(txn) {
  const dec = { ...txn };
  for (const f of SENSITIVE_FIELDS) {
    if (dec[f] && String(dec[f]).startsWith('enc:')) {
      try { dec[f] = decrypt(dec[f]); } catch { dec[f] = '[encrypted]'; }
    }
  }
  for (const f of NUMERIC_ENCRYPTED_FIELDS) {
    const ef = `${f}_encrypted`;
    if (dec[ef]) {
      try {
        dec[f] = parseFloat(decrypt(dec[ef]));
      } catch {
        dec[f] = 0;
      }
      delete dec[ef];
    }
  }
  return dec;
}
