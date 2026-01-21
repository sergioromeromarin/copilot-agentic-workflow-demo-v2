export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function summarizeWithLLM(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return '';
  }

  const baseUrl = (process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages
    })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`LLM request failed (${res.status}): ${txt}`);
  }

  const data = (await res.json()) as any;
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === 'string' ? content : '';
}
