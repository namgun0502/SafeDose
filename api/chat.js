// api/chat.js - Vercel Serverless Function (Gemini 정식 규격 100% AI 약사 상담)

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
    const { message, history, userProfile, cabinetItems } = req.body;

    const cabinetSummary = cabinetItems && cabinetItems.length > 0
      ? cabinetItems.map(item => `- ${item.name} (성분: ${item.activeIngredients ? item.activeIngredients.join(', ') : '정보없음'})`).join('\n')
      : '등록된 약물 없음';

    const profileSummary = userProfile && userProfile.conditions && userProfile.conditions.length > 0
      ? `기저질환/상태: ${userProfile.conditions.join(', ')}`
      : '기저질환 설정 없음';

    const systemPrompt = `당신은 전문적이고 친절한 SafeDose AI 약사입니다.
[현재 사용자 상태]
${profileSummary}

[현재 복용 중인 약물/영양제 목록]
${cabinetSummary}

[수칙]
1. 사용자 질문에 대해 친절하게 전문 약학 정보에 기반하여 답변하세요.
2. 약물 간 상극, 복용 시간, 주의사항을 명확히 안내하세요.
3. 답변 마무리에 "본 답변은 참고용이며 전문 의사/약사와 상의하세요"를 포함하세요.`;

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

        const data = await response.json();

        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          replyText = data.candidates[0].content.parts[0].text;
          break;
        } else {
          lastError = data.error?.message || response.statusText;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (replyText) {
      return res.status(200).json({ reply: replyText });
    } else {
      return res.status(500).json({ 
        error: `AI 응답 실패: ${lastError || 'Gemini API 키 사용량 초과 또는 키 오류입니다. 구글 AI 스튜디오에서 새 키를 생성해 주세요.'}` 
      });
    }

  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({ error: error.message || '서버 오류가 발생했습니다.' });
  }
}
