// /routes/dealer.routes.js
import { Router } from "express";
import {
    registerDealer,
    loginDealer,
    logoutDealer,
    getDealerProfile,
    updateDealerProfile,
    getDealerAuctions,
    joinAuction
} from "../controllers/dealer.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Public routes
router.post("/register", registerDealer);
router.post("/login", loginDealer);

// Protected routes
router.post("/logout", authMiddleware, logoutDealer);
router.get("/profile", authMiddleware, getDealerProfile);
router.patch("/profile", authMiddleware, updateDealerProfile);
router.get("/auctions", authMiddleware, getDealerAuctions);
router.post("/auctions/:auctionId/join", authMiddleware, joinAuction);

export default router;