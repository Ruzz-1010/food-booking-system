// ILAGAY MO ITO SA: backend/routes/location.js
import express from "express";
import auth from "../middleware/auth.js";
import { updateRiderLocation, getOrderLocations } from "../controllers/locationController.js";

const router = express.Router();

router.post("/rider", auth, updateRiderLocation);
router.get("/order/:orderId", auth, getOrderLocations);

export default router;