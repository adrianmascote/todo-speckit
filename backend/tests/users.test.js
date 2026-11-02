/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */

import bcrypt from "bcryptjs";
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, clearAuthData, registerUser } from "./helpers.js";

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const profileBody = (overrides = {}) => ({
  fName: "Jane",
  lName: "Doe",
  email: "jdoe@example.com",
  username: "jdoe",
  ...overrides,
});

describe("Feature 4 — User Profile Management", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  beforeEach(async () => {
    await clearAuthData();
  });

  describe("US-4.2 — Edit profile", () => {
    it("User saves profile changes", async () => {
      const { res: registered } = await registerUser();
      const userId = registered.body.userId;

      const res = await request(app)
        .put(`/todo/users/${userId}`)
        .set(authHeader(registered.body.token))
        .send(
          profileBody({
            fName: "Janet",
            email: "janet@example.com",
          })
        );

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: userId,
        fName: "Janet",
        lName: "Doe",
        email: "janet@example.com",
        username: "jdoe",
        role: "worker",
      });
      expect(res.body.password).toBeUndefined();

      const stored = await db.user.unscoped().findByPk(userId);
      expect(stored.fName).toBe("Janet");
      expect(await bcrypt.compare("password123", stored.password)).toBe(true);
    });

    it("User fetches their own profile", async () => {
      const { res: registered } = await registerUser();

      const res = await request(app)
        .get(`/todo/users/${registered.body.userId}`)
        .set(authHeader(registered.body.token));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: registered.body.userId,
        fName: "Jane",
        lName: "Doe",
        email: "jdoe@example.com",
        username: "jdoe",
        role: "worker",
      });
      expect(res.body.password).toBeUndefined();
    });

    it("User attempts to fetch another user's profile", async () => {
      const { res: userA } = await registerUser();
      const { res: userB } = await registerUser({
        username: "asmith",
        email: "asmith@example.com",
        fName: "Alex",
      });

      const res = await request(app)
        .get(`/todo/users/${userB.body.userId}`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `User with id=${userB.body.userId} not found.`,
      });
    });

    it("User attempts to update another user's profile", async () => {
      const { res: userA } = await registerUser();
      const { res: userB } = await registerUser({
        username: "asmith",
        email: "asmith@example.com",
        fName: "Alex",
      });

      const res = await request(app)
        .put(`/todo/users/${userB.body.userId}`)
        .set(authHeader(userA.body.token))
        .send(profileBody({ fName: "Hijacked" }));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `User with id=${userB.body.userId} not found.`,
      });

      const stored = await db.user.findByPk(userB.body.userId);
      expect(stored.fName).toBe("Alex");
    });

    it("Unauthenticated profile API request", async () => {
      const res = await request(app).get("/todo/users/1");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });

    it("Profile update rejects a password that is too short", async () => {
      const { res: registered } = await registerUser();

      const res = await request(app)
        .put(`/todo/users/${registered.body.userId}`)
        .set(authHeader(registered.body.token))
        .send({ password: "short" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Password must be at least 8 characters.",
      });
    });

    it("Profile update rejects missing required fields", async () => {
      const { res: registered } = await registerUser();

      const res = await request(app)
        .put(`/todo/users/${registered.body.userId}`)
        .set(authHeader(registered.body.token))
        .send(profileBody({ fName: "" }));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "First name is required." });

      const stored = await db.user.findByPk(registered.body.userId);
      expect(stored.fName).toBe("Jane");
    });

    it("Profile update rejects a duplicate username", async () => {
      const { res: userA } = await registerUser();
      await registerUser({
        username: "userb",
        email: "b@example.com",
        fName: "Bob",
      });

      const res = await request(app)
        .put(`/todo/users/${userA.body.userId}`)
        .set(authHeader(userA.body.token))
        .send(profileBody({ username: "userb" }));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Username is already taken." });

      const other = await db.user.findOne({ where: { username: "userb" } });
      expect(other.username).toBe("userb");
    });

    it("Profile update rejects a duplicate email", async () => {
      const { res: userA } = await registerUser();
      await registerUser({
        username: "userb",
        email: "b@example.com",
        fName: "Bob",
      });

      const res = await request(app)
        .put(`/todo/users/${userA.body.userId}`)
        .set(authHeader(userA.body.token))
        .send(profileBody({ email: "b@example.com" }));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Email is already registered." });

      const other = await db.user.findOne({ where: { email: "b@example.com" } });
      expect(other.email).toBe("b@example.com");
    });

    it("Unauthenticated profile update API request", async () => {
      const res = await request(app).put("/todo/users/1").send(profileBody());

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });
});
