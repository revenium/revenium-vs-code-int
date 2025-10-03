

const vertexAI = new VertexAIReveniumMiddlewareV2();
const model = vertexAI.getGenerativeModel("gemini-2.0-flash-001");

try {
  const result = await model.generateContent({
    request: "What is artificial intelligence?",
    role: "user",
  });

  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

  console.log("*** RESPONSE ***");
  console.log(text);
  console.log("✅ Vertex AI basic example successful!");
} catch (error) {
  console.error("❌ Vertex AI basic example failed:", error);
  process.exit(1);
}