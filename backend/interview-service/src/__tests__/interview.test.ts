import request from "supertest";
import app from "../index";
import prisma from "../config/prisma";
import redis from "../config/redis";
import jwt from "jsonwebtoken";

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = "test-secret";

describe("Interview Service - API Tests", () => {
  let accessToken: string;
  let userId: string;
  let interviewId: string;

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

    const interview = await prisma.interviewExperience.create({
      data: {
        userId,
        company: "Google",
        companySlug: "google",
        role: "Software Engineer",
        package: 200000,
        yoe: "three_to_five",
        outcome: "selected",
        interviewDate: new Date(),
        overallExperience: "Great experience",
        tips: "Practice DSA",
        difficulty: "hard",
        upvoteCount: 0,
        isAnonymous: false,
        isApproved: true,
        tags: ["DSA", "System Design"],
      },
    });
    interviewId = interview.id;
  });

  afterEach(async () => {
    await prisma.interviewUpvote.deleteMany({});
    await prisma.interviewRound.deleteMany({});
    await prisma.interviewExperience.deleteMany({});
    await redis.flushdb();
  });

  describe("Health Check", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/api/interviews/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok");
      expect(response.body.service).toBe("interview-service");
    });
  });

  describe("GET /api/interviews", () => {
    it("should get all interviews", async () => {
      const response = await request(app).get("/api/interviews");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it("should filter by company", async () => {
      const response = await request(app).get(
        "/api/interviews?company=google"
      );

      expect(response.status).toBe(200);
    });

    it("should filter by role", async () => {
      const response = await request(app).get(
        "/api/interviews?role=Software%20Engineer"
      );

      expect(response.status).toBe(200);
    });

    it("should paginate results", async () => {
      const response = await request(app).get("/api/interviews?page=1&limit=10");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /api/interviews/companies", () => {
    it("should get list of companies", async () => {
      const response = await request(app).get("/api/interviews/companies");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /api/interviews/:id", () => {
    it("should get interview by ID", async () => {
      const response = await request(app).get(`/api/interviews/${interviewId}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(interviewId);
      expect(response.body.data.company).toBe("Google");
    });

    it("should return 404 for non-existent interview", async () => {
      const response = await request(app).get("/api/interviews/non-existent");

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/interviews/me", () => {
    it("should get user's interviews", async () => {
      const response = await request(app)
        .get("/api/interviews/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should require authentication", async () => {
      const response = await request(app).get("/api/interviews/me");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/interviews", () => {
    it("should create new interview", async () => {
      const response = await request(app)
        .post("/api/interviews")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          company: "Microsoft",
          companySlug: "microsoft",
          role: "Senior Engineer",
          package: 250000,
          yoe: "five_plus",
          outcome: "selected",
          interviewDate: new Date().toISOString(),
          overallExperience: "Excellent",
          tips: "Focus on problem solving",
          difficulty: "hard",
          tags: ["C++", "Algorithms"],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.company).toBe("Microsoft");
    });

    it("should require authentication", async () => {
      const response = await request(app).post("/api/interviews").send({
        company: "Meta",
        role: "Engineer",
      });

      expect(response.status).toBe(401);
    });

    it("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/interviews")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          company: "Apple",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("PUT /api/interviews/:id", () => {
    it("should update own interview", async () => {
      const response = await request(app)
        .put(`/api/interviews/${interviewId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          overallExperience: "Excellent experience",
          tips: "Practice system design",
        });

      expect(response.status).toBe(200);
      expect(response.body.data.overallExperience).toBe("Excellent experience");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .put(`/api/interviews/${interviewId}`)
        .send({
          overallExperience: "Updated",
        });

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/interviews/:id", () => {
    it("should delete own interview", async () => {
      const response = await request(app)
        .delete(`/api/interviews/${interviewId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      const deleted = await prisma.interviewExperience.findUnique({
        where: { id: interviewId },
      });
      expect(deleted).toBeNull();
    });

    it("should require authentication", async () => {
      const response = await request(app).delete(
        `/api/interviews/${interviewId}`
      );

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/interviews/:id/upvote", () => {
    it("should upvote interview", async () => {
      const response = await request(app)
        .post(`/api/interviews/${interviewId}/upvote`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
    });

    it("should require authentication", async () => {
      const response = await request(app).post(
        `/api/interviews/${interviewId}/upvote`
      );

      expect(response.status).toBe(401);
    });

    it("should not allow upvoting non-existent interview", async () => {
      const response = await request(app)
        .post("/api/interviews/non-existent/upvote")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });
});
