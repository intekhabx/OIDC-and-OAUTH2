import jwt from 'jsonwebtoken';
import { kid, privatePem, publicPem } from '../config/key.config.js';

// import crypto from 'crypto';
// const privatePem = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');
// const publicPem  = process.env.PUBLIC_KEY.replace(/\\n/g, '\n');
// we can also genereate kid
// const kid = crypto.createHash('sha256').update(publicKey).digest('hex').slice(0, 16)


export const generateAccessToken = (payload)=>{
  return jwt.sign(payload, privatePem, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '10m',
    algorithm: 'RS256',
    keyid: kid
  })
}

export const verifyAccessToken = (token)=>{
  return jwt.verify(token, publicPem, {
    algorithms: ['RS256'],
  })
}



export const generateRefreshToken = (payload)=>{
  return jwt.sign(payload, privatePem, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    algorithm: 'RS256',
    keyid: kid
  })
}

export const verifyRefreshToken = (token)=>{
  return jwt.verify(token, publicPem, {
    algorithms: ['RS256'],
  })
}