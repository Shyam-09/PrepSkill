import request from "supertest";
import app from "../index";
import prisma from "../config/prisma";
import redis from "../config/redis";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

describe("User Service - User Management", () => {
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    await redis.connect();
  });

  afterAll(async () => {
    await redis.disconnect();
  });

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await prisma.user.create({
      data: {
        name: "John Doe",
        email: "john@example.com",
        password: hashedPassword,
      },
    });
    userId = user.id;

    accessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET as string,
      { expiresIn: "15m" }
    );
  });

  afterEach(async () => {
    await prisma.user.deleteMany({});
    await redis.flushdb();
  });

  describe("GET /api/users/me", () => {
    it("should get current user info", async () => {
      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe("john@example.com");
      expect(response.body.data.name).toBe("John Doe");
    });

    it("should not get user info without token", async () => {
      const response = await request(app).get("/api/users/me");

      expect(response.status).toBe(401);
    });

    it("should not get user info with invalid token", async () => {
      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/users/:id", () => {
    it("should get user by ID", async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.email).toBe("john@example.com");
    });

    it("should not get non-existent user", async () => {
      const response = await request(app)
        .get("/api/users/non-existent-id")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });

    it("should require authentication", async () => {
      const response = await request(app).get(`/api/users/${userId}`);

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/users", () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      await prisma.user.createMany({
        data: [
          {
            name: "Jane Doe",
            email: "jane@example.com",
            password: hashedPassword,
          },
          {
            name: "Bob Smith",
            email: "bob@example.com",
            password: hashedPassword,
          },
        ],
      });
    });

    it("should get all users with pagination", async () => {
      const response = await request(app)
        .get("/api/users?page=1&limit=10")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it("should search users by name", async () => {
      const response = await request(app)
        .get("/api/users?search=Jane")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toContainEqual(
        expect.objectContaining({ name: "Jane Doe" })
      );
    });

    it("should require authentication", async () => {
      const response = await request(app).get("/api/users");

      expect(response.status).toBe(401);
    });
  });

  describe("Health Check", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/api/users/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok");
      expect(response.body.service).toBe("user-service");
    });
  });
});
