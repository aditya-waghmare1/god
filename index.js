const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// ✅ Ensure API Key is loaded
if (!process.env.API_KEY) {
  throw new Error("API_KEY is missing. Add it to your environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// ✅ Use memory storage (works on Vercel)
const upload = multer({ storage: multer.memoryStorage() });

function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
}

// ✅ Serve index.html (for frontend)
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// ✅ Image description API
app.post('/describe', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = 'Describe the provided image';
    const imagePart = fileToGenerativePart(req.file.buffer, req.file.mimetype);

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    
    res.json({ description: response.text() });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ✅ Start the server (for local testing)
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
