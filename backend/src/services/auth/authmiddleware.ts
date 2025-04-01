import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
export const COOKIE_NAME = "auth_token";
export const MAX_AGE = 1000 * 60 * 60 * 24 * 3; // 3 days
export const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface CustomRequest extends Request {
  user?: jwt.JwtPayload;
}

// refresh token middleware to refresh the token if it is not expired
export const refreshToken = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
      req.user = decoded;
      const tokenTimeLeft = decoded.exp! * 1000 - Date.now();
      if (tokenTimeLeft < MAX_AGE / 2) {
        //tokenTimeLeft > 0 is not needed because the token is not expired otherwise it will be caught by the catch block
        const newToken = jwt.sign(
          {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email,
          },
          JWT_SECRET,
          { expiresIn: "3d" }
        );
        res.cookie(COOKIE_NAME, newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: MAX_AGE,
        });
      }
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: "Token expired" });
      }
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: "Invalid token" });
      }
      if (error instanceof Error) {
        res.status(401).json({ error: error.message });
      }
      res.clearCookie(COOKIE_NAME);
    }
  }
  next();
};

// require auth token middleware to check if the user
export const requireAuth = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  //req.user set by refreshToken middleware
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
};
