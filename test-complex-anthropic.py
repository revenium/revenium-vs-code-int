#!/usr/bin/env python3
"""
Complex Anthropic Claude usage patterns test file
Tests Anthropic-specific scenarios our detection engine should handle
"""

import os
import asyncio
from typing import List, Dict, Any, Generator
import anthropic
from anthropic import Anthropic, AsyncAnthropic
import json
import logging

# Test 1: Multiple Anthropic client configurations
claude_client = Anthropic(
    api_key="sk-ant-api03-test-key-123", timeout=60.0  # Security issue: hardcoded key
)

# Test 2: Async Anthropic client
async_claude = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"), max_retries=3)


# Test 3: Multiple expensive Claude model calls
def expensive_claude_calls():
    """Multiple Claude calls with expensive models"""

    # Cost issue: Claude-3 Opus (most expensive)
    response1 = claude_client.messages.create(
        model="claude-3-opus-20240229",  # Most expensive model
        max_tokens=4000,  # High token count
        messages=[
            {
                "role": "user",
                "content": "Write a comprehensive analysis of quantum computing",
            }
        ],
    )

    # Cost issue: Multiple expensive calls in loop
    results = []
    for i in range(50):  # Could be very expensive
        result = claude_client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=2000,
            messages=[{"role": "user", "content": f"Analyze document {i}"}],
        )
        results.append(result)

    return results


# Test 4: Streaming responses
def streaming_claude():
    """Streaming Claude responses"""

    with claude_client.messages.stream(
        model="claude-3-sonnet-20240229",
        max_tokens=1000,
        messages=[{"role": "user", "content": "Tell me about AI safety"}],
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)


# Test 5: System prompts (Claude-specific feature)
def system_prompt_usage():
    """Using system prompts with Claude"""

    response = claude_client.messages.create(
        model="claude-3-opus-20240229",  # Expensive model
        max_tokens=2000,
        system="You are a helpful AI assistant specialized in data analysis.",  # System prompt
        messages=[{"role": "user", "content": "Analyze this dataset for trends"}],
    )

    return response


# Test 6: Tool/Function usage (Claude-3 feature)
def claude_tool_usage():
    """Claude with tool usage"""

    tools = [
        {
            "name": "calculator",
            "description": "Perform mathematical calculations",
            "input_schema": {
                "type": "object",
                "properties": {"expression": {"type": "string"}},
            },
        }
    ]

    response = claude_client.messages.create(
        model="claude-3-opus-20240229",  # Expensive for tool usage
        max_tokens=1000,
        tools=tools,
        messages=[{"role": "user", "content": "What's 15% of 240?"}],
    )

    return response


# Test 7: Batch processing without optimization
class ClaudeService:
    """Service class for Claude operations"""

    def __init__(self):
        self.client = Anthropic(
            api_key="sk-ant-hardcoded-key-456", timeout=30.0  # Security issue
        )
        self.logger = logging.getLogger(__name__)

    def generate_response(
        self, prompt: str, model: str = "claude-3-opus-20240229"
    ) -> str:
        """Generate Claude response"""
        try:
            response = self.client.messages.create(
                model=model,
                max_tokens=2000,  # Could be optimized
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text
        except Exception as e:
            self.logger.error(f"Anthropic API error: {e}")
            raise

    def batch_analyze(self, texts: List[str]) -> List[str]:
        """Batch text analysis - not optimized"""
        results = []
        for text in texts:  # Should batch these calls
            result = self.generate_response(
                f"Analyze this text: {text}", "claude-3-opus-20240229"
            )
            results.append(result)
        return results


# Test 8: Different model tiers
def multi_model_claude():
    """Using different Claude model tiers"""

    # Haiku (cheapest)
    haiku_response = claude_client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=500,
        messages=[{"role": "user", "content": "Quick summary please"}],
    )

    # Sonnet (medium)
    sonnet_response = claude_client.messages.create(
        model="claude-3-sonnet-20240229",
        max_tokens=1000,
        messages=[{"role": "user", "content": "Medium complexity analysis"}],
    )

    # Opus (expensive)
    opus_response = claude_client.messages.create(
        model="claude-3-opus-20240229",  # Most expensive
        max_tokens=2000,
        messages=[{"role": "user", "content": "Complex reasoning task"}],
    )

    return haiku_response, sonnet_response, opus_response


# Test 9: Async operations
async def async_claude_operations():
    """Async Claude operations"""

    # Async message creation
    response = await async_claude.messages.create(
        model="claude-3-opus-20240229",  # Expensive async
        max_tokens=1500,
        messages=[{"role": "user", "content": "Async processing test"}],
    )

    # Async streaming
    async with async_claude.messages.stream(
        model="claude-3-sonnet-20240229",
        max_tokens=1000,
        messages=[{"role": "user", "content": "Stream this response"}],
    ) as stream:
        async for text in stream.text_stream:
            print(text, end="")

    return response


# Test 10: Configuration patterns
ANTHROPIC_CONFIG = {
    "api_key": os.getenv(
        "ANTHROPIC_API_KEY", "sk-ant-fallback-key-789"
    ),  # Security issue
    "base_url": "https://api.anthropic.com",
    "timeout": 60.0,
}

configured_claude = Anthropic(**ANTHROPIC_CONFIG)


# Test 11: Long conversations (context management)
def long_conversation():
    """Long multi-turn conversation"""

    conversation = [
        {"role": "user", "content": "Let's discuss quantum physics"},
        {"role": "assistant", "content": "I'd be happy to discuss quantum physics..."},
        {"role": "user", "content": "Explain quantum entanglement"},
        {"role": "assistant", "content": "Quantum entanglement is a phenomenon..."},
        {"role": "user", "content": "How does this relate to quantum computing?"},
    ]

    # Add more turns to make it expensive
    for i in range(10):
        conversation.extend(
            [
                {"role": "user", "content": f"Follow-up question {i}"},
                {"role": "assistant", "content": f"Response to question {i}..."},
            ]
        )

    # Final expensive call with long context
    response = claude_client.messages.create(
        model="claude-3-opus-20240229",  # Expensive with long context
        max_tokens=2000,
        messages=conversation,
    )

    return response


# Test 12: Image analysis (Claude Vision)
def claude_vision_analysis():
    """Claude with image analysis capabilities"""

    # Note: This would require actual image data in real usage
    response = claude_client.messages.create(
        model="claude-3-opus-20240229",  # Vision-capable model
        max_tokens=1000,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Analyze this image"},
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                        },
                    },
                ],
            }
        ],
    )

    return response


if __name__ == "__main__":
    # Execute test functions
    service = ClaudeService()

    print("Testing expensive Claude operations...")
    expensive_claude_calls()

    print("Testing service class...")
    service.generate_response("Test Claude prompt")

    print("Multi-model usage...")
    multi_model_claude()

    print("Long conversation...")
    long_conversation()

    print("Vision analysis...")
    claude_vision_analysis()
