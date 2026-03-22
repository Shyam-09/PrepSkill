import request from "supertest";
import app from "../index";
import prisma from "../config/prisma";
import redis from "../config/redis";
import jwt from "jsonwebtoken";

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = "test-secret";

describe("Content Service - API Tests", () => {
  let accessToken: string;
  let adminId: string;
  let categoryId: string;
  let sheetId: string;
  let topicId: string;

  beforeAll(async () => {
    await redis.connect();
  });

  afterAll(async () => {
    await redis.disconnect();
  });

  beforeEach(async () => {
    adminId = "admin-user-123";
    accessToken = jwt.sign(
      { userId: adminId },
      process.env.JWT_SECRET as string,
      { expiresIn: "15m" }
    );

    const category = await prisma.category.create({
      data: {
        name: "DSA",
        slug: "dsa",
        description: "Data Structures and Algorithms",
        order: 1,
      },
    });
    categoryId = category.id;
  });

  afterEach(async () => {
    await prisma.problem.deleteMany({});
    await prisma.topic.deleteMany({});
    await prisma.sheet.deleteMany({});
    await prisma.category.deleteMany({});
    await redis.flushdb();
  });

  describe("Health Check", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/api/content/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok");
      expect(response.body.service).toBe("content-service");
    });
  });

  describe("Categories API", () => {
    describe("GET /api/content/categories", () => {
      it("should get all categories", async () => {
        const response = await request(app).get("/api/content/categories");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it("should cache categories", async () => {
        const response1 = await request(app).get("/api/content/categories");
        expect(response1.status).toBe(200);

        const cachedValue = await redis.get("categories:all");
        expect(cachedValue).toBeTruthy();
      });
    });

    describe("GET /api/content/categories/:id", () => {
      it("should get category by ID", async () => {
        const response = await request(app).get(
          `/api/content/categories/${categoryId}`
        );

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(categoryId);
        expect(response.body.data.name).toBe("DSA");
      });

      it("should return 404 for non-existent category", async () => {
        const response = await request(app).get(
          "/api/content/categories/non-existent"
        );

        expect(response.status).toBe(404);
      });
    });

    describe("POST /api/content/categories", () => {
      it("should create a new category", async () => {
        const response = await request(app)
          .post("/api/content/categories")
          .set("Authorization", `Bearer ${accessToken}`)
          .send({
            name: "Strings",
            slug: "strings",
            description: "String algorithms",
            order: 2,
          });

        expect(response.status).toBe(201);
        expect(response.body.data.name).toBe("Strings");
      });

      it("should require authentication", async () => {
        const response = await request(app)
          .post("/api/content/categories")
          .send({
            name: "Strings",
            slug: "strings",
          });

        expect(response.status).toBe(401);
      });
    });

    describe("PUT /api/content/categories/:id", () => {
      it("should update category", async () => {
        const response = await request(app)
          .put(`/api/content/categories/${categoryId}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .send({
            name: "DSA Advanced",
            description: "Advanced Data Structures",
          });

        expect(response.status).toBe(200);
        expect(response.body.data.name).toBe("DSA Advanced");
      });

      it("should require authentication", async () => {
        const response = await request(app)
          .put(`/api/content/categories/${categoryId}`)
          .send({ name: "Updated" });

        expect(response.status).toBe(401);
      });
    });

    describe("DELETE /api/content/categories/:id", () => {
      it("should delete category", async () => {
        const response = await request(app)
          .delete(`/api/content/categories/${categoryId}`)
          .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(200);

        const deleted = await prisma.category.findUnique({
          where: { id: categoryId },
        });
        expect(deleted?.isDeleted).toBe(true);
      });

      it("should require authentication", async () => {
        const response = await request(app).delete(
          `/api/content/categories/${categoryId}`
        );

        expect(response.status).toBe(401);
      });
    });
  });

  describe("Sheets API", () => {
    beforeEach(async () => {
      const sheet = await prisma.sheet.create({
        data: {
          title: "Array Basics",
          slug: "array-basics",
          categoryId,
          totalProblems: 50,
          difficulty: "beginner",
          order: 1,
        },
      });
      sheetId = sheet.id;
    });

    describe("GET /api/content/sheets", () => {
      it("should get all sheets", async () => {
        const response = await request(app).get("/api/content/sheets");

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it("should filter sheets by difficulty", async () => {
        const response = await request(app).get(
          "/api/content/sheets?difficulty=beginner"
        );

        expect(response.status).toBe(200);
      });
    });

    describe("GET /api/content/sheets/:id", () => {
      it("should get sheet by ID", async () => {
        const response = await request(app).get(`/api/content/sheets/${sheetId}`);

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(sheetId);
        expect(response.body.data.title).toBe("Array Basics");
      });
    });

    describe("POST /api/content/sheets", () => {
      it("should create a new sheet", async () => {
        const response = await request(app)
          .post("/api/content/sheets")
          .set("Authorization", `Bearer ${accessToken}`)
          .send({
            title: "Linked Lists",
            slug: "linked-lists",
            categoryId,
            totalProblems: 40,
            difficulty: "intermediate",
            order: 2,
          });

        expect(response.status).toBe(201);
        expect(response.body.data.title).toBe("Linked Lists");
      });
    });

    describe("PUT /api/content/sheets/:id", () => {
      it("should update sheet", async () => {
        const response = await request(app)
          .put(`/api/content/sheets/${sheetId}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .send({ title: "Advanced Arrays", totalProblems: 60 });

        expect(response.status).toBe(200);
        expect(response.body.data.title).toBe("Advanced Arrays");
      });
    });

    describe("DELETE /api/content/sheets/:id", () => {
      it("should delete sheet", async () => {
        const response = await request(app)
          .delete(`/api/content/sheets/${sheetId}`)
          .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
      });
    });
  });

  describe("Topics API", () => {
    beforeEach(async () => {
      const sheet = await prisma.sheet.create({
        data: {
          title: "Array Basics",
          slug: "array-basics",
          categoryId,
          totalProblems: 50,
          difficulty: "beginner",
          order: 1,
        },
      });
      sheetId = sheet.id;

      const topic = await prisma.topic.create({
        data: {
          title: "Arrays Fundamentals",
          slug: "arrays-fundamentals",
          sheetId,
          order: 1,
        },
      });
      topicId = topic.id;
    });

    describe("GET /api/content/topics/sheet/:sheetId", () => {
      it("should get topics by sheet", async () => {
        const response = await request(app).get(
          `/api/content/topics/sheet/${sheetId}`
        );

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe("GET /api/content/topics/:id", () => {
      it("should get topic by ID", async () => {
        const response = await request(app).get(`/api/content/topics/${topicId}`);

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(topicId);
      });
    });

    describe("POST /api/content/topics", () => {
      it("should create topic", async () => {
        const response = await request(app)
          .post("/api/content/topics")
          .set("Authorization", `Bearer ${accessToken}`)
          .send({
            title: "Array Traversal",
            slug: "array-traversal",
            sheetId,
            order: 2,
          });

        expect(response.status).toBe(201);
        expect(response.body.data.title).toBe("Array Traversal");
      });
    });

    describe("PUT /api/content/topics/:id", () => {
      it("should update topic", async () => {
        const response = await request(app)
          .put(`/api/content/topics/${topicId}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .send({ title: "Advanced Array Fundamentals" });

        expect(response.status).toBe(200);
      });
    });

    describe("DELETE /api/content/topics/:id", () => {
      it("should delete topic", async () => {
        const response = await request(app)
          .delete(`/api/content/topics/${topicId}`)
          .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
      });
    });
  });

  describe("Problems API", () => {
    beforeEach(async () => {
      const sheet = await prisma.sheet.create({
        data: {
          title: "Array Basics",
          slug: "array-basics",
          categoryId,
          totalProblems: 50,
          difficulty: "beginner",
          order: 1,
        },
      });
      sheetId = sheet.id;

      const topic = await prisma.topic.create({
        data: {
          title: "Arrays Fundamentals",
          slug: "arrays-fundamentals",
          sheetId,
          order: 1,
        },
      });
      topicId = topic.id;
    });

    describe("GET /api/content/problems", () => {
      it("should get all problems", async () => {
        const response = await request(app).get("/api/content/problems");

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it("should filter by difficulty", async () => {
        const response = await request(app).get(
          "/api/content/problems?difficulty=easy"
        );

        expect(response.status).toBe(200);
      });
    });

    describe("GET /api/content/problems/:id", () => {
      it("should get problem by ID", async () => {
        const problem = await prisma.problem.create({
          data: {
            title: "Two Sum",
            slug: "two-sum",
            difficulty: "easy",
            topicId,
            sheetId,
            order: 1,
          },
        });

        const response = await request(app).get(`/api/content/problems/${problem.id}`);

        expect(response.status).toBe(200);
        expect(response.body.data.title).toBe("Two Sum");
      });
    });

    describe("POST /api/content/problems", () => {
      it("should create problem and trigger event", async () => {
        const response = await request(app)
          .post("/api/content/problems")
          .set("Authorization", `Bearer ${accessToken}`)
          .send({
            title: "Two Sum",
            slug: "two-sum",
            difficulty: "easy",
            topicId,
            sheetId,
            order: 1,
          });

        expect(response.status).toBe(201);
        expect(response.body.data.title).toBe("Two Sum");
      });
    });

    describe("PUT /api/content/problems/:id", () => {
      it("should update problem", async () => {
        const problem = await prisma.problem.create({
          data: {
            title: "Two Sum",
            slug: "two-sum",
            difficulty: "easy",
            topicId,
            sheetId,
            order: 1,
          },
        });

        const response = await request(app)
          .put(`/api/content/problems/${problem.id}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .send({ difficulty: "medium" });

        expect(response.status).toBe(200);
      });
    });

    describe("DELETE /api/content/problems/:id", () => {
      it("should delete problem", async () => {
        const problem = await prisma.problem.create({
          data: {
            title: "Two Sum",
            slug: "two-sum",
            difficulty: "easy",
            topicId,
            sheetId,
            order: 1,
          },
        });

        const response = await request(app)
          .delete(`/api/content/problems/${problem.id}`)
          .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
      });
    });
  });
});
