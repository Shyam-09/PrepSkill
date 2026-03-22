import redis from "../config/redis";

export const getCache = async <T>(key: string): Promise<T | null> => {
  const val = await redis.get(key);
  return val ? (JSON.parse(val) as T) : null;
};

export const setCache = async (key: string, value: unknown, ttl: number): Promise<void> => {
  await redis.set(key, JSON.stringify(value), "EX", ttl);
};

export const deleteCache = async (...keys: string[]): Promise<void> => {
  if (keys.length) await redis.del(...keys);
};

export const deleteCachePattern = async (pattern: string): Promise<void> => {
  const keys = await redis.keys(pattern);
  if (keys.length) await redis.del(...keys);
};
