#!/usr/bin/env node
/**
 * Gjeneron nje cift VAPID keys per Web Push.
 *
 * Perdorimi:
 *   node scripts/generate-vapid-keys.cjs
 *
 * Output: publicKey + privateKey ne format URL-safe base64 (web-push standard).
 *
 * Pastaj:
 *   - publicKey  → frontend (.env)            VITE_VAPID_PUBLIC_KEY=...
 *   - publicKey  → edge function secret       VAPID_PUBLIC_KEY=...
 *   - privateKey → edge function secret       VAPID_PRIVATE_KEY=...
 *   - subject    → edge function secret       VAPID_SUBJECT=mailto:contact@rentcars.life
 *
 * Vendos secrets-at me Supabase CLI:
 *   supabase secrets set --project-ref <ref> VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:contact@rentcars.life
 *
 * Ose nga Dashboard: Project Settings → Edge Functions → Secrets.
 */

const crypto = require('crypto');

function jwkToVapid() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256',
  });

  const pubJwk = publicKey.export({ format: 'jwk' });
  const privJwk = privateKey.export({ format: 'jwk' });

  // VAPID public key = uncompressed point (0x04 || x || y), base64url-encoded.
  const x = Buffer.from(pubJwk.x, 'base64');
  const y = Buffer.from(pubJwk.y, 'base64');
  const publicKeyRaw = Buffer.concat([Buffer.from([0x04]), x, y]);

  return {
    publicKey: publicKeyRaw.toString('base64url'),
    privateKey: Buffer.from(privJwk.d, 'base64').toString('base64url'),
  };
}

const keys = jwkToVapid();

console.log('\n=== VAPID Keys ===');
console.log('publicKey  =', keys.publicKey);
console.log('privateKey =', keys.privateKey);
console.log('subject    = mailto:contact@rentcars.life');
console.log('\nRuaj keto vlera tani — privateKey nuk mund te rikuperohet me vone.');
console.log('Shih scripts/generate-vapid-keys.cjs per hapat tjeret.\n');
