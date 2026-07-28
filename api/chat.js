// api/chat.js - Vercel Serverless Function (AI 약사 상담 - 다중 Gemini 모델 폴백 지원)

const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.0-pro'
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
    const { message, history, userProfile, cabinetItems } = req.body;

    const cabinetSummary = cabinetItems && cabinetItems.length > 0
      ? cabinetItems.map(item => `- ${item.name} (${item.category === 'drug' ? '의약품' : '영양제'}, 성분: ${item.activeIngredients ? item.activeIngredients.join(', ') : '정보 없음'})`).join('\n')
      : '현재 보관함에 등록된 약/영양제 없음';

    const profileSummary = userProfile && userProfile.conditions && userProfile.conditions.length > 0
      ? `사용자 기저질환/상태: ${userProfile.conditions.join(', ')}`
      : '특별한 기저질환 설정 없음';

    const systemPrompt = `당신은 친절하고 전문적인 SafeDose AI 약사입니다.
사용자의 질문에 대해 쉽고 정확하게 답변해 주세요.
사용자는 전문가가 아닌 일반인이므로 쉬운 비유와 일상 언어를 사용하세요.

[현재 사용자 상태]
${profileSummary}

[현재 복용 중인 약물/영양제 목록]
${cabinetSummary}

[답변 작성 수칙]
1. 답변은 반드시 친절하고 명확한 한국어로 작성하세요.
2. 약물 간 상극, 복용법, 음식과의 상호작용을 중심으로 설명하세요.
3. 복용 중인 약이 있다면 해당 약과 문의한 내용 간의 부작용이나 주의사항을 우선적으로 짚어주세요.
4. 답변 끝에는 항상 "본 답변은 참고용이며, 정확한 처방 및 복용 지침은 의사 또는 약사와 상의하세요."라는 문구를 포함하세요.`;

    const contents = [];
    
    if (history && Array.isArray(history)) {
      history.forEach(chat => {
        contents.push({
          role: chat.role === 'user' ? 'user' : 'model',
          parts: [{ text: chat.text }]
        });
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\n[사용자 질문]\n${message}` }]
    });

    let replyText = null;
    let lastError = null;

    // 사용 가능한 모델 순차 시도 (Fallback)
    for (const modelName of GEMINI_MODELS) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) break; // 성공 시 루프 탈출
        } else {
          const errData = await response.json();
          lastError = errData.error?.message || response.statusText;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (replyText) {
      return res.status(200).json({ reply: replyText });
    } else {
      return res.status(429).json({ error: `현재 모든 Gemini 모델 호출 사용량이 초과되었습니다. 잠시 후 다시 시도해 주세요! (${lastError || ''})` });
    }

  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({ error: error.message || '서버 오류가 발생했습니다.' });
  }
}
