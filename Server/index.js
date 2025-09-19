// Load environment variables
require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");   // only once
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");
const ip = require("ip");

// Middleware
app.use(express.json());
app.use(cors());
app.set("trust proxy", true);

// Models
const UsersModel = require("./models/UsersSchema");
const ProjectsModel = require("./models/ProjectsSchema");
const TicketsModel = require("./models/TicketsSchema");
const BannedIPsModel = require("./models/BannedIPSchema");

// MongoDB connection
const MONGO_URL =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGODBURI;   // some repos use this name

if (!MONGO_URL) {
  console.error("❌ No Mongo URL found. Check your .env file in Server/");
  process.exit(1);
}

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("✅ Mongo connected"))
  .catch((err) => {
    console.error("❌ Mongo error:", err.message);
    process.exit(1);
  });

// Rate limiter for register
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Hour
  max: 5,
  message: "Too many accounts created, please try again after an hour",
});

// ---------------- AUTH ROUTES ----------------

app.post("/register", registerLimiter, async (req, res) => {
  const { email, password } = req.body;
  const sanitizedEmail = email.toLowerCase();
  const hashedPassword = await bcrypt.hash(password, 10);
  const clientIp =
    req.ip ||
    (req.headers["x-forwarded-for"] || "").split(",")[0] ||
    ip.address();

  const existingUser = await UsersModel.findOne({ email: sanitizedEmail });
  if (existingUser) {
    return res.status(409).send("User Already Registered, Please Login");
  }

  console.log(`Registering new user - ${email}`);
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
  const sanitizedEmail = email.toLowerCase();

  const user = await UsersModel.findOne({ email: sanitizedEmail });
  if (!user) return res.status(400).send("Invalid Credentials");

  const correctPassword = await bcrypt.compare(password, user.password);
  if (!correctPassword) return res.status(400).send("Invalid Credentials");

  console.log(`Logging In - ${email}`);
  const token = jwt.sign(user.toJSON(), process.env.JWTSECRET, {
    expiresIn: "24h",
  });
  res.status(201).json({ token, email: sanitizedEmail });
});

// ---------------- JWT VERIFY MIDDLEWARE ----------------

const verifyJWT = (req, res, next) => {
  const token = req.headers["x-access-token"];
  if (!token) return res.send("No Token Found!");

  jwt.verify(token, process.env.JWTSECRET, (err, decodedUser) => {
    if (err) {
      return res.json({ auth: false, message: "Failed to authenticate" });
    }
    req.userId = decodedUser;
    next();
  });
};

// ---------------- ROUTES ----------------

app.get("/isUserAuth", verifyJWT, (req, res) => {
  res.send("You are authenticated!");
});

app.get("/pingServer", (req, res) => {
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

// Projects
const createProjectLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  message: "Too many projects created, please wait 30 minutes",
});

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

app.get("/getAllProjects", verifyJWT, (req, res) => {
  ProjectsModel.find({}, (err, docs) => {
    if (err) return res.status(500).send(err);
    if (docs.length === 0) return res.json("No Documents Found");
    res.json(docs);
  });
});

// Tickets
const createTicketLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 10,
  message: "Too many tickets created, please wait 30 minutes",
});

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

app.get("/getAllTickets", verifyJWT, (req, res) => {
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

// Admin: get users, ban user
app.get("/getUsers", verifyJWT, (req, res) => {
  if (req.userId.role !== "admin") {
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
  const { ip } = req.body;
  BannedIPsModel.create({ ip }).then(() =>
    res.json("Succesfully Banned User")
  );
});

// ---------------- START SERVER ----------------
// Health check
app.get("/health", (_req, res) => {
  const mongoState = ["disconnected","connected","connecting","disconnecting"][mongoose.connection.readyState] || "unknown";
  res.json({
    ok: true,
    uptime: process.uptime(),
    mongo: mongoState,
    env: process.env.NODE_ENV || "development",
  });
});

app.listen(process.env.PORT || 3001, () => {
  console.log("App listening on port " + (process.env.PORT || "3001") + "!");
});
