
export const buildAccessTokenPayload = (user, client_id=null)=>{
  return {
    sub: user._id,
    email: user.email,
    username: user.username,
    name: user.name,
    role: user.role,
    aud: client_id ?? process.env.ISSUER_URL,
    iss: process.env.ISSUER_URL || "http://localhost:8000"
  }
}