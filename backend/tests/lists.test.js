/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */

import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, clearAuthData, registerUser } from "./helpers.js";

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

describe("Feature 2 — Todo List Management", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  beforeEach(async () => {
    await clearAuthData();
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      const { res: registered } = await registerUser();
      const token = registered.body.token;

      const res = await request(app)
        .post("/todo/lists")
        .set(authHeader(token))
        .send({ name: "Groceries" });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        name: "Groceries",
        userId: registered.body.userId,
      });
      expect(res.body.id).toEqual(expect.any(Number));
    });

    it("User creates a list with an empty name", async () => {
      const { res: registered } = await registerUser();

      const empty = await request(app)
        .post("/todo/lists")
        .set(authHeader(registered.body.token))
        .send({ name: "   " });

      expect(empty.status).toBe(400);
      expect(empty.body).toEqual({ message: "List name is required." });
      expect(await db.list.count()).toBe(0);
    });

    it("User creates a list with a name that is too long", async () => {
      const { res: registered } = await registerUser();
      const tooLong = "a".repeat(101);

      const res = await request(app)
        .post("/todo/lists")
        .set(authHeader(registered.body.token))
        .send({ name: tooLong });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "List name must be 100 characters or fewer.",
      });
      expect(await db.list.count()).toBe(0);
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      const { res: registered } = await registerUser();
      await db.list.create({ name: "Work", userId: registered.body.userId });
      await db.list.create({ name: "Personal", userId: registered.body.userId });

      const res = await request(app)
        .get("/todo/lists")
        .set(authHeader(registered.body.token));

      expect(res.status).toBe(200);
      expect(res.body.map((list) => list.name)).toEqual(["Personal", "Work"]);
    });

    it("User cannot see another user's lists", async () => {
      const { res: userA } = await registerUser();
      const { res: userB } = await registerUser({
        username: "asmith",
        email: "asmith@example.com",
        fName: "Alex",
      });

      await db.list.create({ name: "Mine", userId: userA.body.userId });
      await db.list.create({
        name: "Secret Project",
        userId: userB.body.userId,
      });

      const res = await request(app)
        .get("/todo/lists")
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("Mine");
      expect(res.body[0].userId).toBe(userA.body.userId);
      expect(res.body.some((list) => list.name === "Secret Project")).toBe(false);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      const { res: registered } = await registerUser();
      const list = await db.list.create({
        name: "Groceries",
        userId: registered.body.userId,
      });

      const res = await request(app)
        .put(`/todo/lists/${list.id}`)
        .set(authHeader(registered.body.token))
        .send({ name: "Shopping" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: list.id,
        name: "Shopping",
        userId: registered.body.userId,
      });

      const stored = await db.list.findByPk(list.id);
      expect(stored.name).toBe("Shopping");
    });

    it("User deletes a list", async () => {
      const { res: registered } = await registerUser();
      const list = await db.list.create({
        name: "Groceries",
        userId: registered.body.userId,
      });

      const res = await request(app)
        .delete(`/todo/lists/${list.id}`)
        .set(authHeader(registered.body.token));

      expect([200, 204]).toContain(res.status);
      expect(await db.list.findByPk(list.id)).toBeNull();
    });
  });

  describe("US-2.5 — Private lists only", () => {
    it("User attempts to rename another user's list", async () => {
      const { res: userA } = await registerUser();
      const { res: userB } = await registerUser({
        username: "asmith",
        email: "asmith@example.com",
        fName: "Alex",
      });
      const otherList = await db.list.create({
        name: "Secret Project",
        userId: userB.body.userId,
      });

      const res = await request(app)
        .put(`/todo/lists/${otherList.id}`)
        .set(authHeader(userA.body.token))
        .send({ name: "Hijacked" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `List with id=${otherList.id} not found.`,
      });

      const stored = await db.list.findByPk(otherList.id);
      expect(stored.name).toBe("Secret Project");
    });

    it("User attempts to delete another user's list", async () => {
      const { res: userA } = await registerUser();
      const { res: userB } = await registerUser({
        username: "asmith",
        email: "asmith@example.com",
        fName: "Alex",
      });
      const otherList = await db.list.create({
        name: "Secret Project",
        userId: userB.body.userId,
      });

      const res = await request(app)
        .delete(`/todo/lists/${otherList.id}`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `List with id=${otherList.id} not found.`,
      });
      expect(await db.list.findByPk(otherList.id)).not.toBeNull();
    });

    it("Client cannot assign a list to another user on create", async () => {
      const { res: userA } = await registerUser();

      const res = await request(app)
        .post("/todo/lists")
        .set(authHeader(userA.body.token))
        .send({ name: "Groceries", userId: 999 });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(userA.body.userId);
      expect(res.body.userId).not.toBe(999);

      const stored = await db.list.findByPk(res.body.id);
      expect(stored.userId).toBe(userA.body.userId);
    });

    it("Unauthenticated API request to lists", async () => {
      const res = await request(app).get("/todo/lists");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });
});
