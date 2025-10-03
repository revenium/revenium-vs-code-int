"""Quick test file for extension validation"""

from openai import OpenAI

# This should be detected as a security issue
client = OpenAI(api_key="sk-test123456789012345678901234567890")

# This should be detected as expensive model usage
response = client.chat.completions.create(
    model="gpt-4", messages=[{"role": "user", "content": "Hello"}]
)
