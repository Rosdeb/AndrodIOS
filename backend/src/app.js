import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "./config/env.js";
import { adminRouter } from "./routes/admin.js";
import { publicRouter } from "./routes/public.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const websiteDirectory = path.resolve(__dirname, "../../website");
const adminDirectory = path.resolve(__dirname, "../../admin");

app.use(express.json({ limit: "10mb" }));
app.use("/website", express.static(websiteDirectory));
app.use("/admin", express.static(adminDirectory));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    app: "IconForge Studio Backend",
    environment: env.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

app.use("/api/public", publicRouter);
app.use("/api/admin", adminRouter);

app.get("/", (_req, res) => {
  res.sendFile(path.join(websiteDirectory, "index.html"));
});

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(adminDirectory, "index.html"));
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  return res.sendFile(path.join(websiteDirectory, "index.html"));
});

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path
  });
});

app.use((err, _req, res, _next) => {
  const status = err.statusCode || 500;

  console.error("Backend request failed", {
    status,
    message: err.message,
    stack: err.stack
  });

  res.status(status).json({
    error: err.message || "Internal server error"
  });
});

export { app };
