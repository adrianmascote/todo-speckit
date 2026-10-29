import db from "../models/index.js";

const { session: Session, user: User } = db;

export const authenticate = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).send({ message: "Unauthorized! No token provided." });
  }

  try {
    const session = await Session.findOne({
      where: { token },
      include: [{ model: User, as: "user" }],
    });

    if (!session?.user) {
      return res.status(401).send({ message: "Unauthorized! Invalid token." });
    }

    if (new Date(session.expirationDate) < new Date()) {
      return res.status(401).send({ message: "Unauthorized! Token expired." });
    }

    req.user = {
      id: session.user.id,
      role: session.user.role,
    };

    return next();
  } catch {
    return res.status(401).send({ message: "Unauthorized!" });
  }
};
