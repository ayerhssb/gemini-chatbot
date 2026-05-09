// services/gemini.js
// Wraps Google's Generative AI SDK and prepares conversation context for the model.

const { GoogleGenerativeAI } = require('@google/generative-ai');

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Add it to backend/.env');
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Build the parts array for the latest user turn.
 * Includes text + (optional) inline image + (optional) document context.
 */
function buildUserParts({ text, image, documentText, documentName, isFirstUseOfFiles }) {
  const parts = [];

  // Attach the document context inline on the first message after upload,
  // or every time (cheap + simple). We re-include each turn so Gemini always
  // has the document available without us doing chunking/embeddings.
  if (documentText) {
    parts.push({
      text:
        `[Attached document: ${documentName}]\n` +
        `--- DOCUMENT START ---\n${documentText}\n--- DOCUMENT END ---\n`,
    });
  }

  if (image) {
    parts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.data,
      },
    });
  }

  parts.push({ text: text || '' });
  return parts;
}

/**
 * Convert stored history into Gemini's expected `contents` format.
 * Roles: 'user' | 'model'.
 */
function buildHistory(messages) {
  return messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.text || '' }],
  }));
}

/**
 * Send a message to Gemini with chat context + optional file context.
 *
 * @param {Object} chat - the chat session from chatStore
 * @param {string} userText - new user message
 * @returns {Promise<string>} bot reply text
 */
async function sendMessage(chat, userText) {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction:
      'You are a helpful, concise assistant. When the user attaches a document or image, ' +
      'use it as primary context for answering. If the user asks about a previously uploaded ' +
      'file, refer to it accurately. If no file has been uploaded in this conversation, say so.',
  });

  // History = all stored messages BEFORE this new user turn
  const history = buildHistory(chat.messages);

  const userParts = buildUserParts({
    text: userText,
    image: chat.image,
    documentText: chat.documentText,
    documentName: chat.documentName,
  });

  // Use generateContent with the full contents array (history + new user turn)
  const result = await model.generateContent({
    contents: [...history, { role: 'user', parts: userParts }],
  });

  const response = result.response;
  const reply = response.text();
  return reply;
}

module.exports = { sendMessage, MODEL_NAME };
