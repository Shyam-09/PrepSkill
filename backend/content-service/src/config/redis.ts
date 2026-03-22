import { redis } from "@prepskill/common";

redis.on("connect", () => console.log("[ContentService] Redis connected"));
redis.on("error", (err) => console.error("[ContentService] Redis error:", err));

export default redis;
