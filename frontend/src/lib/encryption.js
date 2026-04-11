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
  if (str.startsWith('enc:')) return str; // Already encrypted
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
  if (!str.startsWith('enc:')) return str; // Not encrypted
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

// Encrypt sensitive text fields in-place (description, recipient_name)
// Numeric fields (amount, maaser_amount) remain as-is for DB calculations
const SENSITIVE_FIELDS = ['description', 'recipient_name'];

export function encryptTransaction(txn) {
  const encrypted = { ...txn };
  for (const f of SENSITIVE_FIELDS) {
    if (encrypted[f] != null && !String(encrypted[f]).startsWith('enc:')) {
      encrypted[f] = encrypt(String(encrypted[f]));
    }
  }
  return encrypted;
}

export function decryptTransaction(txn) {
  const decrypted = { ...txn };
  for (const f of SENSITIVE_FIELDS) {
    if (decrypted[f] && String(decrypted[f]).startsWith('enc:')) {
      decrypted[f] = decrypt(decrypted[f]);
    }
  }
  return decrypted;
}
