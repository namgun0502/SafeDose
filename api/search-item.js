// api/search-item.js - Vercel Serverless Function (AI 약물/영양제 정밀 검색)

const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API 키가 Vercel 환경 변수에 설정되어 있지 않습니다.' });
  }

  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: '검색어를 입력해 주세요.' });
    }

    const prompt = `사용자가 의약품 또는 건강기능식품(영양제) 이름/성분으로 "${query}"를 검색했습니다.
이 제품 또는 성분에 대한 세부 정보를 정확하게 분석하여 **오직 유효한 JSON 형식**으로만 응답해 주세요. 다른 설명글이나 마크다운 서식 문자는 일절 포함하지 마세요.

JSON 응답 형식 규격:
{
  "id": "검색어 기반 영문 고유ID (예: tylenol_custom)",
  "name": "정확한 제품명 또는 대표 성분명 (한국어)",
  "englishName": "영문 제품명 또는 성분명",
  "category": "drug" 또는 "supplement",
  "brand": "제조사 또는 브랜드명",
  "activeIngredients": ["주성분1 용량", "주성분2 용량"],
  "mainEffects": ["주요 효능1", "주요 효능2", "주요 효능3"],
  "dailyRecommendedDose": "권장 복용량 및 횟수 (예: 1일 1~2회, 1회 1정)",
  "maxDailyDose": "1일 최대 복용 한선",
  "cautions": ["주의사항1", "주의사항2"],
  "foodInteractions": ["피해야 할 음식/음료"],
  "targetGroupsToCaution": ["주의해야 할 질환/상태"],
  "description": "한 줄 요약 설명"
}`;

    let parsedData = null;
    let lastError = null;

    for (const modelName of GEMINI_MODELS) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json"
            }
          })
        });

        const data = await response.json();
        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          parsedData = JSON.parse(data.candidates[0].content.parts[0].text);
          break;
        } else {
          lastError = data.error?.message;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (parsedData) {
      return res.status(200).json(parsedData);
    } else {
      return res.status(500).json({ error: `약물 정밀 검색에 실패했습니다. (${lastError || ''})` });
    }

  } catch (error) {
    console.error('Search API Error:', error);
    return res.status(500).json({ error: error.message || '약물 정보 정밀 검색에 실패했습니다.' });
  }
}
