import { redis } from "@prepskill/common";

redis.on("connect", () => console.log("[InterviewService] Redis connected"));
redis.on("error", (err) => console.error("[InterviewService] Redis error:", err));

export default redis;
