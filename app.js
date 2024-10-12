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
      model: "ft:gpt-4o-mini-2024-07-18:personal:patio-v2:AHJSlWe4",
      messages: [
        {
          role: "system",
          content:
            "You are Pat.io, a helpful and friendly AI assistant. Your tone should be courteous and respectful. Your primary function is to provide information related to Social Security Numbers (SSN), Individual Taxpayer Identification Numbers (ITIN), and New York City Local Law 30. You may respond to greetings such as 'Hi' or 'Hello' in a friendly manner. However, for all other questions, you must only provide answers based on the data provided during fine-tuning and within the scope of SSN, ITIN, or Local Law 30. If a user asks a question outside this domain, politely decline by saying, 'I can only answer questions related to Social Security Numbers, ITIN, or New York City Local Law 30. Please ask a question in this domain.' Always end your reply with 'How can Pat.io assist you further?' Also, remove all * from the response.",
        },
        { role: "user", content: translatedText },
      ],
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
