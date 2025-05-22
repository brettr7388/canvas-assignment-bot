// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const OpenAI = require('openai');
const cors = require('cors'); // Import cors

const app = express();
const port = process.env.PORT || 3001; // Changed from 3000 to 3001

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Read API key from environment variables
});

// Middleware to parse JSON request bodies
app.use(express.json());

// Use cors middleware
app.use(cors());

// Define a POST endpoint to get answers
app.post('/getAnswer', async (req, res) => {
  // Updated: Receive structured data
  const { stem, options } = req.body; 

  if (!stem && (!options || options.length === 0)) {
    return res.status(400).json({ error: 'Question stem or options are required' });
  }

  console.log(`Received question stem: ${stem}`);
  console.log(`Received options: ${options}`);

  let userMessageContent = `Question: ${stem}\n\n`;

  if (options && options.length > 0) {
    userMessageContent += "Options:\n";
    options.forEach(option => {
      userMessageContent += `- ${option}\n`;
    });
    userMessageContent += "\nPlease choose the correct answer from the options provided.";
  } else {
      userMessageContent += "Provide the correct answer.";
  }

  try {
    // Call OpenAI API to get the answer
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Changed model to gpt-4o
      messages: [
        { role: "system", content: "You are a helpful assistant designed to answer quiz questions accurately. If options are provided, select the correct answer ONLY from those options. Provide ONLY the answer without any extra explanation or punctuation unless it is part of the answer." },
        { role: "user", content: userMessageContent },
      ],
      max_tokens: 100, // Limit the response length
    });

    const answer = completion.choices[0]?.message?.content?.trim();

    if (answer) {
      console.log(`Sending answer: ${answer}`);
      res.json({ answer });
    } else {
      console.log('No answer received from OpenAI');
      res.status(500).json({ error: 'Could not get answer from AI' });
    }

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({ error: 'Error processing request' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
