import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

import openai


# Ensure REVENIUM_METERING_API_KEY &
# OPENAI_API_KEY are set in your .env file

response = openai.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {
            "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user",
            "content": "Please verify you are ready to assist me."
        },
    ],
    max_tokens=500,

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

print(response.choices[0].message.content)