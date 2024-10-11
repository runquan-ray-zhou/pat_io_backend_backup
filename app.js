const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { OpenAI } = require("openai");
const {
  speechToText,
  translateText,
  textToSpeechConversion,
} = require("./HelperFunctions.js");

// OpenAI setup
const openAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

app.use(cors());
app.use(express.json());

// Chat API endpoint with speech-to-text, translation, and text-to-speech
app.post("/api/chat", async (req, res) => {
  try {
    const { message, audioInput, userLanguage, targetLanguage } = req.body;

    let userText = message;

    // Step 1: If audio input is provided, convert speech to text using Google Speech-to-Text
    if (audioInput) {
      userText = await speechToText(audioInput, userLanguage); // Recognize speech in user's language
      console.log("Converted speech to text:", userText);
    }

    // Step 2: Translate user message to the target language if necessary
    const translatedText = await translateText(userText, targetLanguage); // Translate to target language for OpenAI processing
    console.log("Translated text:", translatedText);

    // Step 3: Send translated text to OpenAI for processing
    const completion = await openAIClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: translatedText }],
    });
    const aiResponse = completion.choices[0].message.content;
    console.log("OpenAI response:", aiResponse);

    // Step 4: Translate OpenAI's response back to the user's language
    const finalResponse = await translateText(aiResponse, userLanguage); // Translate AI response back to user's language
    console.log(
      "Translated AI response back to user's language:",
      finalResponse
    );

    // Step 5: Convert final response to speech using Google Text-to-Speech (optional)
    const speechResponse = await textToSpeechConversion(
      finalResponse,
      userLanguage
    ); // Respond in user's language

    // Return both text and speech versions
    res.json({
      textResponse: finalResponse,
      audioResponse: speechResponse.toString("base64"), // Base64-encoded audio for client-side playback
    });
  } catch (error) {
    console.error("Error processing chat request:", error);
    res.status(500).json({
      error:
        error.message || "An error occurred while processing your request.",
    });
  }
});

module.exports = app;
