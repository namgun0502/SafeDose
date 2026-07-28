// app.js - SafeDose 프론트엔드 핵심 로직 및 오프라인 규칙 기반 상호작용 엔진

// ==========================================
// 1. 내장 약물 및 영양제 데이터베이스 (20종)
// ==========================================
const MEDICINE_DATABASE = [
  {
    id: "tylenol",
    name: "타이레놀정 500mg",
    englishName: "Tylenol (Acetaminophen)",
    category: "drug",
    brand: "한국존슨앤드존슨",
    activeIngredients: ["아세트아미노펜 500mg"],
    mainEffects: ["해열", "두통 완화", "치통"],
    dailyRecommendedDose: "1회 1~2정, 1일 3~4회",
    maxDailyDose: "4,000mg (8정)",
    cautions: ["음주 후 복용 시 간 손상 위험", "종합감기약과 중복 복용 주의"],
    foodInteractions: ["알코올", "카페인"],
    targetGroupsToCaution: ["liver_disease"],
    description: "대표적인 아세트아미노펜 성분의 해열진통제입니다."
  },
  {
    id: "ibuprofen",
    name: "이부프로펜 (애드빌/이지엔6)",
    englishName: "Ibuprofen",
    category: "drug",
    brand: "화이자 / 대웅제약",
    activeIngredients: ["이부프로펜 200mg"],
    mainEffects: ["소염진통", "생리통", "관절염"],
    dailyRecommendedDose: "1회 200~400mg, 식후 복용",
    maxDailyDose: "1,200mg",
    cautions: ["위장 장애 가능성이 있으므로 식후 복용", "아스피린과 병용 시 출혈 위험"],
    foodInteractions: ["알코올"],
    targetGroupsToCaution: ["stomach_ulcer", "kidney_disease", "pregnant"],
    description: "NSAIDs 계열 소염진통제로 염증과 통증을 완화합니다."
  },
  {
    id: "aspirin",
    name: "아스피린 프로텍트정 100mg",
    englishName: "Aspirin (Low Dose)",
    category: "drug",
    brand: "바이엘",
    activeIngredients: ["아스피린 100mg"],
    mainEffects: ["혈전 예방", "심혈관 질환 관리"],
    dailyRecommendedDose: "1일 1회 1정",
    maxDailyDose: "100mg",
    cautions: ["수술 전 최소 7일간 중단 필요", "오메가3, 홍삼과 복용 시 멍/출혈 위험"],
    foodInteractions: ["알코올", "자몽주스"],
    targetGroupsToCaution: ["surgery_upcoming", "stomach_ulcer"],
    description: "심혈관 질환 예방 및 혈전 억제를 위한 저용량 아스피린입니다."
  },
  {
    id: "warfarin",
    name: "와파린정 (항응고제)",
    englishName: "Warfarin",
    category: "drug",
    brand: "CJ헬스케어",
    activeIngredients: ["와파린나트륨"],
    mainEffects: ["혈전증 치료 및 예방"],
    dailyRecommendedDose: "의사 처방 용량 엄수",
    maxDailyDose: "처방 준수",
    cautions: ["비타민K 복용 시 약효 상쇄", "오메가3, 홍삼 동시 복용 시 출혈 극대화"],
    foodInteractions: ["비타민K 풍부 식품 (시금치, 브로콜리)", "청국장", "녹차"],
    targetGroupsToCaution: ["pregnant", "surgery_upcoming"],
    description: "강력한 항응고제로 다양한 영양제와 상극 반응이 있습니다."
  },
  {
    id: "synthyroid",
    name: "씬지로이드정 (갑상선호르몬제)",
    englishName: "Synthyroid (Levothyroxine)",
    category: "drug",
    brand: "부광약품",
    activeIngredients: ["레보티록신나트륨"],
    mainEffects: ["갑상선 기능 저하증 치료"],
    dailyRecommendedDose: "1일 1회 아침 공복 (식전 30분~1시간)",
    maxDailyDose: "처방 준수",
    cautions: ["칼슘, 철분제와 복용 시 흡수율 급감 (4시간 간격 필요)"],
    foodInteractions: ["커피", "우유", "두유"],
    targetGroupsToCaution: [],
    description: "아침 공복에 물과 함께 복용해야 하는 갑상선 호르몬제입니다."
  },
  {
    id: "gelfos",
    name: "겔포스 / 알마겔 (제산제)",
    englishName: "Antacid (Gelfos)",
    category: "drug",
    brand: "보령제약",
    activeIngredients: ["알마게이트 / 인산알루미늄"],
    mainEffects: ["위산 과다 완화", "속쓰림 개선"],
    dailyRecommendedDose: "1일 3~4회 식간 복용",
    maxDailyDose: "4포",
    cautions: ["다른 약물 및 철분제 흡수를 방해하므로 2시간 간격 유지"],
    foodInteractions: ["산성 음료"],
    targetGroupsToCaution: ["kidney_disease"],
    description: "위산을 중화하는 제산제로 타 약물의 흡수를 막을 수 있습니다."
  },
  {
    id: "omega3",
    name: "rTG 오메가3 (EPA/DHA)",
    englishName: "Omega-3",
    category: "supplement",
    brand: "종근당건강 / 다수",
    activeIngredients: ["EPA 600mg", "DHA 400mg"],
    mainEffects: ["혈행 개선", "중성지질 개선"],
    dailyRecommendedDose: "1일 1,000mg (식후 복용)",
    maxDailyDose: "3,000mg",
    cautions: ["아스피린, 와파린과 복용 시 출혈 경향 증가"],
    foodInteractions: ["지방질 식사와 복용 권장"],
    targetGroupsToCaution: ["surgery_upcoming"],
    description: "혈행 개선과 눈 건강에 우수한 대표 지방산 영양제입니다."
  },
  {
    id: "calcium",
    name: "칼슘 & 비타민D 복합제",
    englishName: "Calcium & Vitamin D",
    category: "supplement",
    brand: "세노비스 / 다수",
    activeIngredients: ["해조칼슘 600mg", "비타민D3 1000IU"],
    mainEffects: ["뼈와 치아 형성", "골다공증 예방"],
    dailyRecommendedDose: "1일 1~2정 (식후 복용)",
    maxDailyDose: "2,500mg",
    cautions: ["철분제와 동시에 먹으면 서로 흡수 억제 (아침/저녁 분리)"],
    foodInteractions: ["시금치", "카페인"],
    targetGroupsToCaution: ["kidney_disease"],
    description: "뼈 건강 필수 영양제로 철분제 및 갑상선약과 시차를 두어야 합니다."
  },
  {
    id: "iron",
    name: "철분제 (헤모글로빈)",
    englishName: "Iron Supplement",
    category: "supplement",
    brand: "솔가 / 대웅",
    activeIngredients: ["글루콘산철 30mg", "비타민C 100mg"],
    mainEffects: ["체내 산소 운반", "빈혈 예방"],
    dailyRecommendedDose: "1일 1회 복용",
    maxDailyDose: "45mg",
    cautions: ["비타민C와 먹으면 흡수 증대(좋음)", "칼슘, 커피, 녹차와 먹으면 흡수 방해"],
    foodInteractions: ["녹차", "커피", "우유"],
    targetGroupsToCaution: ["stomach_ulcer"],
    description: "빈혈 예방에 필수적이나 칼슘 및 카페인과 상극입니다."
  },
  {
    id: "vitamin_c",
    name: "비타민 C 1000mg",
    englishName: "Vitamin C 1000mg",
    category: "supplement",
    brand: "고려은단 / 다수",
    activeIngredients: ["비타민C 1000mg"],
    mainEffects: ["항산화 작용", "유해산소 차단"],
    dailyRecommendedDose: "1일 1,000mg (식후 즉시)",
    maxDailyDose: "2,000mg",
    cautions: ["공복 복용 시 속쓰림 유발 가능", "철분제 흡수를 돕는 찰떡궁합"],
    foodInteractions: ["물 충분히 섭취"],
    targetGroupsToCaution: ["stomach_ulcer"],
    description: "대표 수용성 항산화 비타민으로 철분 흡수를 촉진합니다."
  },
  {
    id: "vitamin_d",
    name: "비타민 D3 2000IU",
    englishName: "Vitamin D3",
    category: "supplement",
    brand: "닥터스베스트",
    activeIngredients: ["비타민D3 2000IU"],
    mainEffects: ["칼슘 흡수 촉진", "면역 증진"],
    dailyRecommendedDose: "1일 1,000~2,000IU",
    maxDailyDose: "4,000IU",
    cautions: ["지용성이므로 식후 지방식과 복용 시 흡수율 50% 상승"],
    foodInteractions: ["기름진 식사"],
    targetGroupsToCaution: [],
    description: "칼슘 흡수를 돕는 미네랄 지용성 비타민입니다."
  },
  {
    id: "probiotics",
    name: "유산균 (프로바이오틱스)",
    englishName: "Probiotics",
    category: "supplement",
    brand: "락토핏 / 듀오락",
    activeIngredients: ["프로바이오틱스 100억 CFU"],
    mainEffects: ["장 건강", "유익균 증식"],
    dailyRecommendedDose: "1일 1회 아침 공복",
    maxDailyDose: "100억 CFU",
    cautions: ["항생제 복용 시 유산균 사멸하므로 2~3시간 차이 두고 복용"],
    foodInteractions: ["뜨거운 물 (유산균 사멸)"],
    targetGroupsToCaution: [],
    description: "장내 유익균을 늘려 배변활동을 원활하게 해줍니다."
  },
  {
    id: "magnesium",
    name: "마그네슘 300mg",
    englishName: "Magnesium",
    category: "supplement",
    brand: "Bluebonnet",
    activeIngredients: ["마그네슘 300mg"],
    mainEffects: ["근육 이완", "신경 안정을 통한 숙면"],
    dailyRecommendedDose: "1일 300mg (취침 전)",
    maxDailyDose: "350mg",
    cautions: ["과다 복용 시 묽은 변/설사 유발 가능"],
    foodInteractions: ["카페인 (마그네슘 배출)"],
    targetGroupsToCaution: ["kidney_disease"],
    description: "근육 이완과 신경 안정을 도와주는 미네랄입니다."
  },
  {
    id: "red_ginseng",
    name: "홍삼 추출물",
    englishName: "Red Ginseng",
    category: "supplement",
    brand: "정관장 / 다수",
    activeIngredients: ["진세노사이드 10mg"],
    mainEffects: ["피로 개선", "면역력 증진"],
    dailyRecommendedDose: "1일 1회",
    maxDailyDose: "15mg",
    cautions: ["항응고제(와파린, 아스피린) 복용 시 출혈 위험", "수술 전 2주 중단"],
    foodInteractions: ["카페인"],
    targetGroupsToCaution: ["hypertension", "diabetes", "surgery_upcoming"],
    description: "피로 회복 대표 기능성 식품이나 항응고제와 상극입니다."
  },
  {
    id: "st_johns_wort",
    name: "성요한풀 (서양고추나물)",
    englishName: "St. John's Wort",
    category: "supplement",
    brand: "해외직구 / 훼라민큐",
    activeIngredients: ["히페리신 0.3mg"],
    mainEffects: ["우울감 개선", "수면 장애 완화"],
    dailyRecommendedDose: "1일 300mg",
    maxDailyDose: "900mg",
    cautions: ["상극 끝판왕: 간 대사효소를 활성화하여 피임약, 와파린 약효 대폭 감소"],
    foodInteractions: ["햇빛 과다 노출"],
    targetGroupsToCaution: [],
    description: "각종 약물의 대사를 촉진하여 약효를 떨어뜨리는 대표적인 상극 영양제입니다."
  }
];

// 기저질환 옵션 데이터
const HEALTH_CONDITIONS = [
  { id: "pregnant", label: "임신 / 임신 가능성" },
  { id: "breastfeeding", label: "수유 중" },
  { id: "hypertension", label: "고혈압" },
  { id: "diabetes", label: "당뇨병" },
  { id: "liver_disease", label: "간 질환 / 간수치 높음" },
  { id: "kidney_disease", label: "신장 질환 / 신부전" },
  { id: "stomach_ulcer", label: "위장 장애 / 위궤양" },
  { id: "surgery_upcoming", label: "수술 / 시술 예정 (2주 내)" }
];

// 대표적인 빠른 시도 조합 4선
const PRESET_COMBOS = [
  {
    title: "🚨 위험 상극 조합 (와파린 + 아스피린 + 오메가3)",
    items: ["warfarin", "aspirin", "omega3"],
    desc: "피가 너무 묽어져 장기 출혈 위험극대화"
  },
  {
    title: "⚠️ 흡수 방해 조합 (칼슘 + 철분 + 씬지로이드)",
    items: ["calcium", "iron", "synthyroid"],
    desc: "서로 장내 흡수를 방해하여 약효 상쇄"
  },
  {
    title: "✨ 찰떡궁합 시너지 (비타민C + 철분 + 비타민D)",
    items: ["vitamin_c", "iron", "vitamin_d", "calcium"],
    desc: "비타민C가 철분 흡수를 높이고 D가 칼슘 흡수 유도"
  },
  {
    title: "💊 일반 감기/진통 조합 (타이레놀 + 이부프로펜)",
    items: ["tylenol", "ibuprofen"],
    desc: "아세트아미노펜과 소염진통제 교차 복용 시 간/위장 체크"
  }
];

// ==========================================
// 2. 앱 전역 상태 (Global State)
// ==========================================
let currentCabinet = [];
let userConditions = new Set();
let chatHistory = [];
let lastAnalysisReport = null;

// ==========================================
// 3. 초기화 및 이벤트 리스너 등록
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  renderSearchTags();
  renderSearchResults(MEDICINE_DATABASE);
  renderConditionsGrid();
  renderPresetCombos();
  setupEventListeners();
});

function setupEventListeners() {
  // 검색어 입력
  document.getElementById("input-search").addEventListener("input", (e) => {
    filterSearchResults(e.target.value);
  });

  // 카테고리 탭 클릭
  document.querySelectorAll(".category-tabs .tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".category-tabs .tab-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      const category = e.target.dataset.category;
      const query = document.getElementById("input-search").value;
      filterSearchResults(query, category);
    });
  });

  // 보관함 전체 비우기
  document.getElementById("btn-clear-cabinet").addEventListener("click", () => {
    currentCabinet = [];
    renderCabinet();
    document.getElementById("section-report").style.display = "none";
  });

  // 상호작용 정밀 분석 실행 버튼
  document.getElementById("btn-run-analysis").addEventListener("click", runInteractionCheck);

  // 모달 열기 버튼들
  document.getElementById("btn-health-profile").addEventListener("click", () => openModal("modal-profile"));
  document.getElementById("btn-pharmacist-chat").addEventListener("click", () => openModal("modal-chat"));
  document.getElementById("btn-camera-scanner").addEventListener("click", () => openModal("modal-scanner"));

  // 모달 닫기
  document.querySelectorAll(".close-modal").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const modal = e.target.closest(".modal-overlay");
      if (modal) modal.classList.remove("active");
    });
  });

  // AI 채팅 전송
  document.getElementById("btn-send-chat").addEventListener("click", handleSendChat);
  document.getElementById("input-chat-msg").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSendChat();
  });

  // 사진 인식 파일 선택 및 드롭존
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-scanner-input");

  dropZone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", handleFileSelect);

  document.getElementById("btn-analyze-image").addEventListener("click", handleImageAnalysis);

  // 리포트 탭 전환
  document.querySelectorAll("[data-report-tab]").forEach(tabBtn => {
    tabBtn.addEventListener("click", (e) => {
      document.querySelectorAll("[data-report-tab]").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      const tabName = e.target.dataset.reportTab;
      renderReportTabContent(tabName);
    });
  });

  // 리포트 복사 버튼
  document.getElementById("btn-copy-report").addEventListener("click", copyReportToClipboard);
}

// ==========================================
// 4. UI 렌더링 함수들
// ==========================================
function renderSearchTags() {
  const container = document.getElementById("tag-cloud");
  const tags = ["타이레놀", "이부프로펜", "아스피린", "와파린", "오메가3", "칼슘", "철분", "비타민C", "비타민D", "유산균", "홍삼", "성요한풀"];
  
  container.innerHTML = tags.map(tag => `
    <button class="tag-item" onclick="selectSearchTag('${tag}')">#${tag}</button>
  `).join("");
}

function selectSearchTag(tag) {
  const input = document.getElementById("input-search");
  input.value = tag;
  filterSearchResults(tag);
}

function filterSearchResults(query = "", category = "all") {
  const activeTab = document.querySelector(".category-tabs .tab-btn.active");
  const selectedCategory = category !== "all" ? category : (activeTab ? activeTab.dataset.category : "all");

  const filtered = MEDICINE_DATABASE.filter(item => {
    const matchCat = selectedCategory === "all" || item.category === selectedCategory;
    const matchText = !query.trim() || 
      item.name.toLowerCase().includes(query.toLowerCase()) || 
      item.englishName.toLowerCase().includes(query.toLowerCase()) ||
      item.activeIngredients.some(ing => ing.toLowerCase().includes(query.toLowerCase()));
    
    return matchCat && matchText;
  });

  renderSearchResults(filtered);
}

function renderSearchResults(items) {
  const grid = document.getElementById("search-results-grid");
  
  if (items.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">일치하는 약물/영양제가 없습니다.</div>`;
    return;
  }

  grid.innerHTML = items.map(item => {
    const isAdded = currentCabinet.some(c => c.id === item.id);
    const categoryBadge = item.category === "drug" 
      ? `<span class="badge-category badge-drug">처방약</span>`
      : `<span class="badge-category badge-supplement">영양제</span>`;

    return `
      <div class="item-card">
        <div>
          <div class="item-card-header">
            ${categoryBadge}
            <span style="font-size:0.7rem; color:var(--text-dim);">${item.brand || ''}</span>
          </div>
          <div class="item-name">${item.name}</div>
          <div class="item-eng">${item.englishName}</div>
          <div class="item-ingredients">성분: ${item.activeIngredients.join(", ")}</div>
        </div>
        <div class="item-footer">
          <button class="btn btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.75rem;" onclick="addToCabinet('${item.id}')" ${isAdded ? 'disabled' : ''}>
            ${isAdded ? '✓ 담김' : '+ 보관함 담기'}
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function addToCabinet(itemId) {
  const item = MEDICINE_DATABASE.find(m => m.id === itemId);
  if (item && !currentCabinet.some(c => c.id === itemId)) {
    currentCabinet.push(item);
    renderCabinet();
    filterSearchResults(document.getElementById("input-search").value);
  }
}

function removeFromCabinet(itemId) {
  currentCabinet = currentCabinet.filter(c => c.id !== itemId);
  renderCabinet();
  filterSearchResults(document.getElementById("input-search").value);
}

function renderCabinet() {
  const container = document.getElementById("cabinet-items-list");
  document.getElementById("cabinet-count").textContent = currentCabinet.length;

  if (currentCabinet.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:2rem 1rem; color:var(--text-dim); border:1px dashed var(--card-border); border-radius:var(--radius-md);">
        보관함이 비어있습니다.<br>왼쪽에서 약 또는 영양제를 추가해주세요.
      </div>
    `;
    return;
  }

  container.innerHTML = currentCabinet.map(item => `
    <div class="cabinet-item">
      <div class="cabinet-item-info">
        <h4>${item.name}</h4>
        <p>${item.category === 'drug' ? '처방약' : '영양제'} | ${item.activeIngredients[0] || ''}</p>
      </div>
      <button class="btn btn-danger" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="removeFromCabinet('${item.id}')">삭제</button>
    </div>
  `).join("");
}

function renderConditionsGrid() {
  const grid = document.getElementById("conditions-grid");
  grid.innerHTML = HEALTH_CONDITIONS.map(cond => `
    <label class="checkbox-card">
      <input type="checkbox" value="${cond.id}" onchange="toggleCondition('${cond.id}')" ${userConditions.has(cond.id) ? 'checked' : ''}>
      <div>
        <div style="font-weight:600; font-size:0.85rem;">${cond.label}</div>
      </div>
    </label>
  `).join("");
}

function toggleCondition(condId) {
  if (userConditions.has(condId)) {
    userConditions.delete(condId);
  } else {
    userConditions.add(condId);
  }
  
  const badge = document.getElementById("badge-condition-count");
  if (userConditions.size > 0) {
    badge.style.display = "inline-block";
    badge.textContent = userConditions.size;
  } else {
    badge.style.display = "none";
  }
}

function renderPresetCombos() {
  const container = document.getElementById("example-combos-grid");
  container.innerHTML = PRESET_COMBOS.map(combo => `
    <button class="tag-item" style="padding:0.5rem 0.9rem; font-size:0.8rem;" onclick="loadPresetCombo('${combo.items.join(",")}')">
      ${combo.title}
    </button>
  `).join("");
}

function loadPresetCombo(itemIdsStr) {
  const ids = itemIdsStr.split(",");
  currentCabinet = MEDICINE_DATABASE.filter(m => ids.includes(m.id));
  renderCabinet();
  filterSearchResults();
  runInteractionCheck();
}

// ==========================================
// 5. 핵심 상호작용 및 규칙 기반 분석 엔진
// ==========================================
function runInteractionCheck() {
  if (currentCabinet.length === 0) {
    alert("보관함에 최소 1개 이상의 약물 또는 영양제를 담아주세요.");
    return;
  }

  const interactions = [];
  const duplicates = [];
  const conditionWarnings = [];
  let baseScore = 100;

  const itemIds = currentCabinet.map(i => i.id);

  // 1. 와파린 + 아스피린 / 오메가3 / 홍삼 (출혈 위험)
  if (itemIds.includes("warfarin")) {
    if (itemIds.includes("aspirin") || itemIds.includes("omega3") || itemIds.includes("red_ginseng")) {
      interactions.push({
        title: "🚨 심각한 출혈 위험 (와파린 + 항응고 억제제/영양제)",
        riskLevel: "danger",
        items: ["와파린", "아스피린/오메가3/홍삼"],
        mechanism: "혈액 응고 방지 작용이 자극되어 조그만 상처에도 지혈이 안 되거나 장기 내 출혈 유발 가능.",
        recommendation: "와파린 복용 중 오메가3, 홍삼, 아스피린 복용 시 반드시 담당 의사와 상의하세요."
      });
      baseScore -= 35;
    }

    if (itemIds.includes("st_johns_wort")) {
      interactions.push({
        title: "🚨 약효 급감 및 혈전 위험 (와파린 + 성요한풀)",
        riskLevel: "danger",
        items: ["와파린", "성요한풀"],
        mechanism: "성요한풀이 간 대사효소를 강하게 자극하여 와파린 약효를 무력화시킴.",
        recommendation: "성요한풀과 와파린 병용은 절대 금기입니다."
      });
      baseScore -= 40;
    }
  }

  // 2. 칼슘 + 철분 (흡수 방해)
  if (itemIds.includes("calcium") && itemIds.includes("iron")) {
    interactions.push({
      title: "⚠️ 영양소 흡수 억제 (칼슘 + 철분)",
      riskLevel: "caution",
      items: ["칼슘", "철분"],
      mechanism: "소장 내 동일한 통로를 통해 흡수되므로 동시에 복용 시 두 미네랄 모두 흡수율 급감.",
      recommendation: "철분은 아침 공복, 칼슘은 저녁 식후로 복용 시간을 분리하세요."
    });
    baseScore -= 15;
  }

  // 3. 칼슘 + 씬지로이드 (갑상선약 흡수 저하)
  if (itemIds.includes("synthyroid") && itemIds.includes("calcium")) {
    interactions.push({
      title: "⚠️ 갑상선약 흡수 저하 (씬지로이드 + 칼슘)",
      riskLevel: "caution",
      items: ["씬지로이드", "칼슘"],
      mechanism: "칼슘이 씬지로이드 성분과 결합하여 체내 흡수를 막음.",
      recommendation: "씬지로이드 복용 후 최소 4시간 이상 지난 뒤 칼슘제를 복용하세요."
    });
    baseScore -= 20;
  }

  // 4. 비타민C + 철분 (시너지 효과)
  if (itemIds.includes("vitamin_c") && itemIds.includes("iron")) {
    interactions.push({
      title: "✨ 찰떡궁합 시너지 (비타민C + 철분)",
      riskLevel: "synergy",
      items: ["비타민C", "철분"],
      mechanism: "비타민C가 철분을 흡수가 잘 되는 이온 상태로 유지시켜 체내 흡수율 극대화.",
      recommendation: "철분제를 드실 때 비타민C 또는 귤주스와 함께 드시면 아주 좋습니다."
    });
    baseScore += 5;
  }

  // 5. 성분 중복 체킹 (아세트아미노펜 등)
  const tylenolItems = currentCabinet.filter(i => i.activeIngredients.some(ing => ing.includes("아세트아미노펜")));
  if (tylenolItems.length > 1) {
    duplicates.push({
      ingredientName: "아세트아미노펜",
      maxDailyLimit: "4,000mg",
      foundInItems: tylenolItems.map(i => i.name),
      riskDescription: "두 개 이상의 제품에 아세트아미노펜이 중복 포함되어 있습니다. 하루 4,000mg 초과 시 심각한 간 독성을 일으킬 수 있습니다."
    });
    baseScore -= 25;
  }

  // 6. 기저질환 체크
  userConditions.forEach(condId => {
    currentCabinet.forEach(item => {
      if (item.targetGroupsToCaution && item.targetGroupsToCaution.includes(condId)) {
        conditionWarnings.push({
          condition: HEALTH_CONDITIONS.find(c => c.id === condId)?.label || condId,
          warningText: `${item.name} 복용 시 해당 기저질환 증상이 악화되거나 주의가 필요합니다.`
        });
        baseScore -= 10;
      }
    });
  });

  const finalScore = Math.max(0, Math.min(100, baseScore));

  lastAnalysisReport = {
    overallScore: finalScore,
    overallRiskLevel: finalScore >= 85 ? "safe" : finalScore >= 60 ? "caution" : "danger",
    summaryTitle: finalScore >= 85 ? "안전한 복용 조합입니다!" : finalScore >= 60 ? "복용 시 주의가 필요한 항목이 있습니다." : "🚨 위험한 약물 상극 조합이 감지되었습니다!",
    summaryDescription: `현재 ${currentCabinet.length}개의 항목을 분석했습니다. (상극 감지: ${interactions.length}건, 중복: ${duplicates.length}건)`,
    interactionPairs: interactions,
    duplicateIngredients: duplicates,
    conditionWarnings: conditionWarnings,
    recommendedSchedule: generateSmartSchedule(currentCabinet)
  };

  renderReport(lastAnalysisReport);
}

// 스마트 복용 시간표 생성기
function generateSmartSchedule(cabinetItems) {
  const schedule = [];
  const ids = cabinetItems.map(i => i.id);

  // 아침 공복
  const morningEmpty = cabinetItems.filter(i => i.id === "synthyroid" || i.id === "probiotics" || i.id === "iron");
  if (morningEmpty.length > 0) {
    schedule.push({
      timeSlot: "🌅 아침 공복 (식전 30분)",
      timeRange: "07:00 ~ 07:30",
      items: morningEmpty.map(i => i.name),
      reason: "갑상선약, 유산균, 철분은 공복 상태에서 물 한 잔과 복용해야 흡수율이 높습니다."
    });
  }

  // 아침/점심 식후
  const mealAfter = cabinetItems.filter(i => i.id === "tylenol" || i.id === "ibuprofen" || i.id === "vitamin_c" || i.id === "red_ginseng");
  if (mealAfter.length > 0) {
    schedule.push({
      timeSlot: "☀️ 아침 / 점심 식사 직후",
      timeRange: "08:30 / 12:30",
      items: mealAfter.map(i => i.name),
      reason: "소염진통제 및 수용성 비타민은 위장 자극을 줄이기 위해 식사 후 즉시 복용하세요."
    });
  }

  // 저녁 식후 (지용성 & 칼슘)
  const eveningAfter = cabinetItems.filter(i => i.id === "omega3" || i.id === "vitamin_d" || i.id === "calcium" || i.id === "aspirin");
  if (eveningAfter.length > 0) {
    schedule.push({
      timeSlot: "🌙 저녁 식사 직후",
      timeRange: "19:00 ~ 19:30",
      items: eveningAfter.map(i => i.name),
      reason: "오메가3와 비타민D는 지방이 있는 식후 복용 시 흡수율이 극대화되며, 칼슘은 저녁에 뼈 흡수가 잘 됩니다."
    });
  }

  // 취침 전 (마그네슘)
  const beforeSleep = cabinetItems.filter(i => i.id === "magnesium");
  if (beforeSleep.length > 0) {
    schedule.push({
      timeSlot: "🛌 취침 30분 전",
      timeRange: "22:30 ~ 23:00",
      items: beforeSleep.map(i => i.name),
      reason: "마그네슘은 근육 이완과 신경 안정을 도와 편안한 수면을 유도합니다."
    });
  }

  return schedule;
}

// 리포트 UI 렌더링
function renderReport(report) {
  const reportSec = document.getElementById("section-report");
  reportSec.style.display = "block";
  reportSec.scrollIntoView({ behavior: "smooth" });

  const scoreBanner = document.getElementById("score-banner");
  scoreBanner.className = `score-banner ${report.overallRiskLevel}`;

  document.getElementById("report-risk-badge").textContent = report.overallRiskLevel === "safe" ? "안전" : report.overallRiskLevel === "caution" ? "주의" : "위험";
  document.getElementById("report-summary-title").textContent = report.summaryTitle;
  document.getElementById("report-summary-desc").textContent = report.summaryDescription;
  document.getElementById("report-score-num").textContent = `${report.overallScore}점`;

  document.getElementById("count-interactions").textContent = report.interactionPairs.length;
  document.getElementById("count-duplicates").textContent = report.duplicateIngredients.length;

  renderReportTabContent("interactions");
}

function renderReportTabContent(tabName) {
  const container = document.getElementById("report-tab-content");
  if (!lastAnalysisReport) return;

  const r = lastAnalysisReport;

  if (tabName === "interactions") {
    if (r.interactionPairs.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-muted);">감지된 상극 부작용 조합이 없습니다!</div>`;
      return;
    }

    container.innerHTML = r.interactionPairs.map(pair => `
      <div class="interaction-item ${pair.riskLevel}">
        <h4 style="font-size:1rem; font-weight:700; margin-bottom:0.4rem;">${pair.title}</h4>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.6rem;">${pair.mechanism}</p>
        <div style="background:rgba(255,255,255,0.05); padding:0.75rem; border-radius:var(--radius-sm); font-size:0.8rem; color:var(--primary-blue);">
          💡 <strong>권장 대처:</strong> ${pair.recommendation}
        </div>
      </div>
    `).join("");
  } else if (tabName === "duplicates") {
    if (r.duplicateIngredients.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-muted);">성분 중복 우려가 없습니다.</div>`;
      return;
    }

    container.innerHTML = r.duplicateIngredients.map(dup => `
      <div class="interaction-item caution">
        <h4 style="font-size:1rem; font-weight:700;">⚠️ ${dup.ingredientName} 성분 중복 감지 (상한선: ${dup.maxDailyLimit})</h4>
        <p style="font-size:0.85rem; color:var(--text-muted); margin:0.5rem 0;">포함 제품: ${dup.foundInItems.join(", ")}</p>
        <p style="font-size:0.8rem; color:var(--accent-amber);">${dup.riskDescription}</p>
      </div>
    `).join("");
  } else if (tabName === "schedule") {
    container.innerHTML = r.recommendedSchedule.map(s => `
      <div class="interaction-item" style="border-left: 4px solid var(--primary-blue);">
        <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
          <strong style="color:var(--primary-blue);">${s.timeSlot}</strong>
          <span style="font-size:0.8rem; color:var(--text-dim);">${s.timeRange}</span>
        </div>
        <div style="font-weight:700; font-size:0.9rem; margin-bottom:0.4rem;">💊 복용 항목: ${s.items.join(", ")}</div>
        <p style="font-size:0.8rem; color:var(--text-muted);">${s.reason}</p>
      </div>
    `).join("");
  } else if (tabName === "precautions") {
    container.innerHTML = `
      <div class="interaction-item">
        <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.5rem;">🥗 음주 및 카페인 주의사항</h4>
        <p style="font-size:0.85rem; color:var(--text-muted);">
          • 타이레놀/이부프로펜 복용 중 음주는 간 손상 및 위장 출혈을 유발할 수 있습니다.<br>
          • 철분제, 칼슘제는 커피, 녹차의 탄닌 성분과 결합해 흡수를 방해하므로 2시간 차이를 두세요.
        </p>
      </div>
    `;
  }
}

function copyReportToClipboard() {
  if (!lastAnalysisReport) return;
  const text = `[SafeDose 분석 리포트]\n- 안전 점수: ${lastAnalysisReport.overallScore}점\n- 요약: ${lastAnalysisReport.summaryTitle}`;
  navigator.clipboard.writeText(text);
  alert("리포트 요약이 클립보드에 복사되었습니다!");
}

// ==========================================
// 6. 모달 조작 및 API 호출 함수
// ==========================================
function openModal(modalId) {
  document.getElementById(modalId).classList.add("active");
}

async function handleSendChat() {
  const input = document.getElementById("input-chat-msg");
  const message = input.value.trim();
  if (!message) return;

  const chatList = document.getElementById("chat-messages");

  // 사용자 메시지 추가
  chatList.innerHTML += `<div class="chat-bubble user">${message}</div>`;
  input.value = "";
  chatList.scrollTop = chatList.scrollHeight;

  // 로딩 버블
  const loadingId = "loading-" + Date.now();
  chatList.innerHTML += `<div class="chat-bubble bot" id="${loadingId}">AI 약사가 답변을 작성하고 있습니다...</div>`;
  chatList.scrollTop = chatList.scrollHeight;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: chatHistory,
        cabinetItems: currentCabinet,
        userProfile: { conditions: Array.from(userConditions) }
      })
    });

    const loadingElem = document.getElementById(loadingId);
    if (!res.ok) {
      const err = await res.json();
      loadingElem.textContent = "오류: " + (err.error || "답변을 가져올 수 없습니다. Vercel GEMINI_API_KEY를 확인하세요.");
      return;
    }

    const data = await res.json();
    loadingElem.textContent = data.reply;
    chatHistory.push({ role: "user", text: message });
    chatHistory.push({ role: "model", text: data.reply });

  } catch (error) {
    const loadingElem = document.getElementById(loadingId);
    if (loadingElem) {
      loadingElem.textContent = "API 호출 오류: " + error.message;
    }
  }
}

let scannedBase64 = null;

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    scannedBase64 = evt.target.result;
    document.getElementById("scanned-preview-img").src = scannedBase64;
    document.getElementById("preview-image-container").style.display = "block";
    document.getElementById("btn-analyze-image").style.display = "inline-flex";
  };
  reader.readAsDataURL(file);
}

async function handleImageAnalysis() {
  if (!scannedBase64) return;

  const btn = document.getElementById("btn-analyze-image");
  btn.textContent = "AI 분석 중...";
  btn.disabled = true;

  try {
    const res = await fetch("/api/analyze-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: scannedBase64,
        mimeType: "image/jpeg"
      })
    });

    if (!res.ok) {
      const err = await res.json();
      alert("사진 인식 실패: " + (err.error || "Gemini Vision API 오류"));
      return;
    }

    const data = await res.json();
    if (data.recognizedItems && data.recognizedItems.length > 0) {
      data.recognizedItems.forEach(item => {
        if (!currentCabinet.some(c => c.name === item.name)) {
          currentCabinet.push(item);
        }
      });
      renderCabinet();
      alert(`🎉 사진에서 ${data.recognizedItems.length}개의 약물/영양제가 감지되어 보관함에 자동 담겼습니다!`);
      document.getElementById("modal-scanner").classList.remove("active");
    } else {
      alert("이미지에서 명확한 약 성분을 인식하지 못했습니다.");
    }
  } catch (error) {
    alert("오류 발생: " + error.message);
  } finally {
    btn.textContent = "AI 사진 분석 시작";
    btn.disabled = false;
  }
}
