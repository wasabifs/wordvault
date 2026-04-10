// netlify/functions/translate.js
// Updated: added phonetic, tense, and examples_zh (no more MyMemory dependency)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { word, type } = JSON.parse(event.body || '{}');
  if (!word) return { statusCode: 400, body: JSON.stringify({ error: 'missing word' }) };

  const systemPrompt = `You are an English dictionary assistant. Always respond with valid JSON only. No markdown, no explanation, no code fences.`;

  const userPrompt = type === 'vocab'
    ? `Return a JSON object for the English word "${word}" with these exact keys:
{
  "zh": "中文翻譯（繁體中文）",
  "pos": "詞性，只能是以下之一: n. / v. / adj. / adv. / phr. / 其他",
  "phonetic": "IPA音標，格式如 /wɜːrd/，若不確定填空字串",
  "tense": {
    "past": "過去式（只在pos為v.時填入，否則空字串）",
    "pp": "過去分詞（只在pos為v.時填入，否則空字串）",
    "ing": "現在分詞（只在pos為v.時填入，否則空字串）",
    "sg3": "第三人稱單數（只在pos為v.時填入，否則空字串）"
  },
  "syn": "2~4個同義詞，英文，逗號分隔",
  "ant": "2~4個反義詞，英文，逗號分隔",
  "examples": ["例句1（英文）", "例句2（英文）", "例句3（英文）"],
  "examples_zh": ["例句1繁體中文翻譯", "例句2繁體中文翻譯", "例句3繁體中文翻譯"]
}`
    : `Return a JSON object for the English phrase or grammar pattern "${word}" with these exact keys:
{
  "zh": "中文翻譯（繁體中文）",
  "pos": "詞性，只能是: phr. 或 其他",
  "phonetic": "",
  "tense": { "past": "", "pp": "", "ing": "", "sg3": "" },
  "syn": "",
  "ant": "",
  "examples": ["例句1（英文）", "例句2（英文）", "例句3（英文）"],
  "examples_zh": ["例句1繁體中文翻譯", "例句2繁體中文翻譯", "例句3繁體中文翻譯"]
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const clean = text.replace(/```json|```/gi, '').trim();
    const result = JSON.parse(clean);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error('translate error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'translation failed' }),
    };
  }
};
