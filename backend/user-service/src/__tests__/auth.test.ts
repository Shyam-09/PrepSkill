import request from "supertest";
import app from "../index";
import prisma from "../config/prisma";
import redis from "../config/redis";
import bcrypt from "bcryptjs";

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

describe("Auth Service - Authentication", () => {
  beforeAll(async () => {
    await redis.connect();
  });

  afterAll(async () => {
    await redis.disconnect();
  });

  afterEach(async () => {
    await prisma.user.deleteMany({});
    await redis.flushdb();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.email).toBe("john@example.com");
      expect(response.body.data.name).toBe("John Doe");
      expect(response.body.data).not.toHaveProperty("password");
    });

    it("should not register with invalid email", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "John Doe",
          email: "invalid-email",
          password: "password123",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should not register with short password", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "123",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should not register with duplicate email", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        });

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Jane Doe",
          email: "john@example.com",
          password: "password456",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("already registered");
    });

    it("should not register with missing fields", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: "john@example.com",
          password: "password123",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      await prisma.user.create({
        data: {
          name: "John Doe",
          email: "john@example.com",
          password: hashedPassword,
        },
      });
    });

    it("should login successfully with correct credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "john@example.com",
          password: "password123",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("accessToken");
      expect(response.body.data).toHaveProperty("refreshToken");
      expect(response.body.data.user.email).toBe("john@example.com");
    });

    it("should not login with wrong password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "john@example.com",
          password: "wrongpassword",
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain("Invalid");
    });

    it("should not login with non-existent email", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain("Invalid");
    });

    it("should store refresh token in Redis", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "john@example.com",
          password: "password123",
        });

      const userId = response.body.data.user.id;
      const storedToken = await redis.get(`refresh:${userId}`);

      expect(storedToken).toBe(response.body.data.refreshToken);
    });
  });

  describe("POST /api/auth/logout", () => {
    let accessToken: string;
    let userId: string;

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

      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: "john@example.com",
          password: "password123",
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it("should logout successfully", async () => {
      const response = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should blacklist token on logout", async () => {
      const response = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      const blacklisted = await redis.get(`blacklist:${accessToken}`);
      expect(blacklisted).toBe("1");
    });

    it("should remove refresh token from Redis on logout", async () => {
      await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`);

      const storedToken = await redis.get(`refresh:${userId}`);
      expect(storedToken).toBeNull();
    });

    it("should not allow requests with blacklisted token", async () => {
      await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`);

      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain("revoked");
    });

    it("should not logout without token", async () => {
      const response = await request(app)
        .post("/api/auth/logout");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/auth/refresh-token", () => {
    let refreshToken: string;
    let userId: string;

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

      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: "john@example.com",
          password: "password123",
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it("should refresh access token successfully", async () => {
      const response = await request(app)
        .post("/api/auth/refresh-token")
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("accessToken");
    });

    it("should not refresh with invalid token", async () => {
      const response = await request(app)
        .post("/api/auth/refresh-token")
        .send({ refreshToken: "invalid-token" });

      expect(response.status).toBe(401);
    });
  });
});
