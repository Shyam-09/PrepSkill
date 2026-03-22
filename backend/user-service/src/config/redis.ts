import { redis } from "@prepskill/common";

redis.on("connect", () => console.log("[UserService] Redis connected"));
redis.on("error", (err) => console.error("[UserService] Redis error:", err));

export default redis;
