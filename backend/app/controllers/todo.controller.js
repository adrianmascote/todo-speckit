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

    const todo = await db.todo.create({
      title,
      completed: false,
      listId: list.id,
      userId: req.user.id,
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
