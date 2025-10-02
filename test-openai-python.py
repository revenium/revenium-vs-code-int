"""
Test file for OpenAI Python SDK detection and quick fixes
This file contains various OpenAI usage patterns to test detection
"""

# Test Case 1: Direct import - should be detected
import openai

# Test Case 2: From import with OpenAI class - should be detected
from openai import OpenAI
# Ensure REVENIUM_METERING_API_KEY is set in your environment

# Test Case 3: Async client import - should be detected
from openai import AsyncOpenAI

# Test Case 4: Client instantiation without Revenium - should be detected
client = OpenAI(api_key="sk-test123456789012345678901234567890123456")

# Test Case 5: Chat completion without max_tokens - should be detected
response = client.chat.completions.create(
    model="gpt-4",  # Expensive model - should be detected
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello, how are you?"}
    ]
)

# Test Case 6: Streaming without tracking - should be detected
stream_response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Tell me a story"}],
    stream=True
)

# Test Case 7: Embedding call
embedding = client.embeddings.create(
    model="text-embedding-ada-002",
    input="The quick brown fox jumps over the lazy dog"
)

# Test Case 8: Async usage
async def async_example():
    async_client = AsyncOpenAI(api_key="sk-async123456789012345678901234567890")

    response = await async_client.chat.completions.create(
        model="gpt-4-turbo",  # Another expensive model
        messages=[{"role": "user", "content": "Async test"}]
    )
    return response

# Test Case 9: Multiple OpenAI instances (common in real apps)
primary_client = OpenAI(api_key="sk-primary123456789012345678901234567890")
backup_client = OpenAI(api_key="sk-backup123456789012345678901234567890")

# Test Case 10: Error handling missing
try:
    result = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "Test"}]
    )
except Exception as e:
    print(f"Error: {e}")

print("Test file complete - all patterns should be detected")