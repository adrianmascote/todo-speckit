import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import authConfig from "../config/auth.config.js";
import logger from "../config/logger.js";

const SALT_ROUNDS = 10;
const SESSION_MS = 24 * 60 * 60 * 1000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const { user: User, session: Session, Sequelize } = db;
const { Op } = Sequelize;

const exports = {};

const isBlank = (value) => !value || !String(value).trim();

const authPayload = (user, token) => ({
  userId: user.id,
  username: user.username,
  email: user.email,
  fName: user.fName,
  lName: user.lName,
  role: user.role,
  token,
});

const issueSession = async (user) => {
  const existing = await Session.findOne({
    where: {
      userId: user.id,
      expirationDate: { [Op.gt]: new Date() },
      token: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }] },
    },
  });

  if (existing) {
    return existing.token;
  }

  const token = jwt.sign({ id: user.id }, authConfig.secret, { expiresIn: 86400 });
  await Session.create({
    token,
    email: user.email,
    expirationDate: new Date(Date.now() + SESSION_MS),
    userId: user.id,
  });

  return token;
};

const bearerToken = (req) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" ? token : null;
};

exports.register = async (req, res) => {
  const fName = req.body.fName?.trim();
  const lName = req.body.lName?.trim();
  const email = req.body.email?.trim();
  const username = req.body.username?.trim().toLowerCase();
  const password = req.body.password;

  if (isBlank(req.body.fName)) {
    return res.status(400).send({ message: "First name is required." });
  }
  if (isBlank(req.body.lName)) {
    return res.status(400).send({ message: "Last name is required." });
  }
  if (isBlank(req.body.email)) {
    return res.status(400).send({ message: "Email is required." });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).send({ message: "Enter a valid email address." });
  }
  if (isBlank(req.body.username)) {
    return res.status(400).send({ message: "Username is required." });
  }
  if (isBlank(password)) {
    return res.status(400).send({ message: "Password is required." });
  }
  if (password.length < 8) {
    return res.status(400).send({ message: "Password must be at least 8 characters." });
  }

  try {
    const takenUsername = await User.findOne({ where: { username } });
    if (takenUsername) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const takenEmail = await User.findOne({ where: { email } });
    if (takenEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      fName,
      lName,
      email,
      username,
      password: hash,
      role: "worker",
    });

    const token = await issueSession(user);
    return res.status(201).send(authPayload(user, token));
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Unable to register." });
  }
};

exports.login = async (req, res) => {
  if (isBlank(req.body.username)) {
    return res.status(400).send({ message: "Username is required." });
  }
  if (isBlank(req.body.password)) {
    return res.status(400).send({ message: "Password is required." });
  }

  const username = req.body.username.trim().toLowerCase();
  const password = req.body.password;

  try {
    const user = await User.unscoped().findOne({ where: { username } });
    const passwordOk = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !passwordOk) {
      return res.status(401).send({ message: "Invalid username or password." });
    }

    const token = await issueSession(user);
    return res.status(200).send(authPayload(user, token));
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Unable to sign in." });
  }
};

exports.logout = async (req, res) => {
  const token = bearerToken(req);

  try {
    if (token) {
      await Session.update({ token: "" }, { where: { token } });
    }
    return res.send({ message: "You have been signed out." });
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Unable to sign out." });
  }
};

export default exports;
