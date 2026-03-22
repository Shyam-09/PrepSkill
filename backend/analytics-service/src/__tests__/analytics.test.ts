import request from "supertest";
import app from "../index";
import prisma from "../config/prisma";
import redis from "../config/redis";
import jwt from "jsonwebtoken";

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = "test-secret";

describe("Analytics Service - API Tests", () => {
  let accessToken: string;
  let userId: string;

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

    // Create sample platform stats
    await prisma.platformStats.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        totalUsers: 1000,
        totalProblems: 500,
        totalSheets: 20,
        totalSolves: 5000,
        totalMockAttempts: 100,
        totalInterviewPosts: 50,
      },
      update: {},
    });

    // Create sample user analytics
    await prisma.userAnalytics.create({
      data: {
        userId,
        totalSolved: 50,
        easySolved: 30,
        mediumSolved: 15,
        hardSolved: 5,
        currentStreak: 5,
        longestStreak: 10,
        mockAttempts: 5,
        averageMockScore: 85,
        interviewPosts: 2,
      },
    });
  });

  afterEach(async () => {
    await prisma.activityByDay.deleteMany({});
    await prisma.userAnalytics.deleteMany({});
    await prisma.platformStats.deleteMany({});
    await redis.flushdb();
  });

  describe("Health Check", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/api/analytics/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok");
      expect(response.body.service).toBe("analytics-service");
    });
  });

  describe("GET /api/analytics/dashboard", () => {
    it("should get platform dashboard stats", async () => {
      const response = await request(app).get("/api/analytics/dashboard");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("totalUsers");
      expect(response.body.data).toHaveProperty("totalProblems");
      expect(response.body.data).toHaveProperty("totalSheets");
      expect(response.body.data).toHaveProperty("totalSolves");
    });

    it("should cache dashboard stats", async () => {
      const response1 = await request(app).get("/api/analytics/dashboard");
      expect(response1.status).toBe(200);

      const cachedValue = await redis.get("analytics:dashboard");
      expect(cachedValue).toBeTruthy();

      const response2 = await request(app).get("/api/analytics/dashboard");
      expect(response2.body).toEqual(response1.body);
    });

    it("should return default stats if none exist", async () => {
      await prisma.platformStats.deleteMany({});

      const response = await request(app).get("/api/analytics/dashboard");

      expect(response.status).toBe(200);
      expect(response.body.data.totalUsers).toBe(0);
    });
  });

  describe("GET /api/analytics/leaderboard", () => {
    beforeEach(async () => {
      await prisma.userAnalytics.createMany({
        data: [
          {
            userId: "user-1",
            totalSolved: 100,
            easySolved: 50,
            mediumSolved: 30,
            hardSolved: 20,
            currentStreak: 10,
            longestStreak: 20,
            mockAttempts: 10,
            averageMockScore: 90,
            interviewPosts: 5,
          },
          {
            userId: "user-2",
            totalSolved: 80,
            easySolved: 40,
            mediumSolved: 25,
            hardSolved: 15,
            currentStreak: 5,
            longestStreak: 15,
            mockAttempts: 8,
            averageMockScore: 85,
            interviewPosts: 3,
          },
        ],
      });
    });

    it("should get global leaderboard", async () => {
      const response = await request(app).get("/api/analytics/leaderboard");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should sort by total solved problems", async () => {
      const response = await request(app).get("/api/analytics/leaderboard");

      expect(response.status).toBe(200);
      if (response.body.data.length > 1) {
        const first = response.body.data[0];
        const second = response.body.data[1];
        expect(first.totalSolved).toBeGreaterThanOrEqual(second.totalSolved);
      }
    });

    it("should paginate results", async () => {
      const response = await request(app).get(
        "/api/analytics/leaderboard?page=1&limit=10"
      );

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/analytics/leaderboard/sheet/:sheetId", () => {
    it("should get sheet-specific leaderboard", async () => {
      const sheetId = "sheet-123";
      const response = await request(app).get(
        `/api/analytics/leaderboard/sheet/${sheetId}`
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /api/analytics/users/:userId", () => {
    it("should get user analytics", async () => {
      const response = await request(app)
        .get(`/api/analytics/users/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.totalSolved).toBe(50);
      expect(response.body.data.currentStreak).toBe(5);
      expect(response.body.data.mockAttempts).toBe(5);
    });

    it("should cache user analytics", async () => {
      const response1 = await request(app)
        .get(`/api/analytics/users/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response1.status).toBe(200);

      const cachedValue = await redis.get(`analytics:user:${userId}`);
      expect(cachedValue).toBeTruthy();
    });

    it("should require authentication", async () => {
      const response = await request(app).get(`/api/analytics/users/${userId}`);

      expect(response.status).toBe(401);
    });

    it("should allow user to access own data", async () => {
      const response = await request(app)
        .get(`/api/analytics/users/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
    });

    it("should return 404 for non-existent user", async () => {
      const response = await request(app)
        .get("/api/analytics/users/non-existent")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/analytics/users/:userId/heatmap", () => {
    beforeEach(async () => {
      const today = new Date();
      const dates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        return date;
      });

      const activityData = await prisma.userAnalytics.findUnique({
        where: { userId },
      });

      if (activityData) {
        await prisma.activityByDay.createMany({
          data: dates.map((date) => ({
            date: date.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
            solves: Math.floor(Math.random() * 10),
            userAnalyticsId: activityData.id,
          })),
        });
      }
    });

    it("should get activity heatmap", async () => {
      const response = await request(app)
        .get(`/api/analytics/users/${userId}/heatmap`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should return activity broken down by day", async () => {
      const response = await request(app)
        .get(`/api/analytics/users/${userId}/heatmap`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty("date");
        expect(response.body.data[0]).toHaveProperty("solves");
      }
    });

    it("should require authentication", async () => {
      const response = await request(app).get(
        `/api/analytics/users/${userId}/heatmap`
      );

      expect(response.status).toBe(401);
    });

    it("should return 404 for non-existent user", async () => {
      const response = await request(app)
        .get("/api/analytics/users/non-existent/heatmap")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });
});
