// Server-side AES-256-GCM encryption for sensitive transaction fields
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey() {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  // Derive a 32-byte key from the secret
  return crypto.createHash('sha256').update(secret).digest();
}

export function encrypt(text) {
  if (text == null || text === '') return text;
  const str = String(text);
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(str, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const tag = cipher.getAuthTag();
  // Store as: iv:tag:ciphertext (all base64)
  return `enc:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted}`;
}

export function decrypt(text) {
  if (text == null || text === '') return text;
  const str = String(text);
  if (!str.startsWith('enc:')) return str; // Not encrypted, return as-is
  const parts = str.split(':');
  if (parts.length !== 4) return str;
  const [, ivB64, tagB64, ciphertext] = parts;
  const key = getKey();
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Encrypt sensitive fields of a transaction before storing
export function encryptTransaction(txn) {
  const encrypted = { ...txn };
  if (encrypted.amount != null) encrypted.amount_encrypted = encrypt(String(encrypted.amount));
  if (encrypted.description) encrypted.description_encrypted = encrypt(encrypted.description);
  if (encrypted.recipient_name) encrypted.recipient_name_encrypted = encrypt(encrypted.recipient_name);
  return encrypted;
}

// Decrypt sensitive fields after reading
export function decryptTransaction(txn) {
  const decrypted = { ...txn };
  if (decrypted.amount_encrypted) {
    decrypted.amount = parseFloat(decrypt(decrypted.amount_encrypted));
    delete decrypted.amount_encrypted;
  }
  if (decrypted.description_encrypted) {
    decrypted.description = decrypt(decrypted.description_encrypted);
    delete decrypted.description_encrypted;
  }
  if (decrypted.recipient_name_encrypted) {
    decrypted.recipient_name = decrypt(decrypted.recipient_name_encrypted);
    delete decrypted.recipient_name_encrypted;
  }
  return decrypted;
}
