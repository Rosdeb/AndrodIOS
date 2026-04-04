import { Router } from "express";

import { publicController } from "../controllers/publicController.js";

const publicRouter = Router();

publicRouter.get("/presets", publicController.getPresets);
publicRouter.post("/projects", publicController.createProject);
publicRouter.get("/projects/:projectId", publicController.getProject);
publicRouter.patch("/projects/:projectId", publicController.updateProject);
publicRouter.get("/projects/:projectId/preview", publicController.getPreview);
publicRouter.post("/projects/:projectId/export", publicController.createExport);
publicRouter.post("/events", publicController.trackEvent);

export { publicRouter };
