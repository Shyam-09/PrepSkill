import request from "supertest";
import app from "../index";
import prisma from "../config/prisma";
import redis from "../config/redis";
import jwt from "jsonwebtoken";

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = "test-secret";

describe("Mock Service - API Tests", () => {
  let accessToken: string;
  let userId: string;
  let testId: string;

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

    const test = await prisma.mockTest.create({
      data: {
        title: "DSA Test 1",
        description: "Basic DSA problems",
        category: "Arrays",
        totalMarks: 100,
        duration: 60,
        difficulty: "easy",
        isPremium: false,
        totalAttempts: 0,
      },
    });
    testId = test.id;

    await prisma.mockQuestion.createMany({
      data: [
        {
          question: "What is Array?",
          options: ["Linear", "Non-linear", "Both", "None"],
          correctAnswer: 0,
          explanation: "Array is a linear data structure",
          difficulty: "easy",
          marks: 10,
          order: 1,
          testId,
        },
        {
          question: "Time complexity of binary search?",
          options: ["O(n)", "O(log n)", "O(n^2)", "O(n log n)"],
          correctAnswer: 1,
          explanation: "Binary search is O(log n)",
          difficulty: "medium",
          marks: 10,
          order: 2,
          testId,
        },
      ],
    });
  });

  afterEach(async () => {
    await prisma.answerDetail.deleteMany({});
    await prisma.mockAttempt.deleteMany({});
    await prisma.mockQuestion.deleteMany({});
    await prisma.mockTest.deleteMany({});
    await redis.flushdb();
  });

  describe("Health Check", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/api/mock/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok");
      expect(response.body.service).toBe("mock-service");
    });
  });

  describe("GET /api/mock/tests", () => {
    it("should get all mock tests", async () => {
      const response = await request(app).get("/api/mock/tests");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it("should filter by category", async () => {
      const response = await request(app).get("/api/mock/tests?category=Arrays");

      expect(response.status).toBe(200);
    });

    it("should filter by difficulty", async () => {
      const response = await request(app).get("/api/mock/tests?difficulty=easy");

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/mock/tests/:id", () => {
    it("should get test by ID", async () => {
      const response = await request(app).get(`/api/mock/tests/${testId}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(testId);
      expect(response.body.data.title).toBe("DSA Test 1");
    });

    it("should return 404 for non-existent test", async () => {
      const response = await request(app).get("/api/mock/tests/non-existent");

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/mock/tests", () => {
    it("should create new test", async () => {
      const response = await request(app)
        .post("/api/mock/tests")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          title: "Advanced DSA",
          description: "Advanced problems",
          category: "Graphs",
          totalMarks: 100,
          duration: 120,
          difficulty: "hard",
          isPremium: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe("Advanced DSA");
    });

    it("should require authentication", async () => {
      const response = await request(app).post("/api/mock/tests").send({
        title: "New Test",
        category: "Arrays",
      });

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/mock/attempts/start", () => {
    it("should start a new attempt", async () => {
      const response = await request(app)
        .post("/api/mock/attempts/start")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ testId });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.status).toBe("in_progress");
      expect(response.body.data.userId).toBe(userId);
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/mock/attempts/start")
        .send({ testId });

      expect(response.status).toBe(401);
    });

    it("should return 404 for non-existent test", async () => {
      const response = await request(app)
        .post("/api/mock/attempts/start")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ testId: "non-existent" });

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/mock/attempts/:id/submit", () => {
    let attemptId: string;

    beforeEach(async () => {
      const attempt = await prisma.mockAttempt.create({
        data: {
          userId,
          testId,
          score: 0,
          totalMarks: 100,
          percentage: 0,
          status: "in_progress",
          startedAt: new Date(),
        },
      });
      attemptId = attempt.id;
    });

    it("should submit attempt successfully", async () => {
      const response = await request(app)
        .post(`/api/mock/attempts/${attemptId}/submit`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          answers: [
            { questionId: "q1", selectedOption: 0 },
            { questionId: "q2", selectedOption: 1 },
          ],
          timeTakenSeconds: 1800,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("completed");
      expect(response.body.data).toHaveProperty("score");
      expect(response.body.data).toHaveProperty("percentage");
    });

    it("should not submit already completed attempt", async () => {
      await prisma.mockAttempt.update({
        where: { id: attemptId },
        data: { status: "completed" },
      });

      const response = await request(app)
        .post(`/api/mock/attempts/${attemptId}/submit`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          answers: [],
          timeTakenSeconds: 1800,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Already submitted");
    });

    it("should calculate rank correctly", async () => {
      const response = await request(app)
        .post(`/api/mock/attempts/${attemptId}/submit`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          answers: [
            { questionId: "q1", selectedOption: 0 },
            { questionId: "q2", selectedOption: 1 },
          ],
          timeTakenSeconds: 1800,
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("rank");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .post(`/api/mock/attempts/${attemptId}/submit`)
        .send({
          answers: [],
          timeTakenSeconds: 1800,
        });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/mock/attempts/me", () => {
    beforeEach(async () => {
      await prisma.mockAttempt.create({
        data: {
          userId,
          testId,
          score: 50,
          totalMarks: 100,
          percentage: 50,
          status: "completed",
          startedAt: new Date(),
          completedAt: new Date(),
        },
      });
    });

    it("should get user attempts", async () => {
      const response = await request(app)
        .get("/api/mock/attempts/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it("should require authentication", async () => {
      const response = await request(app).get("/api/mock/attempts/me");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/mock/leaderboard/:testId", () => {
    beforeEach(async () => {
      await prisma.mockAttempt.createMany({
        data: [
          {
            userId: "user-1",
            testId,
            score: 80,
            totalMarks: 100,
            percentage: 80,
            rank: 1,
            status: "completed",
            startedAt: new Date(),
            completedAt: new Date(),
          },
          {
            userId: "user-2",
            testId,
            score: 60,
            totalMarks: 100,
            percentage: 60,
            rank: 2,
            status: "completed",
            startedAt: new Date(),
            completedAt: new Date(),
          },
        ],
      });
    });

    it("should get test leaderboard", async () => {
      const response = await request(app).get(
        `/api/mock/leaderboard/${testId}`
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
