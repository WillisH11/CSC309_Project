#!/usr/bin/env node
'use strict';

const port = (() => {
    const args = process.argv;

    if (args.length !== 3) {
        console.error("usage: node index.js port");
        process.exit(1);
    }

    const num = parseInt(args[2], 10);
    if (isNaN(num)) {
        console.error("error: argument must be an integer.");
        process.exit(1);
    }

    return num;
})();

const express = require("express");
const cors = require("cors");
const { expressjwt: expressjwt } = require("express-jwt");
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');


try {
    require('dotenv').config();
} catch (e) {

}

const app = express();
const prisma = new PrismaClient();

// Check for JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("Error: JWT_SECRET environment variable is not set");
    process.exit(1);
}

// Middleware
app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true
}));
app.use(express.json());

// JWT Authentication Middleware 
const jwtMiddleware = expressjwt({
    secret: JWT_SECRET,
    algorithms: ["HS256"],
    requestProperty: "auth"
});

// Multer configuration 
const uploadDir = path.join(__dirname, "uploads", "avatars");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const filename = `${req.auth.utorid}${ext}`;
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } 
});

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.set('prisma', prisma);
app.set('upload', upload);
app.set('jwtMiddleware', jwtMiddleware);
app.set('JWT_SECRET', JWT_SECRET);

// Rate limiting for password resets 
const resetRateLimiter = new Map();

// Login
app.post('/auth/tokens', async (req, res) => {
    try {
        const { utorid, password } = req.body;

        if (!utorid || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Find user by utorid
        const user = await prisma.user.findUnique({
            where: { utorid }
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Compare password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate JWT token (expires in 7 days)
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const token = jwt.sign(
            {
                id: user.id,
                utorid: user.utorid,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Update lastLogin
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        res.json({ token, expiresAt: expiresAt.toISOString() });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Request password reset
app.post('/auth/resets', async (req, res) => {
    try {
        const { utorid } = req.body;

        if (!utorid) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // 60 secs between requests from same IP for same utorid
        const clientIp = req.ip;
        const rateLimitKey = `${clientIp}:${utorid}`;
        const lastRequest = resetRateLimiter.get(rateLimitKey);
        const now = Date.now();

        if (lastRequest && now - lastRequest < 60000) {
            return res.status(429).json({ error: "Too many requests" });
        }

        resetRateLimiter.set(rateLimitKey, now);

        // Find user by utorid
        const user = await prisma.user.findUnique({
            where: { utorid }
        });

        // Return 404 if user doesn't exist
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Generate reset token (expires in 1 hour)
        const resetToken = uuidv4();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        // Update user with reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                expiresAt
            }
        });

        res.status(202).json({
            expiresAt: expiresAt.toISOString(),
            resetToken
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Reset password
app.post('/auth/resets/:resetToken', async (req, res) => {
    try {
        const { resetToken } = req.params;
        const { utorid, password } = req.body;

        if (!utorid || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Validate password format (8-20 chars, 1 uppercase, lowercase, number, special char)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,20}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ error: "Invalid password format" });
        }

        // Find user by resetToken
        const user = await prisma.user.findFirst({
            where: {
                resetToken,
                NOT: {
                    resetToken: null
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: "Invalid reset token" });
        }

        // Check if utorid matches
        if (user.utorid !== utorid) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Check if token expired
        if (user.expiresAt && new Date() > new Date(user.expiresAt)) {
            return res.status(410).json({ error: "Reset token expired" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password and clear reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                expiresAt: null
            }
        });

        res.status(200).json({ message: "Password reset successful" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Register new user 
app.post('/users', jwtMiddleware, async (req, res) => {
    try {
        // Check authorization (Cashier+)
        if (!['cashier', 'manager', 'superuser'].includes(req.auth.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const { utorid, name, email } = req.body;

        // Validate required fields
        if (!utorid || !name || !email) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Validate utorid format (7-8 alphanumeric)
        if (!/^[a-zA-Z0-9]{7,8}$/.test(utorid)) {
            return res.status(400).json({ error: "Invalid utorid format" });
        }

        // Validate name length (1-50 characters)
        if (name.length < 1 || name.length > 50) {
            return res.status(400).json({ error: "Invalid name length" });
        }

        // Validate UofT email
        if (!email.endsWith('@mail.utoronto.ca') && !email.endsWith('@utoronto.ca')) {
            return res.status(400).json({ error: "Invalid email" });
        }

        // Generate reset token for activation (expires in 7 days)
        const resetToken = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Create user (no password yet)
        const user = await prisma.user.create({
            data: {
                utorid,
                name,
                email,
                password: '', // must be set during activation
                role: 'regular',
                verified: false,
                resetToken,
                expiresAt
            }
        });

        res.status(201).json({
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            email: user.email,
            role: user.role,
            verified: user.verified,
            expiresAt: user.expiresAt.toISOString(),
            resetToken: user.resetToken
        });

    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: "User already exists" });
        }
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get current user info
app.get('/users/me', jwtMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.auth.id },
            include: {
                promotionsUsed: {
                    select: {
                        promotionId: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Get available one-time promos (not used and active)
        const usedPromotionIds = user.promotionsUsed.map(p => p.promotionId);
        const now = new Date();

        const availablePromotions = await prisma.promotion.findMany({
            where: {
                type: 'onetime',
                startTime: { lte: now },
                endTime: { gte: now },
                id: { notIn: usedPromotionIds }
            },
            select: {
                id: true,
                name: true,
                minSpending: true,
                rate: true,
                points: true
            }
        });

        res.json({
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            email: user.email,
            birthday: user.birthday,
            role: user.role,
            points: user.points,
            createdAt: user.createdAt.toISOString(),
            lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
            verified: user.verified,
            avatarUrl: user.avatarUrl,
            promotions: availablePromotions
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update current user profile
// Conditional multer middleware - only apply for multipart/form-data
const conditionalUpload = (req, res, next) => {
    const contentType = req.get('content-type');
    if (contentType && contentType.includes('multipart/form-data')) {
        upload.single('avatar')(req, res, next);
    } else {
        next();
    }
};

app.patch('/users/me', jwtMiddleware, conditionalUpload, async (req, res) => {
    try {
        // Check for extra fields (avatar is allowed as it can be sent as file or in body)
        const allowedFields = ['name', 'email', 'birthday', 'avatar'];
        const requestFields = Object.keys(req.body);
        const extraFields = requestFields.filter(field => !allowedFields.includes(field));
        if (extraFields.length > 0) {
            return res.status(400).json({ error: "Invalid request body" });
        }

        const { name, email, birthday } = req.body;
        const updateData = {};

        // Validate and add fields to update
        if (name !== undefined && name !== null) {
            if (name.length < 1 || name.length > 50) {
                return res.status(400).json({ error: "Invalid name length" });
            }
            updateData.name = name;
        }

        if (email !== undefined && email !== null) {
            if (!email.endsWith('@mail.utoronto.ca') && !email.endsWith('@utoronto.ca')) {
                return res.status(400).json({ error: "Invalid email" });
            }
            updateData.email = email;
        }

        if (birthday !== undefined && birthday !== null) {
            // YYYY-MM-DD format validation
            if (typeof birthday !== 'string' ||
                !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(birthday)) {
                return res.status(400).json({ error: "Invalid birthday format" });
            }

            // Validate it's an actual valid date
            const [year, month, day] = birthday.split('-').map(Number);
            const date = new Date(year, month - 1, day);

            // Check if the date is valid and matches the input
            if (date.getFullYear() !== year ||
                date.getMonth() !== month - 1 ||
                date.getDate() !== day) {
                return res.status(400).json({ error: "Invalid birthday format" });
            }

            updateData.birthday = birthday;
        }

        // Handle avatar upload
        if (req.file) {
            updateData.avatarUrl = `/uploads/avatars/${req.file.filename}`;
        }

        // Check if at least one field is being updated
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: "No update fields provided" });
        }

        // Update user
        const user = await prisma.user.update({
            where: { id: req.auth.id },
            data: updateData
        });

        res.json({
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            email: user.email,
            birthday: user.birthday,
            role: user.role,
            points: user.points,
            createdAt: user.createdAt.toISOString(),
            lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
            verified: user.verified,
            avatarUrl: user.avatarUrl
        });

    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Email already in use" });
        }
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Change logged in user's password
app.patch('/users/me/password', jwtMiddleware, async (req, res) => {
    try {
        const { old: oldPassword, new: newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Validate new password (8-20 chars, 1 uppercase, lowercase, number, special char)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,20}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ error: "Invalid password format" });
        }

        // Get current user
        const user = await prisma.user.findUnique({
            where: { id: req.auth.id }
        });

        // Verify old password
        const validPassword = await bcrypt.compare(oldPassword, user.password);
        if (!validPassword) {
            return res.status(403).json({ error: "Invalid current password" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: req.auth.id },
            data: { password: hashedPassword }
        });

        res.status(200).json({ message: "Password updated successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Lookup recipient by UTORid (Regular users ARE allowed)
app.get("/users/find", jwtMiddleware, async (req, res) => {
    const { utorid } = req.query;

    if (!utorid) {
        return res.status(400).json({ error: "Missing utorid" });
    }

    const user = await prisma.user.findUnique({
        where: { utorid },
        select: { id: true, utorid: true, name: true }
    });

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
});


app.get("/users/search-transfer", jwtMiddleware, async (req, res) => {
    const { utorid } = req.query;

    if (!utorid) return res.status(400).json({ error: "Missing UTORid" });

    const user = await prisma.user.findUnique({
        where: { utorid },
        select: { id: true, utorid: true, name: true }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
});



// List users 
app.get('/users', jwtMiddleware, async (req, res) => {
    try {
        // Check authorization (Manager+)
        if (!['manager', 'superuser'].includes(req.auth.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const { name, role, verified, activated, page = 1, limit = 10 } = req.query;

        // Build where clause
        const where = {};

        if (name) {
            where.OR = [
                { utorid: { contains: name } },
                { name: { contains: name } }
            ];
        }

        if (role) {
            where.role = role;
        }

        if (verified !== undefined) {
            where.verified = verified === 'true';
        }

        if (activated !== undefined) {
            if (activated === 'true') {
                where.lastLogin = { not: null };
            } else {
                where.lastLogin = null;
            }
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        // Validate page and limit
        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({ error: "Invalid page parameter" });
        }
        if (isNaN(limitNum) || limitNum < 1) {
            return res.status(400).json({ error: "Invalid limit parameter" });
        }

        const skip = (pageNum - 1) * limitNum;

        // Get total count
        const count = await prisma.user.count({ where });

        // Get users
        const users = await prisma.user.findMany({
            where,
            skip,
            take: limitNum,
            select: {
                id: true,
                utorid: true,
                name: true,
                email: true,
                birthday: true,
                role: true,
                points: true,
                createdAt: true,
                lastLogin: true,
                verified: true,
                avatarUrl: true
            }
        });

        // Format response
        const results = users.map(user => ({
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            email: user.email,
            birthday: user.birthday,
            role: user.role,
            points: user.points,
            createdAt: user.createdAt.toISOString(),
            lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
            verified: user.verified,
            avatarUrl: user.avatarUrl
        }));

        res.json({ count, results });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get specific user
app.get('/users/:userId', jwtMiddleware, async (req, res) => {
    try {
        // Check authorization (Cashier+)
        if (!['cashier', 'manager', 'superuser'].includes(req.auth.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const userId = parseInt(req.params.userId);

        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                promotionsUsed: {
                    select: {
                        promotionId: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Get available one-time promos for this user
        const usedPromotionIds = user.promotionsUsed.map(p => p.promotionId);
        const now = new Date();

        const availablePromotions = await prisma.promotion.findMany({
            where: {
                type: 'onetime',
                startTime: { lte: now },
                endTime: { gte: now },
                id: { notIn: usedPromotionIds }
            },
            select: {
                id: true,
                name: true,
                minSpending: true,
                rate: true,
                points: true
            }
        });

        // Cashier view
        if (req.auth.role === 'cashier') {
            return res.json({
                id: user.id,
                utorid: user.utorid,
                name: user.name,
                points: user.points,
                verified: user.verified,
                suspicious: user.suspicious,
                promotions: availablePromotions
            });
        }

        // Manager+ view
        res.json({
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            email: user.email,
            birthday: user.birthday,
            role: user.role,
            points: user.points,
            createdAt: user.createdAt.toISOString(),
            lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
            verified: user.verified,
            suspicious: user.suspicious,
            avatarUrl: user.avatarUrl,
            promotions: availablePromotions
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update user
app.patch('/users/:userId', jwtMiddleware, async (req, res) => {
    try {
        // Check authorization (Manager+)
        if (!['manager', 'superuser'].includes(req.auth.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const userId = parseInt(req.params.userId);

        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        // Look up user by ID
        const targetUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!targetUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const { verified, suspicious, role, email } = req.body;
        const updateData = {};

        // Only allow updating these specific fields
        if (verified !== undefined && verified !== null) {
            if (verified !== true) {
                return res.status(400).json({ error: "Invalid verified value" });
            }
            updateData.verified = verified;
        }

        if (suspicious !== undefined && suspicious !== null) {
            if (typeof suspicious !== 'boolean') {
                return res.status(400).json({ error: "Invalid suspicious value" });
            }
            updateData.suspicious = suspicious;
        }

        if (role !== undefined && role !== null) {
            // Validate role based on requester's role
            if (req.auth.role === 'manager') {
                // Managers can only set cashier or regular
                if (!['regular', 'cashier'].includes(role)) {
                    return res.status(403).json({ error: "Managers can only set regular or cashier roles" });
                }
            } else if (req.auth.role === 'superuser') {
                // Superusers can set any role
                if (!['regular', 'cashier', 'manager', 'superuser'].includes(role)) {
                    return res.status(400).json({ error: "Invalid role" });
                }
            }
            updateData.role = role;
        }

        if (email !== undefined && email !== null) {
            // Validate UofT email
            if (!email.endsWith('@mail.utoronto.ca') && !email.endsWith('@utoronto.ca')) {
                return res.status(400).json({ error: "Invalid email" });
            }
            updateData.email = email;
        }

        // Check if at least one field is being updated
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: "No update fields provided" });
        }

        // Update user
        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        // Build response with only updated fields (plus id, utorid, name always)
        const response = {
            id: user.id,
            utorid: user.utorid,
            name: user.name
        };

        // Add only the fields that were actually updated
        if ('verified' in updateData) {
            response.verified = user.verified;
        }
        if ('suspicious' in updateData) {
            response.suspicious = user.suspicious;
        }
        if ('role' in updateData) {
            response.role = user.role;
        }
        if ('email' in updateData) {
            response.email = user.email;
        }

        res.json(response);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// TRANSACTIONS

// Cashier: Get pending redemption requests
app.get('/transactions/redemption/pending', jwtMiddleware, async (req, res) => {
    try {
        if (!['cashier', 'manager', 'superuser'].includes(req.auth.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const pending = await prisma.transaction.findMany({
            where: {
                type: "redemption",
                relatedId: null
            },
            include: {
                user: {
                    select: { utorid: true, name: true }
                },
                createdBy: {
                    select: { utorid: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        res.json({ results: pending });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});


// Create purchase or adjustment transaction
app.post('/transactions', jwtMiddleware, async (req, res) => {
    try {
        const { type, utorid, spent, amount, remark, promotionIds, relatedId } = req.body;

        // Validate type
        if (!['purchase', 'adjustment'].includes(type)) {
            return res.status(400).json({ error: "Invalid transaction type" });
        }

        // Check authorization for purchase (cashier+)
        if (type === 'purchase' && !['cashier', 'manager', 'superuser'].includes(req.auth.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        // Check authorization for adjustment (manager+)
        if (type === 'adjustment' && !['manager', 'superuser'].includes(req.auth.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        // Validate utorid
        if (!utorid || typeof utorid !== 'string') {
            return res.status(400).json({ error: "Invalid utorid" });
        }

        // Check user exists
        const user = await prisma.user.findUnique({
            where: { utorid: utorid },
            select: {
                id: true,
                utorid: true,
                points: true,
                suspicious: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        let pointsToAdd = 0;
        let spentAmount = null;
        let appliedPromotions = [];
        let isSuspiciousTransaction = false;

        if (type === 'purchase') {
            // Check if cashier is suspicious
            const cashier = await prisma.user.findUnique({
                where: { id: req.auth.id },
                select: { suspicious: true }
            });

            // Transaction is suspicious if either cashier or user is suspicious
            isSuspiciousTransaction = (cashier && cashier.suspicious) || user.suspicious;

            // Validate spent amount
            if (!spent || spent <= 0) {
                return res.status(400).json({ error: "Invalid spent amount" });
            }

            spentAmount = parseFloat(spent);

            // 1 point per 25 cents 
            pointsToAdd = Math.round(spentAmount * 100 / 25);

            // Check for active automatic promotions
            const now = new Date();
            const activePromotions = await prisma.promotion.findMany({
                where: {
                    type: 'automatic',
                    startTime: { lte: now },
                    endTime: { gte: now },
                    OR: [
                        { minSpending: null },
                        { minSpending: { lte: spentAmount } }
                    ]
                }
            });

            // Apply automatic promotions
            for (const promo of activePromotions) {
                if (promo.rate) {
                    const bonusPoints = Math.floor(spentAmount * promo.rate);
                    pointsToAdd += bonusPoints;
                    appliedPromotions.push(promo.id);
                }
            }

            // Apply manually specified one-time promotions
            if (promotionIds && Array.isArray(promotionIds) && promotionIds.length > 0) {
                // Fetch the promotions
                const onetimePromotions = await prisma.promotion.findMany({
                    where: {
                        id: { in: promotionIds },
                        type: 'onetime',
                        startTime: { lte: now },
                        endTime: { gte: now }
                    }
                });

                // Check if all wanted promotions exist and are valid
                if (onetimePromotions.length !== promotionIds.length) {
                    return res.status(400).json({ error: "One or more promotion IDs are invalid" });
                }

                // Check if user has already used some promotions
                const existingUsage = await prisma.promotionUsage.findMany({
                    where: {
                        userId: user.id,
                        promotionId: { in: promotionIds }
                    }
                });

                if (existingUsage.length > 0) {
                    return res.status(400).json({ error: "User has already used one or more of these promotions" });
                }

                // Apply one-time promotions
                for (const promo of onetimePromotions) {
                    // Check minimum spending req
                    if (promo.minSpending && spentAmount < promo.minSpending) {
                        return res.status(400).json({
                            error: `Minimum spending of $${promo.minSpending} required for promotion "${promo.name}"`
                        });
                    }

                    // Add bonus points
                    if (promo.points) {
                        pointsToAdd += promo.points;
                        appliedPromotions.push(promo.id);
                    }
                }
            }

        } else if (type === 'adjustment') {
            // Validate amount
            if (amount === undefined || amount === null || isNaN(amount)) {
                return res.status(400).json({ error: "Invalid amount" });
            }

            pointsToAdd = parseInt(amount);

            // Validate relatedId
            if (!relatedId || isNaN(parseInt(relatedId))) {
                return res.status(400).json({ error: "Invalid or missing relatedId" });
            }

            // Check if the related transaction exists
            const relatedTransaction = await prisma.transaction.findUnique({
                where: { id: parseInt(relatedId) }
            });

            if (!relatedTransaction) {
                return res.status(404).json({ error: "Related transaction not found" });
            }
        }

        // Create transaction and update user points in a transaction
        const transaction = await prisma.$transaction(async (prisma) => {
            // Create transaction
            const newTransaction = await prisma.transaction.create({
                data: {
                    type,
                    userId: user.id,
                    amount: isSuspiciousTransaction ? 0 : pointsToAdd,
                    spent: spentAmount,
                    suspicious: isSuspiciousTransaction,
                    remark: remark || '',
                    createdById: req.auth.id,
                    relatedId: relatedId ? parseInt(relatedId) : null
                }
            });

            // Link promotions 
            if (appliedPromotions.length > 0) {
                await prisma.transactionPromotion.createMany({
                    data: appliedPromotions.map(promoId => ({
                        transactionId: newTransaction.id,
                        promotionId: promoId
                    }))
                });

                // Track usage for one-time promotions
                if (promotionIds && Array.isArray(promotionIds) && promotionIds.length > 0) {
                    await prisma.promotionUsage.createMany({
                        data: promotionIds.map(promoId => ({
                            promotionId: promoId,
                            userId: user.id
                        }))
                    });
                }
            }

            // Only award points if transaction is not suspicious
            // Suspicious transactions require manager verification before points are awarded
            if (!isSuspiciousTransaction) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        points: {
                            increment: pointsToAdd
                        }
                    }
                });
            }

            return newTransaction;
        });

        // Fetch applied promotion IDs for response
        const transactionPromotions = await prisma.transactionPromotion.findMany({
            where: { transactionId: transaction.id },
            select: { promotionId: true }
        });
        const promotionIdList = transactionPromotions
            .map(tp => tp.promotionId)
            .filter(id => typeof id === 'number');

        // Fetch creator's utorid
        const creator = await prisma.user.findUnique({
            where: { id: transaction.createdById },
            select: { utorid: true }
        });

        const response = {
            id: transaction.id,
            type: transaction.type,
            utorid: user.utorid,
            spent: transaction.spent,
            promotionIds: promotionIdList,
            remark: transaction.remark,
            createdBy: creator.utorid,
            createdAt: transaction.createdAt.toISOString()
        };

        // For purchase transactions, use 'earned' field
        // For adjustment transactions, use 'amount' field and include relatedId
        if (transaction.type === 'purchase') {
            response.earned = transaction.amount;
        } else if (transaction.type === 'adjustment') {
            response.amount = transaction.amount;
            response.relatedId = transaction.relatedId;
        }

        res.status(201).json(response);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// List all transactions 
app.get('/transactions', jwtMiddleware, async (req, res) => {
    try {
        // Check authorization (Manager+)
        if (!['manager', 'superuser'].includes(req.auth.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        // Parse query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Validate pagination parameters
        if (req.query.page !== undefined && (isNaN(page) || page < 1)) {
            return res.status(400).json({ error: "Invalid page parameter" });
        }
        if (req.query.limit !== undefined && (isNaN(limit) || limit < 1)) {
            return res.status(400).json({ error: "Invalid limit parameter" });
        }

        const skip = (page - 1) * limit;

        // Build filters
        const where = {};

        if (req.query.userId) {
            where.userId = parseInt(req.query.userId);
        }

        if (req.query.type) {
            where.type = req.query.type;
        }

        if (req.query.suspicious !== undefined) {
            where.suspicious = req.query.suspicious === 'true';
        }

        // Get transactions with related data
        const [transactions, count] = await Promise.all([
            prisma.transaction.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            utorid: true,
                            name: true
                        }
                    },
                    createdBy: {
                        select: {
                            id: true,
                            utorid: true,
                            name: true
                        }
                    }
                }
            }),
            prisma.transaction.count({ where })
        ]);

        res.json({
            count,
            results: transactions.map(t => ({
                id: t.id,
                type: t.type,
                user: {
                    id: t.user.id,
                    utorid: t.user.utorid,
                    name: t.user.name
                },
                amount: t.amount,
                spent: t.spent,
                redeemed: t.redeemed,
                relatedId: t.relatedId,
                suspicious: t.suspicious,
                remark: t.remark,
                createdBy: {
                    id: t.createdBy.id,
                    utorid: t.createdBy.utorid,
                    name: t.createdBy.name
                },
                createdAt: t.createdAt.toISOString()
            }))
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get specific transaction
app.get('/transactions/:transactionId', jwtMiddleware, async (req, res) => {
    try {
        // Check authorization (Manager+)
        if (!['manager', 'superuser'].includes(req.auth.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const transactionId = parseInt(req.params.transactionId);

        if (isNaN(transactionId)) {
            return res.status(400).json({ error: "Invalid transaction ID" });
        }

        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                user: {
                    select: {
                        id: true,
                        utorid: true,
                        name: true,
                        email: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        utorid: true,
                        name: true
                    }
                },
                promotions: {
                    include: {
                        promotion: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                rate: true,
                                points: true
                            }
                        }
                    }
                }
            }
        });

        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        // Regular users can only view their transactions
        if (req.auth.role === 'regular' && transaction.userId !== req.auth.id) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const promotionIdList = transaction.promotions
            .map(tp => tp.promotionId)
            .filter(id => typeof id === 'number');

        res.json({
            id: transaction.id,
            type: transaction.type,
            user: transaction.user,
            amount: transaction.amount,
            spent: transaction.spent,
            redeemed: transaction.redeemed,
            relatedId: transaction.relatedId,
            suspicious: transaction.suspicious,
            remark: transaction.remark,
            createdBy: transaction.createdBy,
            createdAt: transaction.createdAt.toISOString(),
            promotionIds: promotionIdList,
            promotions: transaction.promotions.map(tp => tp.promotion)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Flag transaction as suspicious 
app.patch('/transactions/:transactionId/suspicious', jwtMiddleware, async (req, res) => {
    try {
        // Check authorization (Manager+)
        if (!['manager', 'superuser'].includes(req.auth.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const transactionId = parseInt(req.params.transactionId);

        if (isNaN(transactionId)) {
            return res.status(400).json({ error: "Invalid transaction ID" });
        }

        const { suspicious } = req.body;

        if (typeof suspicious !== 'boolean') {
            return res.status(400).json({ error: "Invalid suspicious value" });
        }

        // Get transaction
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId }
        });

        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        // Update transaction and handle points/suspicious user marking
        await prisma.$transaction(async (prisma) => {
            // Update transaction
            await prisma.transaction.update({
                where: { id: transactionId },
                data: { suspicious }
            });

            // If verifying a suspicious transaction (setting suspicious to false),
            // award the originally earned points to the user
            if (!suspicious && transaction.suspicious) {
                const earnedPoints = transaction.spent !== null
                    ? Math.round(transaction.spent * 100 / 25)
                    : transaction.amount;

                await prisma.transaction.update({
                    where: { id: transactionId },
                    data: {
                        amount: earnedPoints
                    }
                });

                await prisma.user.update({
                    where: { id: transaction.userId },
                    data: {
                        points: {
                            increment: earnedPoints
                        }
                    }
                });
            }

            // If flagging as suspicious, also mark the cashier who created it as suspicious
            if (suspicious && !transaction.suspicious) {
                await prisma.user.update({
                    where: { id: transaction.createdById },
                    data: { suspicious: true }
                });
            }
        });

        // Fetch the updated transaction with related data
        const updatedTransaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                user: {
                    select: {
                        utorid: true
                    }
                },
                createdBy: {
                    select: {
                        utorid: true
                    }
                },
                promotions: {
                    select: {
                        promotionId: true
                    }
                }
            }
        });

        const promotionIdList = updatedTransaction.promotions
            .map(p => p.promotionId)
            .filter(id => typeof id === 'number');

        // Format response based on transaction type
        const response = {
            id: updatedTransaction.id,
            utorid: updatedTransaction.user.utorid,
            type: updatedTransaction.type,
            amount: updatedTransaction.amount,
            promotionIds: promotionIdList,
            suspicious: updatedTransaction.suspicious,
            remark: updatedTransaction.remark,
            createdBy: updatedTransaction.createdBy.utorid
        };

        // Add type-specific fields
        if (updatedTransaction.type === 'purchase') {
            response.spent = updatedTransaction.spent;
        }

        res.json(response);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// Process redemption 
app.patch('/transactions/:transactionId/processed', jwtMiddleware, async (req, res) => {
    try {
        // Check authorization (Cashier+)
        if (!['cashier', 'manager', 'superuser'].includes(req.auth.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const transactionId = parseInt(req.params.transactionId);

        if (isNaN(transactionId)) {
            return res.status(400).json({ error: "Invalid transaction ID" });
        }

        // Get transaction
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId }
        });

        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        // Verify it's a redemption 
        if (transaction.type !== 'redemption') {
            return res.status(400).json({ error: "Only redemption transactions can be processed" });
        }

        // Check if redemption is already processed
        if (transaction.relatedId !== null) {
            return res.status(400).json({ error: "Redemption already processed" });
        }

        // Deduct points from user and mark as processed
        await prisma.$transaction(async (prisma) => {
            // Update transaction to mark as processed
            await prisma.transaction.update({
                where: { id: transactionId },
                data: {
                    amount: -transaction.redeemed,
                    relatedId: req.auth.id
                }
            });

            // Deduct points from user
            await prisma.user.update({
                where: { id: transaction.userId },
                data: {
                    points: {
                        decrement: transaction.redeemed
                    }
                }
            });
        });

        // Fetch user and processor info for response
        const [user, processor, creator] = await Promise.all([
            prisma.user.findUnique({ where: { id: transaction.userId }, select: { utorid: true } }),
            prisma.user.findUnique({ where: { id: req.auth.id }, select: { utorid: true } }),
            prisma.user.findUnique({ where: { id: transaction.createdById }, select: { utorid: true } })
        ]);

        res.json({
            id: transaction.id,
            utorid: user.utorid,
            type: transaction.type,
            processedBy: processor.utorid,
            redeemed: transaction.redeemed,
            remark: transaction.remark,
            createdBy: creator.utorid
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Create redemption transaction
app.post('/users/me/transactions', jwtMiddleware, async (req, res) => {
    try {
        const { amount, remark } = req.body;

        // Validate amount
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: "Invalid amount" });
        }

        const redeemPoints = parseInt(amount);

        // Get current user
        const user = await prisma.user.findUnique({
            where: { id: req.auth.id }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check user is verified
        if (!user.verified) {
            return res.status(403).json({ error: "User must be verified to redeem points" });
        }

        // Check user has enough points
        if (user.points < redeemPoints) {
            return res.status(400).json({ error: "Insufficient points" });
        }

        // Create redemption transaction
        const transaction = await prisma.transaction.create({
            data: {
                type: 'redemption',
                userId: user.id,
                amount: 0, // Will set to negative after processed by cashier
                redeemed: redeemPoints,
                relatedId: null, // Will set to cashier ID when processed
                remark: remark || 'Point redemption',
                createdById: req.auth.id
            }
        });

        res.status(201).json({
            id: transaction.id,
            utorid: user.utorid,
            type: transaction.type,
            processedBy: null,
            amount: redeemPoints,
            remark: transaction.remark,
            createdBy: user.utorid
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get current user's transactions
app.get('/users/me/transactions', jwtMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Validate pagination parameters
        if (req.query.page !== undefined && (isNaN(page) || page < 1)) {
            return res.status(400).json({ error: "Invalid page parameter" });
        }
        if (req.query.limit !== undefined && (isNaN(limit) || limit < 1)) {
            return res.status(400).json({ error: "Invalid limit parameter" });
        }

        const skip = (page - 1) * limit;

        // Get transactions for current user
        const [transactions, count] = await Promise.all([
            prisma.transaction.findMany({
                where: { userId: req.auth.id },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            utorid: true,
                            name: true
                        }
                    }
                }
            }),
            prisma.transaction.count({ where: { userId: req.auth.id } })
        ]);

        res.json({
            count,
            results: transactions.map(t => ({
                id: t.id,
                type: t.type,
                amount: t.amount,
                spent: t.spent,
                redeemed: t.redeemed,
                relatedId: t.relatedId,
                suspicious: t.suspicious,
                remark: t.remark,
                createdBy: {
                    id: t.createdBy.id,
                    utorid: t.createdBy.utorid,
                    name: t.createdBy.name
                },
                createdAt: t.createdAt.toISOString()
            }))
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Transfer points to another user
app.post('/users/:userId/transactions', jwtMiddleware, async (req, res) => {
    try {
        const toUserId = parseInt(req.params.userId);
        const { type, amount, remark } = req.body;

        if (isNaN(toUserId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        if (type !== 'transfer') {
            return res.status(400).json({ error: "Invalid transaction type" });
        }

        // Validate amount
        if (!amount || isNaN(amount) || amount <= 0 || !Number.isInteger(amount)) {
            return res.status(400).json({ error: "Invalid amount" });
        }

        const transferAmount = parseInt(amount);

        // Get sender (logged-in user)
        const fromUser = await prisma.user.findUnique({
            where: { id: req.auth.id }
        });

        if (!fromUser) {
            return res.status(404).json({ error: "Sender not found" });
        }

        // Check sender is verified
        if (!fromUser.verified) {
            return res.status(403).json({ error: "Sender must be verified" });
        }

        // Check sender has enough points
        if (fromUser.points < transferAmount) {
            return res.status(400).json({ error: "Insufficient points" });
        }

        // Get recipient by userId
        const toUser = await prisma.user.findUnique({
            where: { id: toUserId }
        });

        if (!toUser) {
            return res.status(404).json({ error: "Recipient not found" });
        }

        // Cannot transfer to self
        if (fromUser.id === toUser.id) {
            return res.status(400).json({ error: "Cannot transfer to yourself" });
        }

        // Create transfer transactions
        const result = await prisma.$transaction(async (prisma) => {
            // Create debit transaction for sender
            const debitTransaction = await prisma.transaction.create({
                data: {
                    type: 'transfer',
                    userId: fromUser.id,
                    amount: -transferAmount,
                    remark: remark || '',
                    createdById: req.auth.id,
                    relatedId: 0 // will update after creating credit transaction
                }
            });

            // Create credit transaction for recipient
            const creditTransaction = await prisma.transaction.create({
                data: {
                    type: 'transfer',
                    userId: toUser.id,
                    amount: transferAmount,
                    remark: remark || '',
                    createdById: req.auth.id,
                    relatedId: fromUser.id
                }
            });

            // Update debit transaction with recipient's user ID
            await prisma.transaction.update({
                where: { id: debitTransaction.id },
                data: { relatedId: toUser.id }
            });

            // Update user points
            await prisma.user.update({
                where: { id: fromUser.id },
                data: { points: { decrement: transferAmount } }
            });

            await prisma.user.update({
                where: { id: toUser.id },
                data: { points: { increment: transferAmount } }
            });

            return { debitTransaction, creditTransaction };
        });

        res.status(201).json({
            id: result.debitTransaction.id,
            sender: fromUser.utorid,
            recipient: toUser.utorid,
            type: 'transfer',
            sent: transferAmount,
            remark: remark || '',
            createdBy: fromUser.utorid
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// EVENTS

// Create event 
app.post('/events', jwtMiddleware, async (req, res) => {
    try {
        // Check authorization (Manager+)
        if (!['manager', 'superuser'].includes(req.auth.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const { name, description, location, startTime, endTime, capacity, points, organizers } = req.body;

        // Validate required fields
        if (!name || !description || !location || !startTime || !endTime || !points) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Validate dates
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: "Invalid date format" });
        }

        if (start >= end) {
            return res.status(400).json({ error: "End time must be after start time" });
        }

        // Validate points
        const totalPoints = parseInt(points);
        if (isNaN(totalPoints) || totalPoints <= 0) {
            return res.status(400).json({ error: "Invalid points amount" });
        }

        // Validate capacity (optional, null = unlimited)
        let eventCapacity = null;
        if (capacity !== undefined && capacity !== null) {
            eventCapacity = parseInt(capacity);
            if (isNaN(eventCapacity) || eventCapacity <= 0) {
                return res.status(400).json({ error: "Invalid capacity" });
            }
        }

        // Validate organizers: arr of userids (optional)
        let organizerIds = [];
        if (organizers && Array.isArray(organizers)) {
            organizerIds = organizers.map(id => parseInt(id)).filter(id => !isNaN(id));
        }

        // Create event with organizers
        const event = await prisma.$transaction(async (prisma) => {
            // Create event
            const newEvent = await prisma.event.create({
                data: {
                    name,
                    description,
                    location,
                    startTime: start,
                    endTime: end,
                    capacity: eventCapacity,
                    points: totalPoints,
                    pointsRemain: totalPoints,
                    published: false
                }
            });

            // Add creator as organizer
            await prisma.eventOrganizer.create({
                data: {
                    eventId: newEvent.id,
                    userId: req.auth.id
                }
            });

            // Add additional organizers if specified
            if (organizerIds.length > 0) {
                await prisma.eventOrganizer.createMany({
                    data: organizerIds
                        .filter(id => id !== req.auth.id) // Don't duplicate creator
                        .map(userId => ({
                            eventId: newEvent.id,
                            userId
                        })),
                    skipDuplicates: true
                });
            }

            return newEvent;
        });

        // Get organizers for response
        const eventOrganizers = await prisma.eventOrganizer.findMany({
            where: { eventId: event.id },
            select: { userId: true }
        });
        const organizerUserIds = eventOrganizers.map(o => o.userId);

        res.status(201).json({
            id: event.id,
            name: event.name,
            description: event.description,
            location: event.location,
            startTime: event.startTime.toISOString(),
            endTime: event.endTime.toISOString(),
            capacity: event.capacity,
            points: event.points,
            pointsRemain: event.pointsRemain,
            pointsAwarded: 0,
            published: event.published,
            createdAt: event.createdAt.toISOString(),
            organizers: organizerUserIds,
            guests: []
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// List events
app.get('/events', jwtMiddleware, async (req, res) => {
    try {
        // Parse pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Validate pagination parameters
        if (req.query.page !== undefined && (isNaN(page) || page < 1)) {
            return res.status(400).json({ error: "Invalid page parameter" });
        }
        if (req.query.limit !== undefined && (isNaN(limit) || limit < 1)) {
            return res.status(400).json({ error: "Invalid limit parameter" });
        }

        const skip = (page - 1) * limit;

        // Build filters
        const where = {};

        // By default, everyone sees only published events
        // Manager+ can explicitly filter by published status using query parameter
        if (req.query.published !== undefined && ['manager', 'superuser'].includes(req.auth.role)) {
            // Manager+ can filter by published status
            where.published = req.query.published === 'true';
        } else {
            // Default: show only published events (for all roles)
            where.published = true;
        }

        // Get events
        const [events, count] = await Promise.all([
            prisma.event.findMany({
                where,
                skip,
                take: limit,
                orderBy: { startTime: 'asc' },
                include: {
                    organizers: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    utorid: true,
                                    name: true
                                }
                            }
                        }
                    },
                    guests: {
                        select: {
                            userId: true
                        }
                    }
                }
            }),
            prisma.event.count({ where })
        ]);

        res.json({
            count,
            results: events.map(e => ({
                id: e.id,
                name: e.name,
                description: e.description,
                location: e.location,
                startTime: e.startTime.toISOString(),
                endTime: e.endTime.toISOString(),
                capacity: e.capacity,
                guestCount: e.guests.length,
                points: e.points,
                pointsRemain: e.pointsRemain,
                pointsAwarded: e.pointsAwarded,
                published: e.published,
                organizers: e.organizers.map(o => o.user),
                createdAt: e.createdAt.toISOString()
            }))
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get event details
app.get('/events/:eventId', jwtMiddleware, async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return res.status(400).json({ error: "Invalid event ID" });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                organizers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                utorid: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                guests: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                utorid: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Regular users can only view published events
        if (req.auth.role === 'regular' && !event.published) {
            return res.status(403).json({ error: "Forbidden" });
        }

        res.json({
            id: event.id,
            name: event.name,
            description: event.description,
            location: event.location,
            startTime: event.startTime.toISOString(),
            endTime: event.endTime.toISOString(),
            capacity: event.capacity,
            points: event.points,
            pointsRemain: event.pointsRemain,
            pointsAwarded: event.pointsAwarded,
            published: event.published,
            organizers: event.organizers.map(o => o.user),
            guests: event.guests.map(g => g.user),
            numGuests: event.guests.length,
            createdAt: event.createdAt.toISOString()
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update event
app.patch('/events/:eventId', jwtMiddleware, async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return res.status(400).json({ error: "Invalid event ID" });
        }

        // Get event with organizers and guests
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                organizers: {
                    select: {
                        userId: true
                    }
                },
                guests: {
                    select: {
                        userId: true
                    }
                }
            }
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Check authorization (Manager+ or organizer)
        const isOrganizer = event.organizers.some(o => o.userId === req.auth.id);
        if (!['manager', 'superuser'].includes(req.auth.role) && !isOrganizer) {
            return res.status(403).json({ error: "Forbidden" });
        }

        // Check if trying to update manager-only fields
        if ((req.body.points !== undefined || req.body.published !== undefined) &&
            !['manager', 'superuser'].includes(req.auth.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const { name, description, location, startTime, endTime, capacity, points, published } = req.body;

        // Check if trying to update restricted fields after event has started
        const eventHasStarted = event.startTime < new Date();
        const eventHasEnded = event.endTime < new Date();

        if (eventHasStarted && (name !== undefined || description !== undefined ||
            location !== undefined || startTime !== undefined || capacity !== undefined)) {
            return res.status(400).json({ error: "Cannot update these fields after event has started" });
        }

        const updateData = {};

        if (name !== undefined && name !== null) updateData.name = name;
        if (description !== undefined && description !== null) updateData.description = description;
        if (location !== undefined && location !== null) updateData.location = location;

        if (startTime !== undefined && startTime !== null) {
            const start = new Date(startTime);
            if (isNaN(start.getTime())) {
                return res.status(400).json({ error: "Invalid start time" });
            }
            // Validate that start time is not in the past
            if (start < new Date()) {
                return res.status(400).json({ error: "Start time cannot be in the past" });
            }
            updateData.startTime = start;
        }

        if (endTime !== undefined && endTime !== null) {
            if (eventHasEnded) {
                return res.status(400).json({ error: "Cannot update end time after event has ended" });
            }
            const end = new Date(endTime);
            if (isNaN(end.getTime())) {
                return res.status(400).json({ error: "Invalid end time" });
            }
            updateData.endTime = end;
        }

        if (capacity !== undefined) {
            if (capacity === null) {
                updateData.capacity = null;
            } else {
                const cap = parseInt(capacity);
                if (isNaN(cap) || cap <= 0) {
                    return res.status(400).json({ error: "Invalid capacity" });
                }
                // Cannot reduce capacity below current guest count
                if (cap < event.guests.length) {
                    return res.status(400).json({ error: "Capacity cannot be less than current number of guests" });
                }
                updateData.capacity = cap;
            }
        }

        if (points !== undefined && points !== null) {
            const pts = parseInt(points);
            if (isNaN(pts) || pts <= 0) {
                return res.status(400).json({ error: "Invalid points value" });
            }
            // When updating points, also update pointsRemain proportionally
            const pointsDifference = pts - event.points;
            const newPointsRemain = event.pointsRemain + pointsDifference;

            // Check if reducing points would result in negative pointsRemain
            if (newPointsRemain < 0) {
                return res.status(400).json({ error: "Cannot reduce points below already awarded amount" });
            }

            updateData.points = pts;
            updateData.pointsRemain = newPointsRemain;
        }

        if (published !== undefined && published !== null) {
            if (typeof published !== 'boolean') {
                return res.status(400).json({ error: "Invalid published value" });
            }
            updateData.published = published;
        }

        // Update event
        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: updateData
        });

        res.json({
            id: updatedEvent.id,
            name: updatedEvent.name,
            description: updatedEvent.description,
            location: updatedEvent.location,
            startTime: updatedEvent.startTime.toISOString(),
            endTime: updatedEvent.endTime.toISOString(),
            capacity: updatedEvent.capacity,
            points: updatedEvent.points,
            pointsRemain: updatedEvent.pointsRemain,
            pointsAwarded: updatedEvent.pointsAwarded,
            published: updatedEvent.published,
            createdAt: updatedEvent.createdAt.toISOString()
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete event 
app.delete('/events/:eventId', jwtMiddleware, async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return res.status(400).json({ error: "Invalid event ID" });
        }

        // Get event with organizers
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                organizers: {
                    select: {
                        userId: true
                    }
                }
            }
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Check authorization (Manager+ or organizer)
        const isOrganizer = event.organizers.some(o => o.userId === req.auth.id);
        if (!['manager', 'superuser'].includes(req.auth.role) && !isOrganizer) {
            return res.status(403).json({ error: "Forbidden" });
        }

        // Cannot delete published events
        if (event.published) {
            return res.status(400).json({ error: "Cannot delete published event" });
        }

        // If points have been awarded, deletion is not allowed
        if (event.pointsAwarded > 0) {
            return res.status(400).json({ error: "Cannot delete event with awarded points" });
        }

        // Delete event
        await prisma.event.delete({
            where: { id: eventId }
        });

        res.status(204).send();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Add organizer
app.post('/events/:eventId/organizers', jwtMiddleware, async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);
        const { utorid } = req.body;

        if (isNaN(eventId)) {
            return res.status(400).json({ error: "Invalid event ID" });
        }

        if (!utorid || typeof utorid !== 'string') {
            return res.status(400).json({ error: "Invalid utorid" });
        }

        // Get event with organizers
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                organizers: {
                    select: {
                        userId: true
                    }
                }
            }
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Check authorization (Manager+ or organizer)
        const isOrganizer = event.organizers.some(o => o.userId === req.auth.id);
        if (!['manager', 'superuser'].includes(req.auth.role) && !isOrganizer) {
            return res.status(403).json({ error: "Forbidden" });
        }

        // Check if event has already ended
        if (event.endTime < new Date()) {
            return res.status(410).json({ error: "Event has already ended" });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { utorid: utorid }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if already an organizer
        if (event.organizers.some(o => o.userId === user.id)) {
            return res.status(400).json({ error: "User is already an organizer" });
        }

        // Check if user is already a guest
        const isGuest = await prisma.eventGuest.findUnique({
            where: {
                eventId_userId: {
                    eventId,
                    userId: user.id
                }
            }
        });

        if (isGuest) {
            return res.status(400).json({ error: "User is registered as a guest" });
        }

        // Add organizer
        await prisma.eventOrganizer.create({
            data: {
                eventId,
                userId: user.id
            }
        });

        // Get updated organizers list with user details
        const updatedOrganizers = await prisma.eventOrganizer.findMany({
            where: { eventId },
            include: {
                user: {
                    select: {
                        id: true,
                        utorid: true,
                        name: true
                    }
                }
            }
        });

        res.status(201).json({
            id: event.id,
            name: event.name,
            location: event.location,
            organizers: updatedOrganizers.map(o => o.user)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Remove organizer
app.delete('/events/:eventId/organizers/:userId', jwtMiddleware, async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);
        const userId = parseInt(req.params.userId);

        if (isNaN(eventId)) {
            return res.status(400).json({ error: "Invalid event ID" });
        }

        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        // Get event with organizers
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                organizers: {
                    select: {
                        userId: true
                    }
                }
            }
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Check authorization (Manager+ only, NOT organizers)
        if (!['manager', 'superuser'].includes(req.auth.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        // Check if user is an organizer
        if (!event.organizers.some(o => o.userId === userId)) {
            return res.status(404).json({ error: "User is not an organizer" });
        }

        // Cannot remove if they're the last organizer
        if (event.organizers.length === 1) {
            return res.status(400).json({ error: "Cannot remove the last organizer" });
        }

        // Remove organizer
        await prisma.eventOrganizer.delete({
            where: {
                eventId_userId: {
                    eventId,
                    userId
                }
            }
        });

        res.status(204).send();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// RSVP to event
app.post('/events/:eventId/guests/me', jwtMiddleware, async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return res.status(400).json({ error: "Invalid event ID" });
        }

        // Get event with guests
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                guests: {
                    select: {
                        userId: true
                    }
                }
            }
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Event must be published for regular users to RSVP
        if (!event.published && req.auth.role === 'regular') {
            return res.status(403).json({ error: "Event is not published" });
        }

        // Check if event has already ended
        if (event.endTime < new Date()) {
            return res.status(410).json({ error: "Event has already ended" });
        }

        // Check if event is at capacity
        if (event.capacity !== null) {
            const currentCount = await prisma.eventGuest.count({
                where: { eventId }
            });
            if (currentCount >= event.capacity) {
                return res.status(410).json({ error: "Event is at capacity" });
            }
        }

        // Check if already registered
        if (event.guests.some(g => g.userId === req.auth.id)) {
            return res.status(400).json({ error: "Already registered for this event" });
        }

        // Get current user details
        const user = await prisma.user.findUnique({
            where: { id: req.auth.id },
            select: {
                id: true,
                utorid: true,
                name: true
            }
        });

        let totalGuests;
        try {
            totalGuests = await prisma.$transaction(async (tx) => {
                const currentGuests = await tx.eventGuest.count({
                    where: { eventId }
                });

                if (event.capacity !== null && currentGuests >= event.capacity) {
                    throw new Error('EVENT_FULL');
                }

                await tx.eventGuest.create({
                    data: {
                        eventId,
                        userId: req.auth.id,
                        confirmedAt: new Date()
                    }
                });

                return currentGuests + 1;
            });
        } catch (err) {
            if (err.message === 'EVENT_FULL') {
                return res.status(410).json({ error: "Event is at capacity" });
            }
            throw err;
        }

        res.status(201).json({
            id: event.id,
            name: event.name,
            location: event.location,
            guestAdded: {
                id: user.id,
                utorid: user.utorid,
                name: user.name
            },
            numGuests: totalGuests
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Cancel RSVP
app.delete('/events/:eventId/guests/me', jwtMiddleware, async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return res.status(400).json({ error: "Invalid event ID" });
        }

        // Check if event exists
        const event = await prisma.event.findUnique({
            where: { id: eventId }
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Check if event has already ended
        if (event.endTime < new Date()) {
            return res.status(410).json({ error: "Event has already ended" });
        }

        // Check if user is registered
        const guest = await prisma.eventGuest.findUnique({
            where: {
                eventId_userId: {
                    eventId,
                    userId: req.auth.id
                }
            }
        });

        if (!guest) {
            return res.status(404).json({ error: "Not registered for this event" });
        }

        // Remove guest
        await prisma.eventGuest.delete({
            where: {
                eventId_userId: {
                    eventId,
                    userId: req.auth.id
                }
            }
        });

        res.status(204).send();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Add guest 
app.post('/events/:eventId/guests', jwtMiddleware, async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);
        const { utorid } = req.body;

        if (isNaN(eventId)) {
            return res.status(400).json({ error: "Invalid event ID" });
        }

        if (!utorid || typeof utorid !== 'string') {
            return res.status(400).json({ error: "Invalid utorid" });
        }

        // Get event with organizers and guests
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                organizers: {
                    select: {
                        userId: true
                    }
                },
                guests: {
                    select: {
                        userId: true
                    }
                }
            }
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Check authorization (Manager+ or organizer)
        const isManager = ['manager', 'superuser'].includes(req.auth.role);
        const isOrganizer = event.organizers.some(o => o.userId === req.auth.id);

        if (!isManager && !isOrganizer) {
            return res.status(403).json({ error: "Forbidden" });
        }

        // Check if event is published (organizers can't add guests to unpublished events)
        if (!event.published && !isManager) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Check if event has already ended
        const now = new Date();
        if (event.endTime < now) {
            return res.status(410).json({ error: "Event has already ended" });
        }

        // Check if event is at capacity (using already-loaded guests)
        if (event.capacity !== null && event.guests.length >= event.capacity) {
            return res.status(410).json({ error: "Event is full" });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { utorid: utorid }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if already registered
        if (event.guests.some(g => g.userId === user.id)) {
            return res.status(400).json({ error: "User is already registered" });
        }

        // Check if user is an organizer
        if (event.organizers.some(o => o.userId === user.id)) {
            return res.status(400).json({ error: "User is an organizer" });
        }

        // Add guest
        await prisma.eventGuest.create({
            data: {
                eventId,
                userId: user.id,
                confirmedAt: new Date()
            }
        });

        const totalGuests = event.guests.length + 1;

        res.status(201).json({
            id: event.id,
            name: event.name,
            location: event.location,
            guestAdded: {
                id: user.id,
                utorid: user.utorid,
                name: user.name
            },
            numGuests: totalGuests
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Remove guest 
app.delete('/events/:eventId/guests/:userId', jwtMiddleware, async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);
        const userId = parseInt(req.params.userId);

        if (isNaN(eventId)) {
            return res.status(400).json({ error: "Invalid event ID" });
        }

        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        // Get event
        const event = await prisma.event.findUnique({
            where: { id: eventId }
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Check authorization (Manager+ only)
        if (!['manager', 'superuser'].includes(req.auth.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        // Check if user is registered as a guest
        const guest = await prisma.eventGuest.findUnique({
            where: {
                eventId_userId: {
                    eventId,
                    userId
                }
            }
        });

        if (!guest) {
            return res.status(404).json({ error: "User is not registered" });
        }

        // Remove guest
        await prisma.eventGuest.delete({
            where: {
                eventId_userId: {
                    eventId,
                    userId
                }
            }
        });

        res.status(204).send();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Award points to guests
app.post('/events/:eventId/transactions', jwtMiddleware, async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);
        const { type, utorid, amount, remark } = req.body;

        if (isNaN(eventId)) {
            return res.status(400).json({ error: "Invalid event ID" });
        }

        // Validate type must be "event"
        if (type !== 'event') {
            return res.status(400).json({ error: "Type must be 'event'" });
        }

        // Validate amount
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: "Invalid amount" });
        }

        const pointsPerGuest = parseInt(amount);

        // Get event with organizers and guests
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                organizers: {
                    select: {
                        userId: true
                    }
                },
                guests: {
                    select: {
                        userId: true,
                        confirmedAt: true
                    }
                }
            }
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Check authorization (Manager+ or organizer) BEFORE validation
        const isOrganizer = event.organizers.some(o => o.userId === req.auth.id);
        if (!['manager', 'superuser'].includes(req.auth.role) && !isOrganizer) {
            return res.status(403).json({ error: "Forbidden" });
        }

        let guestIds = [];

        // If utorid is not specified or null, award to all confirmed guests
        if (!utorid) {
            // Only award to guests with confirmed attendance
            guestIds = event.guests.filter(g => g.confirmedAt !== null).map(g => g.userId);
        } else {
            // Award to specific guest
            const user = await prisma.user.findUnique({
                where: { utorid: utorid },
                select: {
                    id: true,
                    utorid: true
                }
            });

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            // Check if user is a guest of this event using the already-loaded guests array
            const guestRecord = event.guests.find(g => g.userId === user.id);
            if (!guestRecord || guestRecord.confirmedAt === null) {
                return res.status(400).json({ error: "User is not a guest" });
            }

            guestIds = [user.id];
        }

        // Calculate total points needed
        const totalPointsNeeded = pointsPerGuest * guestIds.length;

        // Check if enough points left
        if (event.pointsRemain < totalPointsNeeded) {
            return res.status(400).json({ error: "Insufficient points remaining for this event" });
        }

        // Create transactions and update event/user points
        const createdTransactions = await prisma.$transaction(async (prisma) => {
            const transactions = [];

            // Create event transactions for each guest
            for (const guestId of guestIds) {
                const transaction = await prisma.transaction.create({
                    data: {
                        type: 'event',
                        userId: guestId,
                        amount: pointsPerGuest,
                        relatedId: eventId,
                        remark: remark || `Points from event: ${event.name}`,
                        createdById: req.auth.id
                    },
                    include: {
                        user: {
                            select: {
                                utorid: true,
                                email: true,
                                name: true
                            }
                        },
                        createdBy: {
                            select: {
                                utorid: true,
                                email: true,
                                name: true
                            }
                        }
                    }
                });

                transactions.push({
                    id: transaction.id,
                    recipient: transaction.user.utorid,
                    awarded: transaction.amount,
                    type: transaction.type,
                    relatedId: transaction.relatedId,
                    remark: transaction.remark,
                    createdBy: transaction.createdBy.utorid
                });

                // Update user points
                await prisma.user.update({
                    where: { id: guestId },
                    data: {
                        points: {
                            increment: pointsPerGuest
                        }
                    }
                });
            }

            // Update event points
            await prisma.event.update({
                where: { id: eventId },
                data: {
                    pointsRemain: {
                        decrement: totalPointsNeeded
                    },
                    pointsAwarded: {
                        increment: totalPointsNeeded
                    }
                }
            });

            return transactions;
        });

        // Return single object if utorid was specified, array if not
        if (utorid) {
            res.status(201).json(createdTransactions[0]);
        } else {
            res.status(201).json(createdTransactions);
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// PROMOTIONS

// Create promotion 
app.post('/promotions', jwtMiddleware, async (req, res) => {
    try {
        // Check authorization (Manager+)
        if (!['manager', 'superuser'].includes(req.auth.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const { name, description, type, startTime, endTime, minSpending, rate, points } = req.body;

        // Validate required fields
        if (!name || !description || !type || !startTime || !endTime) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Validate type
        if (!['automatic', 'one-time'].includes(type)) {
            return res.status(400).json({ error: "Invalid promotion type" });
        }

        // Validate dates
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: "Invalid date format" });
        }

        if (start < new Date()) {
            return res.status(400).json({ error: "Start time cannot be in the past" });
        }

        if (start >= end) {
            return res.status(400).json({ error: "End time must be after start time" });
        }

        // Convert API type to database type (one-time -> onetime)
        const dbType = type === 'one-time' ? 'onetime' : type;

        // Validate based on type
        const promotionData = {
            name,
            description,
            type: dbType,
            startTime: start,
            endTime: end
        };

        if (type === 'automatic') {
            // requires rate, optional minSpending
            if (rate === undefined || rate === null || isNaN(rate) || rate < 0) {
                return res.status(400).json({ error: "Automatic promotions require a valid rate" });
            }
            promotionData.rate = parseFloat(rate);

            if (minSpending !== undefined && minSpending !== null) {
                const minSpend = parseFloat(minSpending);
                if (isNaN(minSpend) || minSpend <= 0) {
                    return res.status(400).json({ error: "Invalid minimum spending" });
                }
                promotionData.minSpending = minSpend;
            }
        } else if (type === 'one-time') {
            // requires points and minSpending
            if (points === undefined || points === null || isNaN(points) || points < 0) {
                return res.status(400).json({ error: "One-time promotions require valid points" });
            }
            promotionData.points = parseInt(points);

            if (!minSpending || isNaN(minSpending) || minSpending <= 0) {
                return res.status(400).json({ error: "One-time promotions require minimum spending" });
            }
            promotionData.minSpending = parseFloat(minSpending);
        }

        // Create promotion
        const promotion = await prisma.promotion.create({
            data: promotionData
        });

        res.status(201).json({
            id: promotion.id,
            name: promotion.name,
            description: promotion.description,
            type: promotion.type === 'onetime' ? 'one-time' : promotion.type,
            startTime: promotion.startTime.toISOString(),
            endTime: promotion.endTime.toISOString(),
            minSpending: promotion.minSpending,
            rate: promotion.rate,
            points: promotion.points,
            createdAt: promotion.createdAt.toISOString()
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// List promotions
app.get('/promotions', jwtMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Validate pagination parameters
        if (req.query.page !== undefined && (isNaN(page) || page < 1)) {
            return res.status(400).json({ error: "Invalid page parameter" });
        }
        if (req.query.limit !== undefined && (isNaN(limit) || limit < 1)) {
            return res.status(400).json({ error: "Invalid limit parameter" });
        }

        const skip = (page - 1) * limit;
        const isManager = ['manager', 'superuser'].includes(req.auth.role);

        // Build filters
        const where = {};
        const now = new Date();

        // Filter by name (both roles)
        if (req.query.name) {
            where.name = { contains: req.query.name };
        }

        // Filter by type (both roles)
        if (req.query.type && ['automatic', 'one-time'].includes(req.query.type)) {
            const dbType = req.query.type === 'one-time' ? 'onetime' : req.query.type;
            where.type = dbType;
        }

        if (isManager) {
            // Manager filters: started and ended
            if (req.query.started !== undefined && req.query.ended !== undefined) {
                return res.status(400).json({ error: "Cannot specify both started and ended" });
            }

            if (req.query.started !== undefined) {
                const started = req.query.started === 'true';
                if (started) {
                    where.startTime = { lte: now };
                } else {
                    where.startTime = { gt: now };
                }
            }

            if (req.query.ended !== undefined) {
                const ended = req.query.ended === 'true';
                if (ended) {
                    where.endTime = { lt: now };
                } else {
                    where.endTime = { gte: now };
                }
            }

            // Get promotions for managers
            const [promotions, count] = await Promise.all([
                prisma.promotion.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.promotion.count({ where })
            ]);

            res.json({
                count,
                results: promotions.map(p => ({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    type: p.type === 'onetime' ? 'one-time' : p.type,
                    startTime: p.startTime.toISOString(),
                    endTime: p.endTime.toISOString(),
                    minSpending: p.minSpending,
                    rate: p.rate,
                    points: p.points
                }))
            });
        } else {
            // Regular users: only active promotions they haven't used
            where.startTime = { lte: now };
            where.endTime = { gte: now };

            // Get all promotions matching filters
            const allPromotions = await prisma.promotion.findMany({
                where,
                orderBy: { createdAt: 'desc' }
            });

            // Filter out used one-time promotions
            const availablePromotions = [];
            for (const promo of allPromotions) {
                if (promo.type === 'onetime') {
                    // Check if user has used this promotion
                    const usage = await prisma.promotionUsage.findFirst({
                        where: {
                            userId: req.auth.id,
                            promotionId: promo.id
                        }
                    });
                    if (!usage) {
                        availablePromotions.push(promo);
                    }
                } else {
                    // Automatic promotions are always available when active
                    availablePromotions.push(promo);
                }
            }

            const count = availablePromotions.length;
            const paginatedPromotions = availablePromotions.slice(skip, skip + limit);

            res.json({
                count,
                results: paginatedPromotions.map(p => ({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    type: p.type === 'onetime' ? 'one-time' : p.type,
                    endTime: p.endTime.toISOString(),
                    minSpending: p.minSpending,
                    rate: p.rate,
                    points: p.points
                }))
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get promotion details
app.get('/promotions/:promotionId', jwtMiddleware, async (req, res) => {
    try {
        const promotionId = parseInt(req.params.promotionId);

        if (isNaN(promotionId)) {
            return res.status(400).json({ error: "Invalid promotion ID" });
        }

        const promotion = await prisma.promotion.findUnique({
            where: { id: promotionId }
        });

        if (!promotion) {
            return res.status(404).json({ error: "Promotion not found" });
        }

        const isManager = ['manager', 'superuser'].includes(req.auth.role);
        const now = new Date();

        if (!isManager) {
            // Regular users: 404 if promotion is not active
            const isActive = promotion.startTime <= now && promotion.endTime >= now;
            if (!isActive) {
                return res.status(404).json({ error: "Promotion not found" });
            }

            // Regular users: no startTime in response
            return res.json({
                id: promotion.id,
                name: promotion.name,
                description: promotion.description,
                type: promotion.type === 'onetime' ? 'one-time' : promotion.type,
                endTime: promotion.endTime.toISOString(),
                minSpending: promotion.minSpending,
                rate: promotion.rate,
                points: promotion.points
            });
        }

        // Managers: full details
        res.json({
            id: promotion.id,
            name: promotion.name,
            description: promotion.description,
            type: promotion.type === 'onetime' ? 'one-time' : promotion.type,
            startTime: promotion.startTime.toISOString(),
            endTime: promotion.endTime.toISOString(),
            minSpending: promotion.minSpending,
            rate: promotion.rate,
            points: promotion.points
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update promotion 
app.patch('/promotions/:promotionId', jwtMiddleware, async (req, res) => {
    try {
        // Check authorization (Manager+)
        if (!['manager', 'superuser'].includes(req.auth.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const promotionId = parseInt(req.params.promotionId);

        if (isNaN(promotionId)) {
            return res.status(400).json({ error: "Invalid promotion ID" });
        }

        // Get existing promotion
        const promotion = await prisma.promotion.findUnique({
            where: { id: promotionId }
        });

        if (!promotion) {
            return res.status(404).json({ error: "Promotion not found" });
        }

        const { name, description, type, startTime, endTime, minSpending, rate, points } = req.body;
        const updateData = {};
        const now = new Date();
        const hasStarted = promotion.startTime <= now;
        const hasEnded = promotion.endTime < now;

        // Validate times are not in the past
        if (startTime !== undefined) {
            const start = new Date(startTime);
            if (isNaN(start.getTime())) {
                return res.status(400).json({ error: "Invalid start time" });
            }
            if (start < now) {
                return res.status(400).json({ error: "Start time cannot be in the past" });
            }
            updateData.startTime = start;
        }

        if (endTime !== undefined) {
            const end = new Date(endTime);
            if (isNaN(end.getTime())) {
                return res.status(400).json({ error: "Invalid end time" });
            }
            if (end < now) {
                return res.status(400).json({ error: "End time cannot be in the past" });
            }
            // Check if trying to update invalid endTime
            if (hasEnded) {
                return res.status(400).json({ error: "Cannot update end time after promotion has ended" });
            }
            updateData.endTime = end;
        }

        // Check if trying to update certain fields after promotion has started
        if (hasStarted) {
            if (name !== undefined || description !== undefined || type !== undefined ||
                startTime !== undefined || minSpending !== undefined || rate !== undefined || points !== undefined) {
                return res.status(400).json({ error: "Cannot update these fields after promotion has started" });
            }
        }

        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (type !== undefined) {
            if (!['automatic', 'one-time'].includes(type)) {
                return res.status(400).json({ error: "Invalid type" });
            }
            updateData.type = type === 'one-time' ? 'onetime' : type;
        }

        if (minSpending !== undefined) {
            if (minSpending === null) {
                updateData.minSpending = null;
            } else {
                const minSpend = parseFloat(minSpending);
                if (isNaN(minSpend) || minSpend < 0) {
                    return res.status(400).json({ error: "Invalid minimum spending" });
                }
                updateData.minSpending = minSpend;
            }
        }

        if (rate !== undefined) {
            if (promotion.type !== 'automatic') {
                return res.status(400).json({ error: "Cannot set rate for non-automatic promotions" });
            }
            const rateValue = parseFloat(rate);
            if (isNaN(rateValue) || rateValue <= 0) {
                return res.status(400).json({ error: "Invalid rate" });
            }
            updateData.rate = rateValue;
        }

        if (points !== undefined) {
            if (promotion.type !== 'onetime') {
                return res.status(400).json({ error: "Cannot set points for non-onetime promotions" });
            }
            const pointsValue = parseInt(points);
            if (isNaN(pointsValue) || pointsValue <= 0) {
                return res.status(400).json({ error: "Invalid points" });
            }
            updateData.points = pointsValue;
        }

        // Update promotion
        const updatedPromotion = await prisma.promotion.update({
            where: { id: promotionId },
            data: updateData
        });

        // Build response with only updated fields
        const response = {
            id: updatedPromotion.id,
            name: updatedPromotion.name,
            type: updatedPromotion.type === 'onetime' ? 'one-time' : updatedPromotion.type
        };

        if (description !== undefined) response.description = updatedPromotion.description;
        if (startTime !== undefined) response.startTime = updatedPromotion.startTime.toISOString();
        if (endTime !== undefined) response.endTime = updatedPromotion.endTime.toISOString();
        if (minSpending !== undefined) response.minSpending = updatedPromotion.minSpending;
        if (rate !== undefined) response.rate = updatedPromotion.rate;
        if (points !== undefined) response.points = updatedPromotion.points;

        res.json(response);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete promotion 
app.delete('/promotions/:promotionId', jwtMiddleware, async (req, res) => {
    try {
        // Check authorization (Manager+)
        if (!['manager', 'superuser'].includes(req.auth.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const promotionId = parseInt(req.params.promotionId);

        if (isNaN(promotionId)) {
            return res.status(400).json({ error: "Invalid promotion ID" });
        }

        // Check if promotion exists
        const promotion = await prisma.promotion.findUnique({
            where: { id: promotionId }
        });

        if (!promotion) {
            return res.status(404).json({ error: "Promotion not found" });
        }

        // Check if promotion has already started
        const now = new Date();
        if (promotion.startTime <= now) {
            return res.status(403).json({ error: "Cannot delete promotion that has already started" });
        }

        // Delete promotion 
        await prisma.promotion.delete({
            where: { id: promotionId }
        });

        res.status(204).send();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// Error handling middleware
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ error: "Unauthorized" });
    }

    console.error(err);
    res.status(500).json({ error: "Internal server error" });
});


const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});
