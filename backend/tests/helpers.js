import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";

export const syncTestDatabase = async () => {
  await db.sequelize.sync({ force: true });
};

export const clearAuthData = async () => {
  await db.session.destroy({ where: {} });
  await db.list.destroy({ where: {} });
  await db.user.destroy({ where: {} });
};

export const validRegister = {
  fName: "Jane",
  lName: "Doe",
  email: "jdoe@example.com",
  username: "jdoe",
  password: "password123",
};

export const registerUser = async (overrides = {}) => {
  const payload = { ...validRegister, ...overrides };
  const res = await request(app).post("/todo/register").send(payload);
  return { res, payload };
};

export const loginUser = async (username, password) => {
  return request(app).post("/todo/login").send({ username, password });
};
