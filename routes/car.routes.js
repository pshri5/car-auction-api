import { Router } from "express";
import {
  Createcar,
  UpdateCar,
  DeleteCarData,
  GetCarData
} from "../controllers/car.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();


router.post("/", authMiddleware, Createcar);
router.put("/:CarId",authMiddleware, UpdateCar);
router.get("/:CarId", authMiddleware, GetCarData);
router.delete("/:CarId", authMiddleware, DeleteCarData);

export default router;