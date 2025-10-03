import 'dotenv/config';


async function main() {
  const response = await fetch(`${process.env.LITELLM_PROXY_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`,
      // Optional metadata for enhanced tracking
      'x-revenium-subscriber-id': 'demo-user-123',
      'x-revenium-subscriber-email': 'demo-user@acme.com',
      'x-revenium-subscriber-credential-name': 'api-key',
      'x-revenium-subscriber-credential': 'demo-credential-value',
      'x-revenium-organization-id': 'revenium-demo',
      'x-revenium-task-type': 'chat-completion',
      'x-revenium-product-id': 'my-ai-app',
      'x-revenium-agent': 'openai-assistant'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.'
        },
        {
          role: 'user',
          content: 'Please verify you are ready to assist me.'
        }
      ]
    })
  });

  const data = await response.json();
  console.log(data.choices[0].message.content);
}

main().catch(console.error);