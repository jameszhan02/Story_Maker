/*
 * This is the first test file for this entire project. -- some test README here --
 *
 *   -----------|---------|----------|---------|---------|-------------------
 *    File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
 *   -----------|---------|----------|---------|---------|-------------------
 *    All files |       0 |        0 |       0 |       0 |
 *   -----------|---------|----------|---------|---------|-------------------
 *
 * with --coverage flag, you get a report above.
 * 1. Files - the files that are being tested
 * 2. % Stmts - statements: the minimum unit of code that is being (ex. declare a variable, call a function, etc.)
 * 3. % Branch - branches: the number of branches in the code (ex. if statements, for loops, etc.)
 * 4. % Funcs - functions: the number of functions in the code
 * 5. % Lines - lines: the number of lines in the code
 * 6. Uncovered Line #s - the lines that are not being tested
 *
 * THE Tests should follow the AAA pattern:
 * Arrange:
 *  - set up the test data, and the expected result
 * Act:
 *  - call the function to be tested
 * Assert:
 *  - verify the result
 *
 * WITH supertest, you can test the API endpoints by sending requests to the server and checking the responses. without actually running the server.
 */

import { execSync } from "child_process";
import request from "supertest";
import { app } from "../index";

beforeAll(() => {
  //this will generate db by the schema.prisma if db is not exist
  execSync("npx prisma db push");
});

afterAll(async () => {
  //this will drop the db and generate a new one by the schema.prisma
  execSync("npx prisma db push --force-reset");
});

describe("Auth Service [API]", () => {
  describe("Register", () => {
    const mockUser = {
      username: "testuser",
      password: "testpassword",
    };
    const apiKey = process.env.API_KEY;
    it("Should register a user successfully", async () => {
      const response = await request(app)
        .post("/register")
        .set({ "x-api-key": apiKey })
        .send(mockUser);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("User registered successfully");
    });
    it("Should tell the user already exists", async () => {
      const response = await request(app)
        .post("/register")
        .set({ "x-api-key": apiKey })
        .send(mockUser);
      expect(response.status).toBe(409);
      expect(response.body.error).toBe("Username already exists");
    });
    it("Should tell the user username and password are required", async () => {
      const response = await request(app)
        .post("/register")
        .set({ "x-api-key": apiKey })
        .send({ username: "userNoPWD" });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Username and password are required");
    });
  });

  // describe("Login", () => {
  //   it("should login a user successfully", async () => {
  //     expect(true).toBe(true);
  //   });
  // });
  // describe("Logout", () => {
  //   it("should logout a user successfully", async () => {
  //     expect(true).toBe(true);
  //   });
  // });
});
