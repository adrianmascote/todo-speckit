import db from "../models/index.js";
import logger from "../config/logger.js";

try {
  await db.sequelize.sync({ alter: true });
  logger.info("Database schema synced (alter: true), including Feature 3 todos.");
} catch (error) {
  logger.error(`Database schema sync failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await db.sequelize.close();
}
