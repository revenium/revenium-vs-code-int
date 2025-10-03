#!/usr/bin/env python3
"""
Complex OpenAI usage patterns test file
Tests multiple scenarios our detection engine should handle
"""

import os
import asyncio
from typing import List, Dict, Any
import openai
from openai import OpenAI, AsyncOpenAI
import json
import logging

# Test 1: Multiple OpenAI client configurations
openai_client = OpenAI(
    api_key="sk-test12345",  # Security issue: hardcoded key
    base_url="https://api.openai.com/v1",
)

# Test 2: Async OpenAI client
async_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"), timeout=30.0)

# Test 3: Legacy openai module usage (v0.x)
openai.api_key = "sk-legacy-key-123"  # Security issue
openai.organization = "org-123"


# Test 4: Multiple expensive model calls
def expensive_gpt4_calls():
    """Multiple GPT-4 calls without optimization"""

    # Cost issue: No max_tokens limit
    response1 = openai_client.chat.completions.create(
        model="gpt-4",  # Expensive model
        messages=[{"role": "user", "content": "Write a long essay about AI"}],
        # Missing max_tokens - could be very expensive
    )

    # Cost issue: Very high max_tokens
    response2 = openai_client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[{"role": "user", "content": "Translate this text"}],
        max_tokens=4000,  # Very high token limit
    )

    # Cost issue: Multiple calls in loop without rate limiting
    results = []
    for i in range(100):  # Could be very expensive
        result = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": f"Process item {i}"}],
            max_tokens=1000,
        )
        results.append(result)

    return results


# Test 5: Embedding operations (different cost model)
def create_embeddings():
    """Embedding creation that could benefit from batch optimization"""

    texts = [f"Document {i}" for i in range(1000)]  # Large batch

    # Inefficient: Individual embedding calls
    embeddings = []
    for text in texts:
        embedding = openai_client.embeddings.create(
            model="text-embedding-ada-002", input=text
        )
        embeddings.append(embedding.data[0].embedding)

    return embeddings


# Test 6: Streaming responses (different pattern)
def streaming_chat():
    """Streaming chat completion"""

    stream = openai_client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "Tell me a story"}],
        stream=True,
        max_tokens=2000,
    )

    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            print(chunk.choices[0].delta.content, end="")


# Test 7: Function calling (GPT-4 feature)
def function_calling():
    """Function calling with GPT-4"""

    functions = [
        {
            "name": "get_weather",
            "description": "Get the current weather",
            "parameters": {
                "type": "object",
                "properties": {"location": {"type": "string"}},
            },
        }
    ]

    response = openai_client.chat.completions.create(
        model="gpt-4",  # Expensive for function calling
        messages=[{"role": "user", "content": "What's the weather in NYC?"}],
        functions=functions,
        function_call="auto",
    )

    return response


# Test 8: Image generation (DALL-E)
def generate_images():
    """DALL-E image generation - different cost model"""

    response = openai_client.images.generate(
        model="dall-e-3",  # Most expensive image model
        prompt="A futuristic city at sunset",
        size="1024x1024",
        quality="hd",  # Higher cost
        n=1,
    )

    return response.data[0].url


# Test 9: Async operations
async def async_operations():
    """Async OpenAI operations"""

    # Async chat completion
    response = await async_client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": "Hello async world"}],
        max_tokens=100,
    )

    # Async embedding
    embedding = await async_client.embeddings.create(
        model="text-embedding-ada-002", input="Async embedding test"
    )

    return response, embedding


# Test 10: Complex error handling patterns
class OpenAIService:
    """Service class wrapping OpenAI calls"""

    def __init__(self):
        self.client = OpenAI(
            api_key="sk-service-key-456", max_retries=3  # Security issue
        )
        self.logger = logging.getLogger(__name__)

    def generate_completion(self, prompt: str, model: str = "gpt-4") -> str:
        """Generate completion with error handling"""
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1500,  # Could be optimized
            )
            return response.choices[0].message.content
        except Exception as e:
            self.logger.error(f"OpenAI API error: {e}")
            raise

    def batch_process(self, prompts: List[str]) -> List[str]:
        """Batch processing without optimization"""
        results = []
        for prompt in prompts:  # Should use batch processing
            result = self.generate_completion(prompt, "gpt-4-turbo")
            results.append(result)
        return results


# Test 11: Configuration from environment but with fallback
OPENAI_CONFIG = {
    "api_key": os.getenv(
        "OPENAI_API_KEY", "sk-fallback-key-789"
    ),  # Security issue: hardcoded fallback
    "organization": os.getenv("OPENAI_ORG", "org-fallback"),
    "base_url": "https://api.openai.com/v1",
}

configured_client = OpenAI(**OPENAI_CONFIG)


# Test 12: Multiple model types in same file
def multi_model_usage():
    """Using different OpenAI models"""

    # Text completion
    chat_response = openai_client.chat.completions.create(
        model="gpt-3.5-turbo-16k",  # Large context model
        messages=[{"role": "user", "content": "Summarize this document"}],
    )

    # Code completion
    code_response = openai_client.chat.completions.create(
        model="gpt-4",  # Expensive for code
        messages=[{"role": "user", "content": "Write Python code for sorting"}],
    )

    # Embedding
    embedding_response = openai_client.embeddings.create(
        model="text-embedding-3-large",  # New expensive embedding model
        input="Text to embed",
    )

    return chat_response, code_response, embedding_response


if __name__ == "__main__":
    # Execute test functions
    service = OpenAIService()

    # Test expensive operations
    print("Running expensive GPT-4 tests...")
    expensive_gpt4_calls()

    print("Creating embeddings...")
    create_embeddings()

    print("Testing service class...")
    service.generate_completion("Test prompt")

    print("Multi-model usage...")
    multi_model_usage()
