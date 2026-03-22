import request from "supertest";
import app from "../index"; 


process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

describe("User Service", () => {
  it("should return health check", async () => {
    const response = await request(app).get("/api/users/health");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
  });
});