import Redis from "ioredis";


export const redis = new Redis(process.env.UPSTASH_REDIS_URL, {
  tls: {}
});

// export const redis = new Redis({
//   host: process.env.REDIS_HOST || "localhost",
//   port: process.env.REDIS_PORT || 6379,
//   username: process.env.REDIS_USERNAME || "default",
//   password: process.env.REDIS_PASSWORD,
//   tls: {}
// });


redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis Error:", err);
});
