const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("Welcome to the Patio Backend!");
});

app.get("*", (req, res) => {
  res.status(404).send("Not Found");
});

module.exports = app;
