import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface CustomRequest extends Request {
  user?: jwt.JwtPayload;
}
console.log("check processenv", process.env.JWT_SECRET);

const COOKIE_NAME = process.env.COOKIE_NAME || "auth_token";
const JWT_SECRET = process.env.JWT_SECRET || "my-secret-key";
const MAX_AGE = Number(process.env.MAX_AGE) || 259200000;

// refresh token middleware to refresh the token if it is not expired
export const refreshToken = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.[COOKIE_NAME];
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
