import { redis } from "@prepskill/common";

redis.on("connect", () => console.log("[ProgressService] Redis connected"));
redis.on("error", (err) => console.error("[ProgressService] Redis error:", err));

export default redis;
