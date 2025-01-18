import express from "express";
import bodyParser from "body-parser";
import sql from "mssql";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.SERVER_PORT|| 8080;

// Middleware
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

// Azure SQL configuration
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

// Logging middleware for incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Route to handle form submission
app.post("/api/mentee-onboarding", async (req, res) => {
  const { jobTitle, verticals, persona, intent } = req.body;

  try {
    console.log("Connecting to the database...");
    const pool = await sql.connect(dbConfig);

    console.log("Inserting form data into the database...");
    await pool
      .request()
      .input("jobTitle", sql.NVarChar, jobTitle)
      .input("verticals", sql.NVarChar, verticals?.join(",") || null)
      .input("persona", sql.NVarChar, persona)
      .input("intent", sql.NVarChar, intent)
      .query(
        `INSERT INTO MenteeOnboarding (JobTitle, Verticals, Persona, Intent)
         VALUES (@jobTitle, @verticals, @persona, @intent)`
      );

    console.log("Form data submitted successfully.");
    res.status(200).send("Form data submitted successfully.");
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      message: "Failed to submit form data.",
      error: error.message,
    });
  } finally {
    sql.close();
  }
});

// API Route to fetch submissions
app.get("/submissions", async (req, res) => {
  try {
    console.log("Fetching submissions from the database...");
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query("SELECT * FROM OnboardingForm");

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Error fetching submissions:", err);
    res.status(500).json({
      message: "Failed to fetch submissions.",
      error: err.message,
    });
  }
});

// API Route to fetch MenteeOnboarding list
app.get("/MenteeList", async (req, res) => {
  try {
    console.log("Fetching submissions from the database...");
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query("SELECT * FROM MenteeOnboarding");

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Error fetching Mentee Onboarding List:", err);
    res.status(500).json({
      message: "Failed to Mentee Onboarding List.",
      error: err.message,
    });
  }
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
