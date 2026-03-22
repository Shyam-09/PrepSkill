import { redis } from "@prepskill/common";

redis.on("connect", () => console.log("[MockService] Redis connected"));
redis.on("error", (err) => console.error("[MockService] Redis error:", err));

export default redis;
