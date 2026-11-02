import bcrypt from "bcryptjs";
import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleUserOrNull } from "../authorization/authorization.js";

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const { user: User, Sequelize } = db;
const { Op } = Sequelize;

const exports = {};

const isBlank = (value) => !value || !String(value).trim();

const userNotFoundMessage = (userId) => ({
  message: `User with id=${userId} not found.`,
});

const parseUserId = (value) => {
  const userId = parseInt(value, 10);
  return Number.isNaN(userId) ? null : userId;
};

const profilePayload = (user) => ({
  id: user.id,
  fName: user.fName,
  lName: user.lName,
  email: user.email,
  username: user.username,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

exports.findOne = async (req, res) => {
  try {
    const userId = parseUserId(req.params.id);
    if (userId === null) {
      return res.status(400).send({ message: "User id is invalid." });
    }

    const user = await getAccessibleUserOrNull(req, userId);
    if (!user) {
      return res.status(404).send(userNotFoundMessage(userId));
    }

    return res.send(profilePayload(user));
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Unable to load profile." });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = parseUserId(req.params.id);
    if (userId === null) {
      return res.status(400).send({ message: "User id is invalid." });
    }

    const accessible = await getAccessibleUserOrNull(req, userId);
    if (!accessible) {
      return res.status(404).send(userNotFoundMessage(userId));
    }

    const user = await User.unscoped().findByPk(userId);
    const password = req.body.password;
    if (!isBlank(password) && password.length < 8) {
      return res.status(400).send({ message: "Password must be at least 8 characters." });
    }

    if (isBlank(req.body.fName)) {
      return res.status(400).send({ message: "First name is required." });
    }
    if (isBlank(req.body.lName)) {
      return res.status(400).send({ message: "Last name is required." });
    }
    if (isBlank(req.body.email)) {
      return res.status(400).send({ message: "Email is required." });
    }
    if (isBlank(req.body.username)) {
      return res.status(400).send({ message: "Username is required." });
    }

    const fName = req.body.fName.trim();
    const lName = req.body.lName.trim();
    const email = req.body.email.trim();
    const username = req.body.username.trim().toLowerCase();

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).send({ message: "Enter a valid email address." });
    }

    const takenUsername = await User.findOne({
      where: { username, id: { [Op.ne]: user.id } },
    });
    if (takenUsername) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const takenEmail = await User.findOne({
      where: { email, id: { [Op.ne]: user.id } },
    });
    if (takenEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    user.fName = fName;
    user.lName = lName;
    user.email = email;
    user.username = username;

    if (!isBlank(password)) {
      user.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    await user.save();
    const refreshed = await User.findByPk(user.id);
    return res.send(profilePayload(refreshed));
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Unable to update profile." });
  }
};

export default exports;
