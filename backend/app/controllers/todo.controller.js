import db from "../models/index.js";
import logger from "../config/logger.js";
import {
  getAccessibleListOrNull,
  getAccessibleTodoOrNull,
} from "../authorization/authorization.js";

const exports = {};

const listNotFoundMessage = (listId) => ({
  message: `List with id=${listId} not found.`,
});

const todoNotFoundMessage = (todoId) => ({
  message: `Todo with id=${todoId} not found.`,
});

const parseId = (value) => {
  const id = parseInt(value, 10);
  return Number.isNaN(id) ? null : id;
};

const validateTodoTitle = (body) => {
  const title = typeof body?.title === "string" ? body.title.trim() : "";

  if (!title) {
    return { error: { message: "Todo title is required." } };
  }

  if (title.length > 255) {
    return { error: { message: "Todo title must be 255 characters or fewer." } };
  }

  return { title };
};

const DUE_DATE_MESSAGE = "Due date must be a valid date in YYYY-MM-DD format.";

const parseDueDate = (value) => {
  if (value === null) {
    return { dueDate: null };
  }

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { error: { message: DUE_DATE_MESSAGE } };
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return { error: { message: DUE_DATE_MESSAGE } };
  }

  return { dueDate: value };
};

exports.findAllForList = async (req, res) => {
  try {
    const listId = parseId(req.params.listId);
    if (listId === null) {
      return res.status(400).send({ message: "List id is invalid." });
    }

    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send(listNotFoundMessage(listId));
    }

    const todos = await db.todo.findAll({
      where: { listId, userId: req.user.id },
      order: [
        ["completed", "ASC"],
        ["createdAt", "ASC"],
      ],
    });
    return res.send(todos);
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Unable to load todos." });
  }
};

exports.create = async (req, res) => {
  try {
    const listId = parseId(req.params.listId);
    if (listId === null) {
      return res.status(400).send({ message: "List id is invalid." });
    }

    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send(listNotFoundMessage(listId));
    }

    const { title, error } = validateTodoTitle(req.body);
    if (error) {
      return res.status(400).send(error);
    }

    let dueDate = null;
    if (Object.prototype.hasOwnProperty.call(req.body, "dueDate")) {
      const parsed = parseDueDate(req.body.dueDate);
      if (parsed.error) {
        return res.status(400).send(parsed.error);
      }
      dueDate = parsed.dueDate;
    }

    const todo = await db.todo.create({
      title,
      completed: false,
      listId: list.id,
      userId: req.user.id,
      dueDate,
    });
    return res.status(201).send(todo);
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Unable to create todo." });
  }
};

exports.update = async (req, res) => {
  try {
    const todoId = parseId(req.params.id);
    if (todoId === null) {
      return res.status(400).send({ message: "Todo id is invalid." });
    }

    const todo = await getAccessibleTodoOrNull(req, todoId);
    if (!todo) {
      return res.status(404).send(todoNotFoundMessage(todoId));
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
      const { title, error } = validateTodoTitle(req.body);
      if (error) {
        return res.status(400).send(error);
      }
      todo.title = title;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "completed")) {
      todo.completed = Boolean(req.body.completed);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "dueDate")) {
      const parsed = parseDueDate(req.body.dueDate);
      if (parsed.error) {
        return res.status(400).send(parsed.error);
      }
      todo.dueDate = parsed.dueDate;
    }

    await todo.save();
    return res.send(todo);
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Unable to update todo." });
  }
};

exports.delete = async (req, res) => {
  try {
    const todoId = parseId(req.params.id);
    if (todoId === null) {
      return res.status(400).send({ message: "Todo id is invalid." });
    }

    const todo = await getAccessibleTodoOrNull(req, todoId);
    if (!todo) {
      return res.status(404).send(todoNotFoundMessage(todoId));
    }

    await todo.destroy();
    return res.status(200).send(todo);
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Unable to delete todo." });
  }
};

export default exports;
