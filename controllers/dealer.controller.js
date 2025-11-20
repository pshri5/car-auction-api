// /controllers/dealer.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Dealer } from "../models/dealer.model.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import {Auction} from "../models/auction.model.js"

// Register a new dealer
export const registerDealer = asyncHandler(async (req, res) => {
    const { dealerName, dealerEmail, dealerPassword } = req.body;
    
    if (!dealerName || !dealerEmail || !dealerPassword) {
        throw new apiError(400, "All fields are required");
    }
    
    // Check if dealer with email already exists
    const existingDealer = await Dealer.findOne({ dealerEmail });
    if (existingDealer) {
        throw new apiError(409, "Email is already registered");
    }
    
    // Create new dealer
    const dealer = await Dealer.create({
        dealerId: uuidv4(), // Generate unique dealer ID
        dealerName,
        dealerEmail,
        dealerPassword, // Will be hashed by pre-save hook in model
        auctions: []
    });
    
    // Generate tokens
    const accessToken = dealer.generateAccessToken();
    const refreshToken = dealer.generateRefreshToken();
    
    // Remove password from response
    const createdDealer = await Dealer.findById(dealer._id).select("-dealerPassword");
    
    // Set cookies
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };
    
    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiResponse(
                201,
                {
                    dealer: createdDealer,
                    accessToken
                },
                "Dealer registered successfully"
            )
        );
});

// Login dealer
export const loginDealer = asyncHandler(async (req, res) => {
    const { dealerEmail, dealerPassword } = req.body;
    
    if (!dealerEmail || !dealerPassword) {
        throw new apiError(400, "Email and password are required");
    }
    
    // Find dealer
    const dealer = await Dealer.findOne({ dealerEmail });
    if (!dealer) {
        throw new apiError(404, "Dealer not found");
    }
    
    // Verify password
    const isPasswordValid = await dealer.isPasswordCorrect(dealerPassword);
    if (!isPasswordValid) {
        throw new apiError(401, "Invalid credentials");
    }
    
    // Generate tokens
    const accessToken = dealer.generateAccessToken();
    const refreshToken = dealer.generateRefreshToken();
    
    // Remove password from response
    const loggedInDealer = await Dealer.findById(dealer._id).select("-dealerPassword");
    
    // Set cookies
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };
    
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiResponse(
                200,
                {
                    dealer: loggedInDealer,
                    accessToken
                },
                "Dealer logged in successfully"
            )
        );
});

// Logout dealer
export const logoutDealer = asyncHandler(async (req, res) => {
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };
    
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new apiResponse(200, {}, "Dealer logged out successfully")
        );
});

// Get dealer profile
export const getDealerProfile = asyncHandler(async (req, res) => {
    const dealer = await Dealer.findById(req.dealer._id)
        .select("-dealerPassword")
        .populate("auctions");
    
    if (!dealer) {
        throw new apiError(404, "Dealer not found");
    }
    
    return res
        .status(200)
        .json(
            new apiResponse(200, { dealer }, "Dealer profile fetched successfully")
        );
});

// Update dealer profile
export const updateDealerProfile = asyncHandler(async (req, res) => {
    const { dealerName } = req.body;
    
    if (!dealerName) {
        throw new apiError(400, "Dealer name is required");
    }
    
    const updatedDealer = await Dealer.findByIdAndUpdate(
        req.dealer._id,
        { dealerName },
        { new: true }
    ).select("-dealerPassword");
    
    if (!updatedDealer) {
        throw new apiError(404, "Dealer not found");
    }
    
    return res
        .status(200)
        .json(
            new apiResponse(200, { dealer: updatedDealer }, "Dealer profile updated successfully")
        );
});

// Get dealer auctions
export const getDealerAuctions = asyncHandler(async (req, res) => {
    const dealer = await Dealer.findById(req.dealer._id)
        .populate({
            path: "auctions",
            populate: {
                path: "carId",
                model: "Car"
            }
        });
    
    if (!dealer) {
        throw new apiError(404, "Dealer not found");
    }
    
    return res
        .status(200)
        .json(
            new apiResponse(200, { auctions: dealer.auctions }, "Dealer auctions fetched successfully")
        );
});

// Join auction (add auction to dealer's list)
export const joinAuction = asyncHandler(async (req, res) => {
    const { auctionId } = req.params;
    
    // Check if auction exists
    const auction = await Auction.findById(auctionId);
    if (!auction) {
        throw new apiError(404, "Auction not found");
    }
    
    // Check if auction is active
    if (auction.status !== "Active") {
        throw new apiError(400, "Can only join active auctions");
    }
    
    // Check if dealer already joined
    const dealer = await Dealer.findById(req.dealer._id);
    if (dealer.auctions.includes(auctionId)) {
        throw new apiError(409, "Already joined this auction");
    }
    
    // Add auction to dealer's list
    const updatedDealer = await Dealer.findByIdAndUpdate(
        req.dealer._id,
        { $push: { auctions: auctionId } },
        { new: true }
    ).select("-dealerPassword");
    
    return res
        .status(200)
        .json(
            new apiResponse(200, { dealer: updatedDealer }, "Successfully joined auction")
        );
});