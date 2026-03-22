import request from "supertest";
import app from "../index";
import prisma from "../config/prisma";
import redis from "../config/redis";
import jwt from "jsonwebtoken";

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = "test-secret";

describe("Progress Service - API Tests", () => {
  let accessToken: string;
  let userId: string;
  let problemId: string;

  beforeAll(async () => {
    await redis.connect();
  });

  afterAll(async () => {
    await redis.disconnect();
  });

  beforeEach(async () => {
    userId = "user-123";
    accessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET as string,
      { expiresIn: "15m" }
    );

    problemId = "problem-123";
  });

  afterEach(async () => {
    await prisma.solvedProblem.deleteMany({});
    await prisma.userProgress.deleteMany({});
    await prisma.sheetProgress.deleteMany({});
    await redis.flushdb();
  });

  describe("Health Check", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/api/progress/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok");
      expect(response.body.service).toBe("progress-service");
    });
  });

  describe("GET /api/progress/:userId", () => {
    it("should return 0 progress for new user", async () => {
      const response = await request(app).get(`/api/progress/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body.data.totalSolved).toBe(0);
      expect(response.body.data.easySolved).toBe(0);
    });

    it("should get user progress if exists", async () => {
      await prisma.userProgress.create({
        data: {
          userId,
          totalSolved: 10,
          easySolved: 5,
          mediumSolved: 3,
          hardSolved: 2,
          currentStreak: 5,
          longestStreak: 7,
        },
      });

      const response = await request(app).get(`/api/progress/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body.data.totalSolved).toBe(10);
      expect(response.body.data.currentStreak).toBe(5);
    });
  });

  describe("GET /api/progress/:userId/stats", () => {
    it("should return user stats", async () => {
      await prisma.userProgress.create({
        data: {
          userId,
          totalSolved: 10,
          easySolved: 5,
          mediumSolved: 3,
          hardSolved: 2,
          currentStreak: 5,
          longestStreak: 7,
        },
      });

      const response = await request(app).get(`/api/progress/${userId}/stats`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("totalSolved");
      expect(response.body.data).toHaveProperty("currentStreak");
    });
  });

  describe("GET /api/progress/:userId/sheet/:sheetId", () => {
    it("should get sheet progress", async () => {
      const sheetId = "sheet-123";
      await prisma.sheetProgress.create({
        data: {
          userId,
          sheetId,
          totalProblems: 50,
          solvedCount: 25,
          completionPercentage: 50,
        },
      });

      const response = await request(app).get(
        `/api/progress/${userId}/sheet/${sheetId}`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.completionPercentage).toBe(50);
    });
  });

  describe("POST /api/progress/solve", () => {
    it("should mark problem as solved", async () => {
      const response = await request(app)
        .post("/api/progress/solve")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          problemId,
          sheetId: "sheet-123",
          topicId: "topic-123",
          difficulty: "easy",
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("totalSolved");
    });

    it("should require authentication", async () => {
      const response = await request(app).post("/api/progress/solve").send({
        problemId,
        sheetId: "sheet-123",
      });

      expect(response.status).toBe(401);
    });

    it("should update streak correctly", async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      await prisma.userProgress.create({
        data: {
          userId,
          totalSolved: 1,
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: yesterday,
        },
      });

      const response = await request(app)
        .post("/api/progress/solve")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          problemId: "problem-2",
          sheetId: "sheet-123",
          topicId: "topic-123",
          difficulty: "easy",
        });

      expect(response.status).toBe(200);
      expect(response.body.data.currentStreak).toBeGreaterThan(1);
    });
  });

  describe("DELETE /api/progress/solve/:problemId", () => {
    it("should unmark solved problem", async () => {
      await prisma.userProgress.create({
        data: {
          userId,
          totalSolved: 1,
          easySolved: 1,
        },
      });

      await prisma.solvedProblem.create({
        data: {
          userId,
          problemId,
          sheetId: "sheet-123",
          topicId: "topic-123",
          difficulty: "easy",
        },
      });

      const response = await request(app)
        .delete(`/api/progress/solve/${problemId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
    });

    it("should require authentication", async () => {
      const response = await request(app).delete(
        `/api/progress/solve/${problemId}`
      );

      expect(response.status).toBe(401);
    });

    it("should handle non-existent solved problem", async () => {
      const response = await request(app)
        .delete(`/api/progress/solve/${problemId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
    });
  });
});
