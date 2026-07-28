# SafeDose Checker — 재구성 계획서

## 작성일
2026-07-28

## 목표
Vercel 배포된 React 기반 SafeDose 앱을 순수 HTML/CSS/JS + Vercel Serverless Functions 구조로 완전 재구성

## 기술 스택
- Frontend: 순수 HTML5 + Vanilla CSS (다크모드) + Vanilla JavaScript
- Backend API: Vercel Serverless Functions (Node.js)
- AI: Google Gemini 2.0 Flash API (GEMINI_API_KEY 환경변수)
- 배포: GitHub → Vercel 자동 배포

## 파일 구조
```
safedose/
├── index.html              ← 메인 앱 HTML
├── style.css               ← 프리미엄 다크모드 디자인
├── app.js                  ← 프론트엔드 로직 + 약물 DB + 분석 엔진
├── api/
│   ├── chat.js             ← AI 약사 상담 (Gemini)
│   ├── analyze-image.js    ← 약 라벨 사진 인식 (Gemini Vision)
│   └── search-item.js      ← AI 약물 정밀 검색 (Gemini)
└── docs/plans/
    └── 01_safedose_reconstruction_plan.md
```

## 핵심 기능
1. 약물/영양제 검색 (내장 DB 20종 + AI 정밀 검색)
2. 복용 보관함 관리
3. 오프라인 상호작용 분석 엔진 (규칙 기반, 즉시 실행)
4. AI 약사 채팅 상담 (Gemini API)
5. 약 라벨 사진 인식 (Gemini Vision API)
6. 내 질환/상태 설정 (맞춤 경고)
7. 스마트 복용 시간표 생성

## 주요 상호작용 규칙 (로컬 분석)
- 와파린 + 아스피린/오메가3/홍삼 = 출혈 위험 🔴
- 와파린 + 성요한풀 = 약효 급감 🔴
- 칼슘 + 철분 = 흡수 방해 🟡
- 칼슘 + 씬지로이드 = 갑상선약 흡수 방해 🟡
- 비타민C + 철분 = 시너지 🟢
- 칼슘 + 비타민D + 마그네슘 = 뼈 건강 황금 트리오 🟢
