import crypto from 'node:crypto';

export function descriptionHash(input: string): string {
  return crypto.createHash('sha256').update(String(input ?? ''), 'utf8').digest('hex');
}

