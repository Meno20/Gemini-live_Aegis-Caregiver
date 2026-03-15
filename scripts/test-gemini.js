const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function check() {
  const genAI = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { apiVersion: 'v1alpha' }
  });
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    console.log("Connection OK:", result.response.text());
    
    // Attempt to list models if possible, or just test the ones we are interested in
    const testModels = [
      'gemini-2.0-flash-live-001',
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-2.5-flash-native-audio-latest'
    ];
    
    for (const m of testModels) {
      try {
        const testModel = genAI.getGenerativeModel({ model: m });
        await testModel.generateContent("test");
        console.log(`Model ${m} is AVAILABLE`);
      } catch (e) {
        console.log(`Model ${m} is NOT available:`, e.message);
      }
    }
  } catch (e) {
    console.error("Connection FAILED:", e.message);
  }
}

check();
