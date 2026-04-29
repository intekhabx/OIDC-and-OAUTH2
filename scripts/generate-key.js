import { generateKeyPairSync } from 'crypto';
import { writeFileSync, mkdirSync, appendFileSync } from 'fs';

// keys folder banao agar exist nahi karta
mkdirSync('keys', { recursive: true });

// ye crypto ka method public-key and private-key generate krke deta hai
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding:  { type: 'spki',  format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

//dono keys folder ke andar store kar rhe hai
writeFileSync('keys/private.pem', privateKey);
writeFileSync('keys/public.pem', publicKey);

// .env mein bhi write/append kr dete hai — newlines replace karke
const pub = publicKey.replace(/\n/g, '\\n');
const pri = privateKey.replace(/\n/g, '\\n');

appendFileSync('.env', `PUBLIC_KEY="${pub}"\nPRIVATE_KEY="${pri}"\n`);

console.log('Keys generated and saved to .env!');

//agar do bar script run hoga to env file me duplicate private-key and public-keya dd hoga
//to run this file --- node scripts/generate-key.js