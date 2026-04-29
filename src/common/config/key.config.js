import { createHash } from 'crypto';
import { importSPKI, exportJWK } from 'jose';

// ENV se public key PEM string lo
// replace isliye kyunki .env me \n literal string hota hai, actual newline nahi
const publicPem  = process.env.PUBLIC_KEY.replace(/\\n/g, '\n');
const privatePem = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');

// public key ke content se unique ID banao
// slice(0, 16) → sirf pehle 16 characters lo — kaafi hai unique rehne ke liye
const kid = createHash('sha256').update(publicPem).digest('hex').slice(0, 16);

// PEM string → jose ka usable key object
// RS256 → algorithm batao jo is key ke saath use hoga
const publicKey = await importSPKI(publicPem, 'RS256');

// key object → JWK format (JSON)
// clients /jwks.json se yahi fetch karenge verify karne ke liye
const jwk = await exportJWK(publicKey);

// JWKS response banao jo /api/auth/jwks.json route return karega
const jwks = {
  keys: [{
    ...jwk,        // n, e, kty fields JWK se aayenge
    use: 'sig',    // yeh key sirf signature ke liye hai
    alg: 'RS256',  // algorithm jo use hoga
    kid,           // key ID — client token header se match karega agar ek se jyda public key hoga
  }]
};


// kid - (public-key id) - isko token generate krte hue use krenge but we can also regenereate v kr sakte hai
// const kid = createHash('sha256').update(publicPem).digest('hex').slice(0, 16);

//clients ko PEM nhi JWK format chahiye: is liye format change kiye
// kyuki pem me ----start--- || ----end--- ye sb v hota hai
// Sirf is ek kaam ke liye jose use ho raha hai — PEM ko JWK mein convert karna.
export { kid, jwks, publicPem, privatePem};