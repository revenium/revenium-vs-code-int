import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import required libraries AFTER loading .env
import litellm


# Ensure REVENIUM_METERING_API_KEY and the relevant provider API key
# (e.g., OPENAI_API_KEY) are set in your .env file

response = litellm.completion(
    model="gpt-4o-mini", # Ensure this model's provider key is in .env
    messages=[{ "content": "Please verify you are ready to assist me.","role": "user"}],

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