/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */

import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, clearAuthData, registerUser } from "./helpers.js";

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  beforeEach(async () => {
    await clearAuthData();
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("API request includes session token", async () => {
      const { res: registered } = await registerUser();
      const token = registered.body.token;

      const unauthorized = await request(app).get("/todo/lists");
      expect(unauthorized.status).toBe(401);

      const res = await request(app)
        .get("/todo/lists")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it("Protected API request succeeds with a valid session", async () => {
      const { res: userA } = await registerUser();
      const { res: userB } = await registerUser({
        username: "asmith",
        email: "asmith@example.com",
        fName: "Alex",
      });

      await db.list.create({ name: "A list", userId: userA.body.userId });
      await db.list.create({ name: "B list", userId: userB.body.userId });

      const res = await request(app)
        .get("/todo/lists")
        .set("Authorization", `Bearer ${userA.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("A list");
      expect(res.body[0].userId).toBe(userA.body.userId);
    });

    it("Expired or invalid session token", async () => {
      const { res: registered } = await registerUser();
      const token = registered.body.token;

      await db.session.update(
        { expirationDate: new Date(Date.now() - 60_000) },
        { where: { token } }
      );

      const expired = await request(app)
        .get("/todo/lists")
        .set("Authorization", `Bearer ${token}`);

      expect(expired.status).toBe(401);
      expect(expired.body.message).toMatch(/Unauthorized/i);

      const invalid = await request(app)
        .get("/todo/lists")
        .set("Authorization", "Bearer not-a-real-token");

      expect(invalid.status).toBe(401);
      expect(invalid.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      const res = await request(app).get("/todo/lists");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });
});
