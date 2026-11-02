import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleListOrNull } from "../authorization/authorization.js";

const exports = {};

const listNotFoundMessage = (listId) => ({
  message: `List with id=${listId} not found.`,
});

const parseListId = (value) => {
  const listId = parseInt(value, 10);
  return Number.isNaN(listId) ? null : listId;
};

const validateListName = (body) => {
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return { error: { message: "List name is required." } };
  }

  if (name.length > 100) {
    return { error: { message: "List name must be 100 characters or fewer." } };
  }

  return { name };
};

exports.findAll = async (req, res) => {
  try {
    const lists = await db.list.findAll({
      where: { userId: req.user.id },
      order: [["name", "ASC"]],
    });
    return res.send(lists);
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Unable to load lists." });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, error } = validateListName(req.body);
    if (error) {
      return res.status(400).send(error);
    }

    const list = await db.list.create({
      name,
      userId: req.user.id,
    });
    return res.status(201).send(list);
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Unable to create list." });
  }
};

exports.update = async (req, res) => {
  try {
    const listId = parseListId(req.params.listId);
    if (listId === null) {
      return res.status(400).send({ message: "List id is invalid." });
    }

    const { name, error } = validateListName(req.body);
    if (error) {
      return res.status(400).send(error);
    }

    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send(listNotFoundMessage(listId));
    }

    list.name = name;
    await list.save();
    return res.send(list);
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Unable to update list." });
  }
};

exports.delete = async (req, res) => {
  try {
    const listId = parseListId(req.params.listId);
    if (listId === null) {
      return res.status(400).send({ message: "List id is invalid." });
    }

    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send(listNotFoundMessage(listId));
    }

    await db.todo.destroy({ where: { listId: list.id, userId: req.user.id } });
    await list.destroy();
    return res.status(200).send(list);
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Unable to delete list." });
  }
};

export default exports;
