

const basicExample = async () => {
  try {
    const middleware = new PerplexityReveniumMiddleware();
    const model = middleware.getGenerativeModel("sonar-pro");
    const result = await model.createChatCompletion({
      messages: [
        {
          role: "user",
          content: "What is the universe?",
        },
      ],
    });

    const text = result.choices[0]?.message?.content;
    console.log("*** RESPONSE ***");
    console.log(text);
    console.log("✅ Basic Perplexity AI example successful!");
  } catch (error) {
    console.error("❌ Perplexity basic example failed:", error);
    process.exit(1);
  }
};

basicExample();