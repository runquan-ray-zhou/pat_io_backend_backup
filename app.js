const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");
const { SpeechClient } = require("@google-cloud/speech"); // Google Speech-to-Text
const { Translate } = require("@google-cloud/translate").v2; // Google Translation
const textToSpeech = require("@google-cloud/text-to-speech"); // Google Text-to-Speech
require("dotenv").config();

// OpenAI setup
const openAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Google Cloud setup: the libraries automatically use the service account credentials
const speechClient = new SpeechClient(); // Google Speech-to-Text client
const translateClient = new Translate(); // Google Translation client
const ttsClient = new textToSpeech.TextToSpeechClient(); // Google Text-to-Speech client

const app = express();

app.use(cors());
app.use(express.json());

// Endpoint to test the server
app.get("/", (req, res) => {
  res.status(200).send("Welcome to the Patio Backend!");
});

// Helper function: Speech-to-Text (Google Cloud Speech-to-Text API)
async function speechToText(audioBuffer) {
  const request = {
    audio: { content: audioBuffer.toString("base64") }, // Pass the audio buffer
    config: {
      encoding: "LINEAR16",
      sampleRateHertz: 16000,
      languageCode: "en-US",
    }, // Config for the speech recognition
  };
  const [response] = await speechClient.recognize(request); // Google API call
  return response.results
    .map((result) => result.alternatives[0].transcript)
    .join("\n");
}

// Helper function: Text Translation (Google Cloud Translation API)
async function translateText(text, targetLanguage) {
  const [translation] = await translateClient.translate(text, targetLanguage); // Google API call
  return translation;
}

// Helper function: Text-to-Speech (Google Cloud Text-to-Speech API)
async function textToSpeechConversion(text, languageCode = "en-US") {
  const request = {
    input: { text },
    voice: { languageCode, ssmlGender: "NEUTRAL" },
    audioConfig: { audioEncoding: "MP3" },
  };
  const [response] = await ttsClient.synthesizeSpeech(request); // Google API call
  return response.audioContent; // Audio in binary format
}

// Chat API endpoint with speech-to-text, translation, and text-to-speech
app.post("/api/chat", async (req, res) => {
  try {
    const { message, audioInput, userLanguage, targetLanguage } = req.body;

    let userText = message;

    // Step 1: If audio input is provided, convert speech to text using Google Speech-to-Text
    if (audioInput) {
      userText = await speechToText(audioInput); // Google API usage
      console.log("Converted speech to text:", userText);
    }

    // Step 2: Translate user message to the target language using Google Translation
    const translatedText = await translateText(userText, targetLanguage); // Google API usage
    console.log("Translated text:", translatedText);

    // Step 3: Send translated text to OpenAI for processing
    const completion = await openAIClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: translatedText }],
    });
    const aiResponse = completion.choices[0].message.content;
    console.log("OpenAI response:", aiResponse);

    // Step 4: Translate OpenAI's response back to the user's language using Google Translation
    const finalResponse = await translateText(aiResponse, userLanguage); // Google API usage
    console.log(
      "Translated AI response back to user's language:",
      finalResponse
    );

    // Step 5: Convert final response to speech using Google Text-to-Speech (optional)
    const speechResponse = await textToSpeechConversion(
      finalResponse,
      userLanguage
    ); // Google API usage

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

app.get("*", (req, res) => {
  res.status(404).send("Not Found");
});

module.exports = app;
