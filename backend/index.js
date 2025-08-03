import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import sessionPkg from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy }from "passport-google-oauth2";
import env from "dotenv";
import validator from "validator";
import { GoogleGenerativeAI } from "@google/generative-ai"; 
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

env.config();
console.log('PG_PASSWORD:', process.env.PG_PASSWORD);
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;

const session = sessionPkg;

const db = new pg.Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

db.query('SELECT NOW()').then(() => {
  console.log("✅ DB connected.");
}).catch(err => {
  console.error("❌ DB connection error:", err);
});

// ✅ Gemini AI Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🔧 Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = ['http://localhost:5173', 'http://165.232.72.71'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("trust proxy", 1);
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  console.log("Session:", req.session);
  console.log("Passport user:", req.user);
  console.log("Has isAuthenticated?:", typeof req.isAuthenticated);
  next();
});

// ✅ Zmieniony endpoint Gemini na model gemini-2.5-flash
app.post("/api/gemini", async (req, res) => {
  const messages = req.body.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages array is empty or invalid." });
  }

  const fullPrompt = messages.map((msg) => {
    return `${msg.role === "user" ? "User" : "Assistant"}: ${msg.message}`;
  }).join('\n') + '\nAssistant:';

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: 3 },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: 3 },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: 3 },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: 3 },
      ],
      thinkingConfig: { thinkingBudget: 0 },
    });

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ text });
  } catch (error) {
    console.error("Gemini SDK error:", error);
    res.status(500).json({ error: "Failed to generate response from Gemini" });
  }
});

// ✅ PASSPORT STRATEGY
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, cb) => {
      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);

        if (result.rows.length === 0) {
          return cb(null, false, { message: "User not found" });
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return cb(null, false, { message: "Invalid password" });
        }

        return cb(null, user);
      } catch (err) {
        return cb(err);
      }
    }
  )
);

// Google OAuth
passport.use(
  "google",
  new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://165.232.72.71:3000/auth/google/notes",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
  }, async (accessToken, refreshToken, profile, cb) => {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [
        profile.email,
      ]);
      if (result.rows.length === 0) {
        const newUser = await db.query(
          "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
          [profile.email, "google"]
        );
        return cb(null, newUser.rows[0]);
      } else {
        return cb(null, result.rows[0]);
      }
    } catch (err) {
      return cb(err);
    }
  })
);

passport.serializeUser((user, done) => {
  console.log("serializeUser:", user);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err);
  }
});

function ensureAuthenticated(req, res, next) {
  if (typeof req.isAuthenticated !== "function") {
    return res.status(500).json({ message: "Authentication middleware not initialized" });
  }
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Google OAuth
app.get("/auth/google", passport.authenticate("google", { scope: ["email", "profile"] }));

app.get(
  "/auth/google/notes",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/login",
    successRedirect: "http://localhost:5173",
  })
);

function validateRegisterData(email, password) {
  const errors = [];

  if (!email || !validator.isEmail(email)) {
    errors.push("Nieprawidłowy format email");
  }

  if (!password || password.length < 8) {
    errors.push("Hasło musi mieć minimum 8 znaków");
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    errors.push("Hasło musi zawierać małą literę, dużą literę i cyfrę");
  }

  return errors;
}

// ✅ REGISTER
app.post("/register", async (req, res) => {
  const email = req.body.emailReg;
  const password = req.body.passwordReg;

  const validationErrors = validateRegisterData(email, password);
  if (validationErrors.length > 0) {
    return res.status(400).json({
      message: "Błędy walidacji",
      errors: validationErrors
    });
  }

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const result = await db.query(
      "INSERT INTO users (email, password) VALUES ($1, $2)",
      [email, hashedPassword]
    );

    console.log("✅ Użytkownik dodany:", result.rowCount);
    return res.status(201).json({ message: "User registered!" });
  } catch (err) {
    console.error("❌ Błąd przy rejestracji:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ LOGIN
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info.message });

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.status(200).json({ message: "Login successful", user });
    });
  })(req, res, next);
});

// ✅ Check login status
app.get("/me", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

// ✅ Logout
app.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ message: "Could not destroy session" });
      }

      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out" });
    });
  });
});

// --- NOTES ---
app.get("/notes", ensureAuthenticated, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC", [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error("Notes fetch error:", err);
    res.status(500).json({ message: "Failed to fetch notes" });
  }
});

app.post("/notes", ensureAuthenticated, async (req, res) => {
  const { title, content } = req.body;
  try {
    const result = await db.query(
      "INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING *",
      [req.user.id, title, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Notes insert error:", err);
    res.status(500).json({ message: "Failed to create note" });
  }
});

app.delete("/notes/:id", ensureAuthenticated, async (req, res) => {
  const noteId = req.params.id;
  try {
    await db.query("DELETE FROM notes WHERE id = $1 AND user_id = $2", [noteId, req.user.id]);
    res.status(204).send();
  } catch (err) {
    console.error("Notes delete error:", err);
    res.status(500).json({ message: "Failed to delete note" });
  }
});


//const staticPath = path.join(__dirname, "frontend/dist");
//console.log("Static path:", staticPath);
//app.use(express.static(staticPath));


//app.get("*", (req, res) => {
  //res.sendFile(path.join(__dirname, "frontend/dist", "index.html"));
//});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening at http://165.232.72.71:${port}`);
});