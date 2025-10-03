import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

import ollama

# Ensure REVENIUM_METERING_API_KEY is set in your .env file
ollama_host = os.getenv("OLLAMA_HOST")
client = ollama.Client(host=ollama_host) if ollama_host else ollama.Client()

response = ollama.chat(
    model='llama3.2:3b',
    messages=[
        {
            'role': 'user',
            'content': 'Please verify you are ready to assist me.',
        },
    ],

    # Optional metadata to send to Revenium for
    # advanced reporting. Uncomment lines
    # as needed for your use case.

    # usage_metadata={
        # "trace_id": "conv-28a7e9d4",
        # "task_type": "analyze-spectral-data",
        # "subscriber": {
        #   "id": "1473847563",
        #   "email": "carol@finoptic.com",
        #   "credential": {
        #     "name": "Engineering API Key",
        #     "value": "hak-abc123456"
        #   }
        # },
        # "organization_id": "Finoptic Labs",
        # "subscription_id": "sub_gold_1234567890",
        # "product_id": "spectral-analyzer-gold",
        # "agent": "chemistry-agent",
    # },

)
print(response['message']['content'])