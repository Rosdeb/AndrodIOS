import { Router } from "express";

import { adminController } from "../controllers/adminController.js";
import { requireAdminAuth } from "../middleware/adminAuth.js";

const adminRouter = Router();

adminRouter.use(requireAdminAuth);
adminRouter.get("/overview", adminController.getOverview);
adminRouter.get("/countries", adminController.getCountries);
adminRouter.get("/funnel", adminController.getFunnel);
adminRouter.get("/features", adminController.getFeatureUsage);
adminRouter.get("/activity", adminController.getActivity);
adminRouter.get("/exports", adminController.getExports);

export { adminRouter };
