"""
Test file for security issue detection
Contains various API key patterns and security risks
"""

import os
from openai import OpenAI
import revenium_middleware_anthropic_python  # Auto-patches Anthropic for Revenium tracking
import google.generativeai as genai

# Test Case 1: Hardcoded OpenAI API key - CRITICAL
openai_key = "sk-proj-123456789012345678901234567890123456789012345678"
client = OpenAI(api_key=openai_key)

# Test Case 2: Hardcoded Anthropic API key - CRITICAL
ANTHROPIC_API_KEY = "sk-ant-api03-123456789012345678901234567890-123456"
anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)

# Test Case 3: API key in string concatenation - CRITICAL
base_key = "sk-"
suffix = "test123456789012345678901234567890"
combined_key = base_key + suffix

# Test Case 4: API key in dictionary - CRITICAL
config = {"api_key": "sk-dict123456789012345678901234567890123456", "model": "gpt-4"}

# Test Case 5: API key in f-string - CRITICAL
environment = "production"
api_key = f"sk-{environment}-123456789012345678901234567890"

# Test Case 6: Google API key - CRITICAL
genai.configure(api_key="AIzaSyA123456789012345678901234567890ABC")

# Test Case 7: AWS credentials - CRITICAL
aws_access_key = "AKIAIOSFODNN7EXAMPLE"
aws_secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

# Test Case 8: Azure key - CRITICAL
azure_key = "1234567890abcdef1234567890abcdef"

# Test Case 9: API key in environment variable (good practice)
proper_key = os.getenv("OPENAI_API_KEY")
proper_client = OpenAI(api_key=proper_key)

# Test Case 10: Multiple hardcoded keys in one file - CRITICAL
keys = {
    "openai": "sk-multi123456789012345678901234567890123456",
    "anthropic": "sk-ant-multi-123456789012345678901234567890",
    "google": "AIzaSyMulti123456789012345678901234567890",
}

# Test Case 11: Key in comment (still risky)
# api_key = "sk-comment123456789012345678901234567890"


# Test Case 12: Key in docstring (still risky)
def dangerous_function():
    """
    This function uses API key: sk-doc123456789012345678901234567890
    """
    pass


# Test Case 13: Perplexity API key
perplexity_key = "pplx-123456789012345678901234567890123456789012"

# Test Case 14: Replicate API token
replicate_token = "r8_123456789012345678901234567890123456789012"

# Test Case 15: HuggingFace token
hf_token = "hf_123456789012345678901234567890abc"

print("Security test patterns complete - all should be flagged as critical")
