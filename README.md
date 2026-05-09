# ✦ Gemini Chatbot

A minimal, end-to-end chatbot built on **Google Gemini**, featuring document Q&A, image understanding, and multi-chat sessions.

Built with a React frontend and an Express Node.js backend using an in-memory state.

---

##  How to Install

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url> gemini-chatbot
   cd gemini-chatbot
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

---

## 🔑 How to set Gemini API key

1. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Navigate to the `backend` folder and copy the example environment file:
   ```bash
   cd backend
   cp .env.example .env
   ```
3. Open the newly created `.env` file and paste your key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

---

## 🏃‍♂️ How to run frontend + backend

You will need to run the frontend and backend simultaneously in two separate terminal windows.

**Terminal 1 (Backend):**
```bash
cd backend
npm start
```
*The backend will listen on `http://localhost:5000`.*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
*The frontend will run on `http://localhost:5173`. Open this URL in your browser to use the app!*

---

## 🧪 Example usage steps

### Example 1: Document Q&A
1. Open the app and click **+ New Chat** in the sidebar.
2. Click the **📄 (Document)** button in the chat bar and upload a PDF or TXT file.
3. Ask the bot: *"Summarize this document"* or *"What are the key takeaways?"*
4. The bot will read your document and reply!

### Example 2: Image Understanding
1. Click **+ New Chat**.
2. Click the **📸 (Camera)** button and upload an image (PNG or JPG).
3. Ask the bot: *"Describe what is happening in this image"* or *"Is there a dog in this picture?"*
4. The bot will analyze the image and respond


