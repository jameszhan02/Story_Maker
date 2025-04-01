import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import chalk from "chalk";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import {
  COOKIE_NAME,
  JWT_SECRET,
  MAX_AGE,
  refreshToken,
  requireAuth,
} from "./authmiddleware";
const prisma = new PrismaClient();

interface PrismaError {
  code: string;
  meta?: { target: string[] };
}

const app = express();
const router = Router();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(refreshToken);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/username_password_request'
 *     responses:
 *       200:
 *         description: User registered successfully
 *       400:
 *         description: Username and password are required
 *       409:
 *         description: Username already exists
 *       500:
 *         description: Internal server error
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    // input validation
    if (!username || !password) {
      res.status(400).json({
        error: "Username and password are required",
      });
      return;
    }
    //hash the pwd
    const hashedPassword = await bcrypt.hash(password, 10);
    // save the user
    const user = await prisma.users.create({
      data: {
        username,
        password_hash: hashedPassword,
      },
    });
    res.status(200).json({
      user,
      message: "User registered successfully",
    });
  } catch (error) {
    if ((error as PrismaError).code == "P2002") {
      res.status(409).json({
        error: "Username already exists",
      });
    } else {
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/username_password_request'
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid username or password
 *       500:
 *         description: Internal server error
 */
router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.users.findUnique({
      where: { username },
    });
    if (!user) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }
    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      {
        expiresIn: "3d",
      }
    );
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: MAX_AGE,
    });
    res.status(200).json({
      message: "Login successful",
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post("/logout", requireAuth, (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME);
  res.status(200).json({ message: "Logout successful" });
});

app.use(router);

const PORT = process.env.AUTH_PORT || 3001;

app.listen(PORT, () => {
  console.log(
    `${chalk.green("Auth service is running on port")} ${chalk.yellow(PORT)}`
  );
});
