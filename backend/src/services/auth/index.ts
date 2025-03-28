import bcrypt from "bcryptjs";
import express, { Request, Response, Router } from "express";

const app = express();
app.use(express.json());
const router = Router();

// JWT secret key (should be placed in environment variables in actual applications)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// mock user database
const users = new Map();

// register route
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    console.log("==== Register Request ====");
    console.log("Time:", new Date().toISOString());
    console.log("Body:", req.body);
    console.log("=========================");
    // input validation
    if (!username || !password) {
      res.status(400).json({
        error: "Username and password are required",
      });
      return;
    }

    // check if the user already exists
    if (users.has(username)) {
      res.status(401).json({
        error: "Username already exists",
      });
      return;
    }

    //hash the pwd
    const hashedPassword = await bcrypt.hash(password, 10);

    // save the user
    users.set(username, {
      username,
      password: hashedPassword,
    });
    res.status(200).json({
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

app.use(router);

const PORT = process.env.AUTH_PORT || 3001;

app.listen(PORT, () => {
  console.log(`Auth service is running on port ${PORT}`);
});
