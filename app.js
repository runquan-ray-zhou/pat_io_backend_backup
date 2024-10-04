const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");
require("dotenv").config();

const openAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("Welcome to the Patio Backend!");
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    console.log("Received message:", message);

    const completion = await openAIClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    });

    console.log("OpenAI response:", completion.choices[0].message.content);
    res.json({ message: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error processing chat request:", error);
    res.status(500).json({
      error:
        error.message || "An error occurred while processing your request.",
    });
  }
});

app.get("*", (req, res) => {
  res.status(404).send("Not Found");
});

module.exports = app;
