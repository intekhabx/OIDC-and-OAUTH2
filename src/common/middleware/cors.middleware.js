import cors from "cors";
import { redis } from "../config/redis.config.js";
import { applicationModel } from "../../module/oidc/oidc.model.js";

const isAllowedOrigin = async (origin) => {
  // 1. Redis check:: check origin:http:localhost:5173 is present in redis or not
  const cached = await redis.sismember("allowed_origins", origin);

  if (cached) {
    return true;
  }

  // 2. DB fallback :: if not found in redis then check in the DB, origin is registered or not
  const app = await applicationModel.findOne({
    url: origin
  });

  if (!app) {
    return false;
  }

  // 3. Redis update :: if url is registered in db then also cache in redis
  await redis.sadd("allowed_origins", origin);
  return true;
};



export const corsMiddleware = cors({
  origin: async (origin, callback) => {
    try {
      // if no origin means it calls from postman or other
      if (!origin) {
        // callback(error, isAllowed)
        return callback(null, true);
      }

      // whitelisting my ownurl
      if(origin === process.env.ISSUER_URL || "http://localhost:8000"){
        return callback(null, true);
      }

      const allowed = await isAllowedOrigin(origin);
      if (allowed) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed"));
    } 
    catch (error) {
      return callback(error);
    }
  },
  credentials: true,
});