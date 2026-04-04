import { env } from "../config/env.js";

function requireAdminAuth(req, res, next) {
  const apiKey = req.header("x-admin-key");

  if (!apiKey || apiKey !== env.adminApiKey) {
    return res.status(401).json({
      error: "Unauthorized admin request"
    });
  }

  return next();
}

export { requireAdminAuth };
