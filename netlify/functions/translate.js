exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  let body;
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { word, type } = body;
  if (!word || typeof word !== 'string' || word.length > 100) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid input' }) };
  }

  const isPhrase = type === 'phrase';
  const prompt = isPhrase
    ? `你是英文學習助手。請針對英文片語「${word}」，以 JSON 格式回傳（只輸出 JSON，不要其他說明）：
{"zh":"繁體中文翻譯（10字以內）","pos":"phr.","examples":["完整英文例句1","完整英文例句2","完整英文例句3"]}`
    : `你是英文學習助手。請針對英文單字「${word}」，以 JSON 格式回傳（只輸出 JSON，不要其他說明）：
{"zh":"繁體中文翻譯（最常用意思，10字以內）","pos":"詞性，只能是 n. v. adj. adv. 其中一個","syn":"3-4個同義詞，英文逗號分隔","ant":"2-3個反義詞，英文逗號分隔（若無則空字串）","examples":["包含該單字的完整英文例句1","例句2","例句3"]}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    if (!Array.isArray(result.examples)) result.examples = [];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Translation failed' }) };
  }
};
