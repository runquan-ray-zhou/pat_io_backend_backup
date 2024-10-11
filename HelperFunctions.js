const { SpeechClient } = require("@google-cloud/speech"); // Google Speech-to-Text
const { Translate } = require("@google-cloud/translate").v2; // Google Translation
const textToSpeech = require("@google-cloud/text-to-speech"); // Google Text-to-Speech

// Google Cloud setup: the libraries automatically use the service account credentials
const speechClient = new SpeechClient(); // Google Speech-to-Text client
const translateClient = new Translate(); // Google Translation client
const ttsClient = new textToSpeech.TextToSpeechClient(); // Google Text-to-Speech client

// Helper function: Speech-to-Text (Google Cloud Speech-to-Text API)
async function speechToText(audioBuffer, userLanguage) {
  const request = {
    audio: { content: audioBuffer.toString("base64") }, // Pass the audio buffer
    config: {
      encoding: "LINEAR16",
      sampleRateHertz: 16000,
      languageCode: userLanguage,
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

module.exports = {
  speechToText,
  translateText,
  textToSpeechConversion,
};
