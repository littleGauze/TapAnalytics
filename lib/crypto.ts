import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'tapanalytics-local-dev-secret-change-me';

function key(): Buffer {
  return scryptSync(SECRET, 'tapanalytics-accounts', 32);
}

export function encrypt(text: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

export function decrypt(text: string): string {
  if (!text.startsWith('enc:')) return text;
  const [, ivB64, tagB64, dataB64] = text.split(':');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]);
  return dec.toString('utf8');
}
