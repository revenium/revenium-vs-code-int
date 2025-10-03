
// Option 1: For Gemini v2 models (gemini-2.0-flash-001)
const googleAI = new GoogleAiReveniumMiddleware();
const model = googleAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

// Option 2: For Gemini v1 models (gemini-1.5-pro, gemini-1.5-flash)
// const googleAI = new GoogleAiReveniumMiddlewareV1();
// const model = googleAI.getGenerativeModel({ model: "gemini-1.5-pro" });

try {
  const result = await model.generateContent("what is the universe");
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  console.log("*** RESPONSE ***");
  console.log(text);
  console.log("✅ Basic Google AI example successful!");
} catch (error) {
  console.error("❌ Google basic example failed:", error);
  process.exit(1);
}