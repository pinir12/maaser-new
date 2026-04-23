import crypto from 'crypto';
import { getCurrentAdmin, jsonError } from '@/lib/jwt-server';
import { supaGet, supaPatch } from '@/lib/supabase-server';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function makeKey(secret) {
  return crypto.createHash('sha256').update(secret).digest();
}

function decryptWith(text, key) {
  if (!text || !String(text).startsWith('enc:')) return null;
  const parts = String(text).split(':');
  if (parts.length !== 3) return null;
  const iv = Buffer.from(parts[1], 'base64');
  const combined = Buffer.from(parts[2], 'base64');
  const tag = combined.subarray(0, 16);
  const ciphertext = combined.subarray(16);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

function encryptWith(text, key) {
  if (text == null || text === '') return text;
  const str = String(text);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(str, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([tag, encrypted]);
  return `enc:${iv.toString('base64')}:${combined.toString('base64')}`;
}

// POST: rotate encryption key — re-encrypts all transaction data
export async function POST(request) {
  const auth = await getCurrentAdmin(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  const { oldKey, newKey } = await request.json();
  if (!oldKey || !newKey) return jsonError('Both oldKey and newKey are required');
  if (oldKey === newKey) return jsonError('New key must be different from old key');

  const oldKeyBuf = makeKey(oldKey);
  const newKeyBuf = makeKey(newKey);

  // Verify old key works by testing against current ENCRYPTION_KEY
  const currentKey = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  const currentKeyBuf = makeKey(currentKey);

  // Old key must match what's currently configured
  if (!crypto.timingSafeEqual(oldKeyBuf, currentKeyBuf)) {
    return jsonError('Old key does not match current encryption key', 403);
  }

  try {
    const allTxns = await supaGet('transactions', { select: 'id,description,amount_encrypted,maaser_amount_encrypted,recipient_name' });

    let reEncrypted = 0;
    let failed = 0;
    const errors = [];

    for (const txn of allTxns) {
      try {
        const updates = {};
        let changed = false;

        // Re-encrypt each encrypted field
        for (const field of ['description', 'recipient_name']) {
          const val = txn[field];
          if (val && String(val).startsWith('enc:')) {
            const plain = decryptWith(val, oldKeyBuf);
            if (plain !== null) {
              updates[field] = encryptWith(plain, newKeyBuf);
              changed = true;
            }
          }
        }

        for (const field of ['amount_encrypted', 'maaser_amount_encrypted']) {
          const val = txn[field];
          if (val && String(val).startsWith('enc:')) {
            const plain = decryptWith(val, oldKeyBuf);
            if (plain !== null) {
              updates[field] = encryptWith(plain, newKeyBuf);
              changed = true;
            }
          }
        }

        if (changed) {
          await supaPatch('transactions', { id: `eq.${txn.id}` }, updates);
          reEncrypted++;
        }
      } catch (e) {
        failed++;
        errors.push({ id: txn.id, error: e.message });
      }
    }

    return Response.json({
      success: true,
      total: allTxns.length,
      reEncrypted,
      failed,
      errors: errors.slice(0, 10),
      message: `Re-encrypted ${reEncrypted} transactions. ${failed} failed. Update ENCRYPTION_KEY in your environment to the new key now.`,
    });
  } catch (e) {
    return jsonError(`Key rotation failed: ${e.message}`, 500);
  }
}
