// api/analyze-image.js - Vercel Serverless Function (약 라벨 사진 AI 인식)

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
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: '이미지 데이터가 전달되지 않았습니다.' });
    }

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const finalMimeType = mimeType || 'image/jpeg';

    const prompt = `제공된 약 상자 또는 영양제 라벨 이미지에서 인식할 수 있는 모든 의약품 및 영양제 제품 정보를 추출해 주세요.
반드시 **오직 유효한 JSON 구조**로만 응답해야 합니다.

응답 예시 format:
{
  "summary": "이미지 분석 요약",
  "recognizedItems": [
    {
      "id": "scanned_1",
      "name": "인식된 제품명",
      "englishName": "영문 제품명/성분명",
      "category": "drug 또는 supplement",
      "brand": "제조사/브랜드",
      "activeIngredients": ["성분1 용량", "성분2 용량"],
      "mainEffects": ["주효능1", "주효능2"],
      "dailyRecommendedDose": "권장 복용량",
      "maxDailyDose": "1일 최대 복용량",
      "cautions": ["주의사항1"],
      "foodInteractions": ["피해야할 음식"],
      "targetGroupsToCaution": ["주의 질환"],
      "description": "사진에서 추출한 제품 설명"
    }
  ]
}`;

    let parsedData = null;
    let lastError = null;

    for (const modelName of GEMINI_MODELS) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: finalMimeType,
                    data: cleanBase64
                  }
                }
              ]
            }],
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
      return res.status(500).json({ error: `이미지 인식 분석에 실패했습니다. (${lastError || ''})` });
    }

  } catch (error) {
    console.error('Image Analysis API Error:', error);
    return res.status(500).json({ error: error.message || '이미지 인식에 실패했습니다.' });
  }
}
