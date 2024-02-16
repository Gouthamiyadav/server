const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Employee = require("./modal/Employee");
const Challenge = require("./modal/Challenge");

const app = express();
const port = 3001;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose
  .connect(
    "mongodb+srv://admin:admin12345@cluster0.kaesqt7.mongodb.net/?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("connected");
  })
  .catch(() => {
    console.log("failed");
  });

/* to check the server status */
app.get("/api/server-status", async (req, res) => {
  res.status(200).json({ message: "ok" });
});

app.post("/api/register", async (req, res) => {
  const { employeeId } = req.body;
  try {
    const employee = new Employee({ employeeId });
    await employee.save();
    res.status(201).json({ message: "Employee ID saved successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "An error occurred. Please try again later." });
  }
});

app.post("/api/signin", async (req, res) => {
  const { employeeId } = req.body;
  try {
    const employee = await Employee.findOne({ employeeId });
    if (employee) {
      res.json({ success: true, message: "Sign-in successful" });
    } else {
      res.status(401).json({ success: false, message: "Invalid employee ID" });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "An error occurred. Please try again later.",
    });
  }
});

/*create a challenge */
app.post("/api/challenges", async (req, res) => {
  const { title, description, tags } = req.body;
  try {
    const newChallenge = new Challenge({
      title,
      description,
      tags,
    });
    await newChallenge.save();
    res.status(201).json({
      success: true,
      message: "Challenge created successfully",
      challenge: newChallenge,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update challenge endpoint
app.put("/api/challenges/:challengeId", async (req, res) => {
  const { challengeId } = req.params;
  const { title, description, tags } = req.body;

  try {
    const challenge = await Challenge.findByIdAndUpdate(
      challengeId,
      {
        title,
        description,
        tags,
        updatedDate: Date.now(),
      },
      { new: true }
    );

    if (!challenge) {
      return res
        .status(404)
        .json({ success: false, message: "Challenge not found" });
    }

    res.json({
      success: true,
      message: "Challenge updated successfully",
      challenge,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Upvote endpoint
app.post("/api/challenges/:challengeId/upvote", async (req, res) => {
  const { challengeId } = req.params;
  const { userId } = req.body;
  try {
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res
        .status(404)
        .json({ success: false, message: "Challenge not found" });
    }
    // Check if the user has already upvoted
    if (challenge.upvotedBy.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "User already upvoted this challenge",
      });
    }
    // Add the user to the upvotedBy array
    challenge.upvotedBy.push(userId);
    // Increment the upvotes field
    challenge.upvotes += 1;
    // Save the updated challenge
    await challenge.save();
    res.json({
      success: true,
      message: "Upvoted successfully",
      upvotes: challenge.upvotes,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/*get api for challenges */
app.get("/api/challenges", async (req, res) => {
  const { sortBy } = req.query;
  try {
    let challenges;
    if (sortBy === "votes") {
      challenges = await Challenge.find().sort({ upvotes: -1 });
    } else if (sortBy === "createdDate") {
      challenges = await Challenge.find().sort({ createdDate: -1 });
    } else {
      challenges = await Challenge.find();
    }
    res.json({ success: true, challenges });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
