import { redis } from "@prepskill/common";

redis.on("connect", () => console.log("[AnalyticsService] Redis connected"));
redis.on("error", (err) => console.error("[AnalyticsService] Redis error:", err));

export default redis;
