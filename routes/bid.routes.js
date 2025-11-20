import { Router } from "express";
import {
    placeBid,
    getBidsForAuction,
    getDealerBids,
    getHighestBid,
    updateBid,
    deleteBid,
    getBidById
} from "../controllers/bid.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();


router.post("/", authMiddleware, placeBid);
router.get("/auction/:auctionId", getBidsForAuction);
router.get("/dealer", authMiddleware, getDealerBids);
router.get("/auction/:auctionId/highest", getHighestBid);
router.get("/:bidId", getBidById);
router.patch("/:bidId", authMiddleware, updateBid);
router.delete("/:bidId", authMiddleware, deleteBid);

export default router;