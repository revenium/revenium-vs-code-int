# Option A: Google AI SDK (Simple API key setup)

from google import genai

client = genai.Client(api_key="your-google-api-key")

response = client.models.generate_content(
    model="gemini-2.0-flash-001",
    contents="Please verify you are ready to assist me."
)

print(response.text)
print("Google AI SDK example successful!")

# Option B: Vertex AI SDK (Recommended for production)
# import revenium_middleware_google
# import vertexai
# from vertexai.generative_models import GenerativeModel
#
# vertexai.init(project="your-project-id", location="us-central1")
# model = GenerativeModel("gemini-2.0-flash-001")
#
# response = model.generate_content(
#     "Please verify you are ready to assist me."
# )
#
# print(response.text)
# print("Vertex AI SDK example successful!")