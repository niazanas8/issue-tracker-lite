// Load environment variables
require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");
const ip = require("ip");

// ---------- Middleware ----------
app.use(express.json());

// Allow requests from anywhere by default (or set FRONTEND_ORIGIN in Render)
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "*",
  })
);
app.set("trust proxy", true);

// ---------- Models ----------
const UsersModel = require("./models/UsersSchema");
const ProjectsModel = require("./models/ProjectsSchema");
const TicketsModel = require("./models/TicketsSchema");
const BannedIPsModel = require("./models/BannedIPSchema");

// ---------- MongoDB connection ----------
const MONGO_URL =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGODBURI;

if (!MONGO_URL) {
  console.error("❌ No Mongo URL found. Check your .env in /Server");
  process.exit(1);
}

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("✅ Mongo connected"))
  .catch((err) => {
    console.error("❌ Mongo error:", err.message);
    process.exit(1);
  });

// ---------- Rate limiters ----------
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: "Too many accounts created, please try again after an hour",
});

const createProjectLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 mins
  max: 5,
  message: "Too many projects created, please wait 30 minutes",
});

const createTicketLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 mins
  max: 10,
  message: "Too many tickets created, please wait 30 minutes",
});

// ---------- Root & health ----------
app.get("/", (_req, res) => {
  res.type("text/html").send(
    `<h1>Issue Tracker API ✅</h1>
     <p>Try: <a href="/pingServer">/pingServer</a> or <a href="/health">/health</a></p>`
  );
});

app.get("/health", (_req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  const mongoState = states[mongoose.connection.readyState] || "unknown";
  res.json({
    ok: true,
    uptime: process.uptime(),
    mongo: mongoState,
    env: process.env.NODE_ENV || "development",
  });
});

// ---------- Auth ----------
app.post("/register", registerLimiter, async (req, res) => {
  const { email, password } = req.body;
  const sanitizedEmail = String(email || "").toLowerCase();
  const hashedPassword = await bcrypt.hash(String(password || ""), 10);
  const clientIp =
    req.ip ||
    (req.headers["x-forwarded-for"] || "").split(",")[0] ||
    ip.address();

  const existingUser = await UsersModel.findOne({ email: sanitizedEmail });
  if (existingUser) {
    return res.status(409).send("User Already Registered, Please Login");
  }

  console.log(`Registering new user - ${sanitizedEmail}`);
  const today = new Date().toLocaleString();

  const user = {
    email: sanitizedEmail,
    password: hashedPassword,
    role: "developer",
    dateRegistered: today,
    ipAddress: clientIp,
  };

  const docs = await UsersModel.create(user);
  const token = jwt.sign(docs.toJSON(), process.env.JWTSECRET, {
    expiresIn: "24h",
  });

  res.status(201).json({ token, email: sanitizedEmail });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const sanitizedEmail = String(email || "").toLowerCase();

  const user = await UsersModel.findOne({ email: sanitizedEmail });
  if (!user) return res.status(400).send("Invalid Credentials");

  const correctPassword = await bcrypt.compare(String(password || ""), user.password);
  if (!correctPassword) return res.status(400).send("Invalid Credentials");

  console.log(`Logging In - ${sanitizedEmail}`);
  const token = jwt.sign(user.toJSON(), process.env.JWTSECRET, {
    expiresIn: "24h",
  });
  res.status(201).json({ token, email: sanitizedEmail });
});

// ---------- JWT middleware ----------
const verifyJWT = (req, res, next) => {
  const token = req.headers["x-access-token"];
  if (!token) return res.status(401).send("No Token Found!");

  jwt.verify(token, process.env.JWTSECRET, (err, decodedUser) => {
    if (err) {
      return res.status(401).json({ auth: false, message: "Failed to authenticate" });
    }
    req.userId = decodedUser;
    next();
  });
};

// ---------- Utility routes ----------
app.get("/isUserAuth", verifyJWT, (_req, res) => {
  res.send("You are authenticated!");
});

app.get("/pingServer", (_req, res) => {
  res.send("Server Is Up!");
});

app.get("/userSecurity", async (req, res) => {
  const clientIp =
    req.ip ||
    (req.headers["x-forwarded-for"] || "").split(",")[0] ||
    ip.address();

  const bannedUser = await BannedIPsModel.findOne({ ip: clientIp });
  if (bannedUser) {
    return res.status(400).send("You are Banned");
  }

  res.status(201).send("Valid Credentials");
});

// ---------- Projects ----------
app.post("/createProject", verifyJWT, createProjectLimiter, (req, res) => {
  const project = {
    title: req.body.title,
    description: req.body.description,
    creator: req.userId.email,
  };
  ProjectsModel.create(project).then(() =>
    res.json("Succesfully Added a New Project")
  );
});

app.get("/getAllProjects", verifyJWT, (_req, res) => {
  ProjectsModel.find({}, (err, docs) => {
    if (err) return res.status(500).send(err);
    if (docs.length === 0) return res.json("No Documents Found");
    res.json(docs);
  });
});

// ---------- Tickets ----------
app.post("/createTicket", verifyJWT, createTicketLimiter, (req, res) => {
  const ticket = {
    title: req.body.title,
    description: req.body.description,
    project: req.body.project,
    ticketAuthor: req.userId.email,
    priority: req.body.priority,
    status: "new",
    type: req.body.type,
    estimatedTime: req.body.estimatedTime,
    assignedDevs: [],
    comments: [],
  };
  TicketsModel.create(ticket).then(() =>
    res.json("Succesfully Added a New Ticket")
  );
});

app.get("/getAllTickets", verifyJWT, (_req, res) => {
  TicketsModel.find({}, (err, docs) => {
    if (err) return res.status(500).send(err);
    if (docs.length === 0) return res.json("No Documents Found");
    res.json(docs);
  });
});

app.post("/updateStatus", verifyJWT, (req, res) => {
  TicketsModel.updateOne(
    { _id: req.body.id },
    { status: req.body.status },
    (err) => {
      if (err) return res.status(500).send(err);
      res.json("Succesfully Updated Status");
    }
  );
});

app.post("/addDevs", verifyJWT, (req, res) => {
  TicketsModel.updateOne(
    { _id: req.body.id },
    { $push: { assignedDevs: req.body.newDev } },
    (err) => {
      if (err) return res.status(500).send(err);
      res.json("Succesfully Added Devs to Ticket");
    }
  );
});

app.post("/addComment", verifyJWT, (req, res) => {
  TicketsModel.updateOne(
    { _id: req.body.id },
    {
      $push: {
        comments: {
          author: req.userId.email,
          comment: req.body.comment,
        },
      },
    },
    (err) => {
      if (err) return res.status(500).send(err);
      res.json("Succesfully Added Comment to Ticket");
    }
  );
});

// ---------- Admin ----------
app.get("/getUsers", verifyJWT, (_req, res) => {
  if (_req.userId.role !== "admin") {
    return res.json("Not Admin");
  }
  UsersModel.find({}, (err, docs) => {
    if (err) return res.status(500).send(err);
    res.json(docs);
  });
});

app.post("/banUser", verifyJWT, (req, res) => {
  if (req.userId.role !== "admin") {
    return res.json("Not Admin");
  }
  const { ip: ipToBan } = req.body;
  BannedIPsModel.create({ ip: ipToBan }).then(() =>
    res.json("Succesfully Banned User")
  );
});

// ---------- 404 & error handlers ----------
app.use((req, res) => {
  res.status(404).json({ ok: false, message: "Route not found" });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ ok: false, message: "Server error" });
});

// ---------- Start ----------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
