const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const Poll = require("./models/Poll");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*"
  }
});

app.use(cors());
app.use(express.json());

// Middleware to capture IP address
app.use((req, res, next) => {
  req.userIp = req.headers['x-forwarded-for'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               req.ip;
  next();
});

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://mannatgarg2006:gargi167@poll.xkrpbpu.mongodb.net/?appName=poll";

mongoose.connect(MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/* ======================
   CREATE POLL
====================== */

app.get('/', (req,res)=> {
  res.send('Server is running');
})


app.post("/api/polls", async (req, res) => {
  try {
    const { question, options } = req.body;

    // Validate question
    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: "Question is required" });
    }

    if (question.length > 200) {
      return res.status(400).json({ error: "Question must be 200 characters or less" });
    }

    // Validate options
    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: "At least 2 options are required" });
    }

    if (options.length > 10) {
      return res.status(400).json({ error: "Maximum 10 options allowed" });
    }

    // Validate each option
    for (let i = 0; i < options.length; i++) {
      if (!options[i] || options[i].trim().length === 0) {
        return res.status(400).json({ error: `Option ${i + 1} cannot be empty` });
      }
      if (options[i].length > 100) {
        return res.status(400).json({ error: `Option ${i + 1} must be 100 characters or less` });
      }
    }

    // Check for duplicate options
    const uniqueOptions = [...new Set(options.map(o => o.trim().toLowerCase()))];
    if (uniqueOptions.length !== options.length) {
      return res.status(400).json({ error: "Options must be unique" });
    }

    const poll = new Poll({
      question: question.trim(),
      options: options.map(opt => ({ text: opt.trim() }))
    });

    await poll.save();

    res.json({ pollId: poll._id });

  } catch (err) {
    console.error("Error creating poll:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ======================
   GET POLL
====================== */
app.get("/api/polls/:id", async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ error: "Poll not found" });

    res.json(poll);
  } catch {
    res.status(400).json({ error: "Invalid ID" });
  }
});

/* ======================
   SOCKET.IO
====================== */
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join_poll", (pollId) => {
    socket.join(pollId);
    console.log(`Socket ${socket.id} joined poll: ${pollId}`);
  });

  socket.on("vote", async ({ pollId, optionIndex }) => {
    try {
      const poll = await Poll.findById(pollId);
      if (!poll) {
        socket.emit("vote_error", { error: "Poll not found" });
        return;
      }

      // Validate option index
      if (optionIndex < 0 || optionIndex >= poll.options.length) {
        socket.emit("vote_error", { error: "Invalid option" });
        return;
      }

      // Get IP address from socket
      const ip = socket.handshake.headers['x-forwarded-for'] || 
                 socket.handshake.address ||
                 socket.conn.remoteAddress;

      // Fairness Mechanism #2: IP-based voting prevention
      // This prevents repeat voting from the same IP address
      if (poll.voters.includes(ip)) {
        socket.emit("vote_error", { error: "You have already voted" });
        return;
      }

      // Update vote count
      poll.options[optionIndex].votes += 1;
      poll.voters.push(ip);

      // Save to database first (persistence)
      await poll.save();

      // Broadcast updated poll to all clients in the room
      io.to(pollId).emit("update", poll);

      console.log(`Vote registered for poll ${pollId}, option ${optionIndex} from IP ${ip}`);

    } catch (err) {
      console.error("Error processing vote:", err);
      socket.emit("vote_error", { error: "Error processing vote" });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
