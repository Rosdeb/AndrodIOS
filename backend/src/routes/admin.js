import { Router } from "express";

import { adminController } from "../controllers/adminController.js";
import { requireAdminAuth } from "../middleware/adminAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const adminRouter = Router();

adminRouter.use(requireAdminAuth);
adminRouter.get("/overview", asyncHandler(adminController.getOverview));
adminRouter.get("/countries", asyncHandler(adminController.getCountries));
adminRouter.get("/funnel", asyncHandler(adminController.getFunnel));
adminRouter.get("/features", asyncHandler(adminController.getFeatureUsage));
adminRouter.get("/activity", asyncHandler(adminController.getActivity));
adminRouter.get("/exports", asyncHandler(adminController.getExports));
adminRouter.get("/realtime", asyncHandler(adminController.getRealtime));

export { adminRouter };
