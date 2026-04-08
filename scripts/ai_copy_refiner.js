/**
 * ═══════════════════════════════════════════════════════════════════
 *  모듈 ③ — AI 카피라이팅 정제기 (Copy Refiner)
 * ═══════════════════════════════════════════════════════════════════
 *
 *  기능:
 *   1. 표지 임팩트 카피 생성/정제
 *   2. 간지 챕터 카피 생성/정제
 *   3. 마무리 다짐 카피 생성/정제
 *   4. 본문 헤더 메시지 정제
 *   5. 전체 카피 일관성 검증
 *
 *  사용법:
 *   const { refineCopy, generateAllCopies } = require("./ai_copy_refiner");
 *   const copies = await generateAllCopies({
 *     companyName: "그라운드케이",
 *     targetCompany: "현대자동차",
 *     projectName: "제네시스 전용 셔틀 운영",
 *     coreMessage: "럭셔리 모빌리티 경험 설계",
 *     chapters: ["산업 이해", "브랜드 접점", "운영 전략", "실적", "제안"]
 *   });
 *
 *  필요 패키지: @anthropic-ai/sdk (npm install @anthropic-ai/sdk)
 *  환경 변수: ANTHROPIC_API_KEY
 * ═══════════════════════════════════════════════════════════════════
 */

const Anthropic = require("@anthropic-ai/sdk").default;

// ─────────────────────────────────────────────────
// 1. Claude API 클라이언트 초기화
// ─────────────────────────────────────────────────

function getClient(apiKey) {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "[CopyRefiner] ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다.\n" +
      "설정 방법: set ANTHROPIC_API_KEY=sk-ant-... (Windows)\n" +
      "또는 analyzeBrand(..., { apiKey: 'sk-ant-...' }) 로 전달"
    );
  }
  return new Anthropic({ apiKey: key });
}

// ─────────────────────────────────────────────────
// 2. 카피 생성 프롬프트 템플릿
// ─────────────────────────────────────────────────

const SYSTEM_PROMPT = `당신은 한국 최고의 B2B 제안서 카피라이터입니다.
그라운드케이(GroundK)는 수송/모빌리티 전문 기업으로, 기업/행사/VIP 대상 차량 운행 서비스를 제공합니다.

[카피라이팅 규칙]
1. 표지 카피: 제안서 전체를 관통하는 선언형 한마디. 제안 대상에게 "우리가 이것을 하겠다"는 약속.
   - 15~30자 이내, 동사형 마무리 ("~합니다", "~설계합니다")
   - 2줄까지 허용 (\\n으로 구분)
   - 추상적이지 않고 구체적인 가치를 담을 것

2. 간지 카피: 해당 챕터에서 전달하고 싶은 핵심 메시지. 단순 챕터명이 아닌 메시지성 카피.
   - 10~25자 이내
   - "~합니다", "~입니다" 등 서술형 또는 "~하다" 체언형
   - 예: "처음 만나는 업체의 영업이 아닙니다" (O), "제안 배경" (X)

3. 마무리 카피: 표지 카피의 다짐/의지 변주. 앞으로 이렇게 하겠다는 서약.
   - "감사합니다"만 있는 마무리는 절대 금지
   - 표지 카피를 echo하되, 미래지향적으로 변주
   - 15~30자 이내, 2줄까지 허용

4. 헤더 메시지: 각 슬라이드의 핵심을 1줄로 전달. 질문형/선언형 모두 가능.
   - 15~25자 이내
   - 해당 페이지의 내용을 보지 않아도 핵심이 전달되어야 함

5. 전체 톤앤매너:
   - 격식체 ("~입니다", "~합니다")
   - 자신감 있되 겸손한 톤
   - 업계 전문성이 느껴지는 어휘
   - 불필요한 수식어 배제, 간결하게`;

// ─────────────────────────────────────────────────
// 3. 개별 카피 정제 함수
// ─────────────────────────────────────────────────

/**
 * 단일 카피를 정제합니다.
 *
 * @param {string} type - "cover" | "divider" | "ending" | "header"
 * @param {string} rawCopy - 정제 전 초안 카피
 * @param {Object} context - 맥락 정보
 * @param {string} [apiKey] - Anthropic API Key (환경변수 대체 가능)
 * @returns {Object} { refined, alternatives, reasoning }
 */
async function refineCopy(type, rawCopy, context, apiKey) {
  const client = getClient(apiKey);

  const typeDescriptions = {
    cover: "표지 임팩트 카피 (선언형, 제안서 전체를 관통하는 한마디)",
    divider: "간지 챕터 카피 (해당 챕터의 핵심 메시지)",
    ending: "마무리 다짐 카피 (표지의 변주, 미래지향적 서약)",
    header: "슬라이드 헤더 메시지 (해당 페이지 핵심 1줄 전달)",
  };

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: `
[카피 유형] ${typeDescriptions[type]}
[제안사] ${context.companyName || "그라운드케이"}
[제안 대상] ${context.targetCompany || "미정"}
[프로젝트] ${context.projectName || "미정"}
[핵심 메시지] ${context.coreMessage || ""}
${context.coverCopy ? `[표지 카피 (참조)] ${context.coverCopy}` : ""}
${context.chapterTitle ? `[챕터 제목] ${context.chapterTitle}` : ""}
${context.slideContent ? `[슬라이드 내용 요약] ${context.slideContent}` : ""}

[초안 카피]
${rawCopy}

위 초안을 정제해주세요. 아래 JSON 형식으로 답해주세요:
{
  "refined": "정제된 최종 카피 (best pick)",
  "alternatives": ["대안 1", "대안 2"],
  "reasoning": "이렇게 수정한 이유 (1~2줄)"
}

JSON만 출력해주세요. 마크다운 코드블록 없이.`.trim()
    }],
  });

  try {
    const text = response.content[0].text.trim();
    // JSON 파싱 (코드블록이 있을 경우 제거)
    const jsonStr = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("[CopyRefiner] JSON 파싱 실패:", response.content[0].text);
    return {
      refined: rawCopy,
      alternatives: [],
      reasoning: "파싱 실패 — 원본 유지",
    };
  }
}

// ─────────────────────────────────────────────────
// 4. 전체 카피 일괄 생성
// ─────────────────────────────────────────────────

/**
 * 제안서의 모든 카피를 한 번에 생성합니다.
 *
 * @param {Object} context
 *   - companyName: 제안사명
 *   - targetCompany: 제안 대상사
 *   - projectName: 프로젝트명
 *   - coreMessage: 핵심 메시지 (WHY)
 *   - chapters: 챕터 배열 [{ title, contentSummary }]
 *   - slides: 슬라이드 배열 [{ chapterIdx, title, contentSummary }] (선택)
 * @param {string} [apiKey]
 * @returns {Object} { cover, dividers[], ending, headers[] }
 */
async function generateAllCopies(context, apiKey) {
  const client = getClient(apiKey);

  const chaptersDesc = (context.chapters || []).map((ch, i) => {
    const title = typeof ch === "string" ? ch : ch.title;
    const summary = typeof ch === "string" ? "" : (ch.contentSummary || "");
    return `  Ch${i + 1}: ${title}${summary ? " — " + summary : ""}`;
  }).join("\n");

  const slidesDesc = (context.slides || []).map((sl, i) => {
    return `  슬라이드 ${i + 1} [Ch${sl.chapterIdx}]: ${sl.title} — ${sl.contentSummary || ""}`;
  }).join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: `
아래 제안서의 모든 카피를 생성해주세요.

[제안사] ${context.companyName || "그라운드케이"}
[제안 대상] ${context.targetCompany}
[프로젝트] ${context.projectName}
[핵심 메시지] ${context.coreMessage}

[챕터 구성]
${chaptersDesc}

${slidesDesc ? `[슬라이드 목록]\n${slidesDesc}` : ""}

아래 JSON 형식으로 답해주세요:
{
  "cover": {
    "impactCopy": "표지 임팩트 카피 (선언형, 2줄까지 허용, \\n으로 구분)",
    "catchphraseWords": ["키워드1", "키워드2", "키워드3"],
    "subCopy": "서브 카피 (1줄, 핵심 메시지 부연)"
  },
  "dividers": [
    {
      "chapterLabel": "CHAPTER 또는 Module 등",
      "chapterNum": "01",
      "copyLine": "간지 카피 (메시지성, 2줄까지)",
      "subLine": "보조 설명 1줄"
    }
  ],
  "ending": {
    "pledgeCopy": "마무리 다짐 카피 (표지의 변주, 2줄까지)",
    "serviceLabel": "서비스 라벨 (1줄)"
  },
  "headers": [
    {
      "slideIndex": 1,
      "headerMsg": "슬라이드 헤더 메시지 (15~25자)",
      "subMsg": "부제목 (1줄)"
    }
  ]
}

[중요]
- 표지 카피와 마무리 카피는 서로 echo/변주 관계여야 합니다
- 간지 카피는 단순 챕터명이 아닌, 메시지성 카피여야 합니다
- "감사합니다"만 있는 마무리는 절대 금지
- JSON만 출력해주세요. 마크다운 코드블록 없이.`.trim()
    }],
  });

  try {
    const text = response.content[0].text.trim();
    const jsonStr = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(jsonStr);
    console.log("[CopyRefiner] 전체 카피 생성 완료");
    console.log(`  표지: "${result.cover.impactCopy}"`);
    console.log(`  간지 ${result.dividers.length}개 생성`);
    console.log(`  마무리: "${result.ending.pledgeCopy}"`);
    if (result.headers) {
      console.log(`  헤더 ${result.headers.length}개 생성`);
    }
    return result;
  } catch (e) {
    console.error("[CopyRefiner] JSON 파싱 실패:", response.content[0].text);
    throw new Error("카피 생성 실패 — API 응답을 파싱할 수 없습니다");
  }
}

// ─────────────────────────────────────────────────
// 5. 카피 일관성 검증
// ─────────────────────────────────────────────────

/**
 * 생성된 전체 카피의 일관성을 검증합니다.
 *
 * @param {Object} copies - generateAllCopies()의 결과
 * @param {Object} context - 프로젝트 맥락
 * @param {string} [apiKey]
 * @returns {Object} { score, issues[], suggestions[] }
 */
async function validateCopies(copies, context, apiKey) {
  const client = getClient(apiKey);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: `
아래 제안서 카피의 일관성과 품질을 검증해주세요.

[제안사] ${context.companyName || "그라운드케이"}
[제안 대상] ${context.targetCompany}
[프로젝트] ${context.projectName}

[카피 목록]
표지: "${copies.cover.impactCopy}"
캐치프레이즈: ${copies.cover.catchphraseWords.join(", ")}
서브카피: "${copies.cover.subCopy}"

${copies.dividers.map((d, i) => `간지 Ch${i + 1}: "${d.copyLine}" (보조: "${d.subLine}")`).join("\n")}

마무리: "${copies.ending.pledgeCopy}"

${copies.headers ? copies.headers.map(h => `슬라이드 ${h.slideIndex}: "${h.headerMsg}" / "${h.subMsg}"`).join("\n") : ""}

아래 기준으로 검증하고 JSON으로 답해주세요:
1. 표지↔마무리 echo 관계가 자연스러운가
2. 간지 카피가 단순 챕터명이 아닌 메시지성인가
3. 전체 톤앤매너가 일관적인가
4. "감사합니다" 류의 약한 마무리가 없는가
5. 헤더 메시지가 해당 챕터의 맥락과 맞는가
6. 글자 수 제한을 준수하는가

{
  "score": 85,
  "issues": [
    { "location": "간지 Ch2", "issue": "단순 챕터명에 가까움", "suggestion": "~로 수정 권장" }
  ],
  "suggestions": ["전체적인 개선 제안"],
  "revisedCopies": { ... }  // 수정이 필요한 경우 수정본 포함 (선택)
}

JSON만 출력해주세요. 마크다운 코드블록 없이.`.trim()
    }],
  });

  try {
    const text = response.content[0].text.trim();
    const jsonStr = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(jsonStr);
    console.log(`[CopyRefiner] 검증 완료 — 점수: ${result.score}/100`);
    if (result.issues && result.issues.length > 0) {
      console.log(`  문제 ${result.issues.length}건 발견:`);
      result.issues.forEach(issue => {
        console.log(`    - [${issue.location}] ${issue.issue}`);
      });
    }
    return result;
  } catch (e) {
    console.error("[CopyRefiner] 검증 결과 파싱 실패");
    return { score: 0, issues: [], suggestions: ["파싱 실패"] };
  }
}

// ─────────────────────────────────────────────────
// 6. 자동 정제 루프 (생성 → 검증 → 수정)
// ─────────────────────────────────────────────────

/**
 * 카피 생성 → 검증 → 수정을 자동 반복합니다.
 * 점수가 targetScore 이상이 되면 종료합니다.
 *
 * @param {Object} context - 프로젝트 맥락
 * @param {Object} options - { targetScore, maxIterations, apiKey }
 * @returns {Object} { copies, validation, iterations }
 */
async function autoRefineLoop(context, options = {}) {
  const { targetScore = 85, maxIterations = 2, apiKey } = options;

  console.log(`[CopyRefiner] 자동 정제 시작 (목표 점수: ${targetScore})`);

  let copies = await generateAllCopies(context, apiKey);
  let validation = await validateCopies(copies, context, apiKey);
  let iteration = 1;

  while (validation.score < targetScore && iteration < maxIterations) {
    console.log(`[CopyRefiner] 반복 ${iteration + 1}: 점수 ${validation.score} < 목표 ${targetScore}, 재정제 중...`);

    // 검증에서 수정본이 제공되었으면 적용
    if (validation.revisedCopies) {
      if (validation.revisedCopies.cover) copies.cover = { ...copies.cover, ...validation.revisedCopies.cover };
      if (validation.revisedCopies.dividers) copies.dividers = validation.revisedCopies.dividers;
      if (validation.revisedCopies.ending) copies.ending = { ...copies.ending, ...validation.revisedCopies.ending };
      if (validation.revisedCopies.headers) copies.headers = validation.revisedCopies.headers;
    } else {
      // 수정본이 없으면 문제 부분만 재생성
      for (const issue of (validation.issues || [])) {
        if (issue.location.startsWith("표지")) {
          const refined = await refineCopy("cover", copies.cover.impactCopy, context, apiKey);
          copies.cover.impactCopy = refined.refined;
        } else if (issue.location.startsWith("마무리")) {
          const refined = await refineCopy("ending", copies.ending.pledgeCopy, {
            ...context,
            coverCopy: copies.cover.impactCopy,
          }, apiKey);
          copies.ending.pledgeCopy = refined.refined;
        } else if (issue.location.startsWith("간지")) {
          const chIdx = parseInt(issue.location.replace(/\D/g, "")) - 1;
          if (chIdx >= 0 && chIdx < copies.dividers.length) {
            const refined = await refineCopy("divider", copies.dividers[chIdx].copyLine, {
              ...context,
              chapterTitle: context.chapters[chIdx]?.title || context.chapters[chIdx],
            }, apiKey);
            copies.dividers[chIdx].copyLine = refined.refined;
          }
        }
      }
    }

    validation = await validateCopies(copies, context, apiKey);
    iteration++;
  }

  console.log(`[CopyRefiner] 최종 점수: ${validation.score}/100 (${iteration}회 반복)`);

  return {
    copies,
    validation,
    iterations: iteration,
  };
}

// ─────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────

module.exports = {
  refineCopy,
  generateAllCopies,
  validateCopies,
  autoRefineLoop,
};

// ─────────────────────────────────────────────────
// CLI 직접 실행 (테스트용)
// ─────────────────────────────────────────────────

if (require.main === module) {
  const testContext = {
    companyName: "그라운드케이",
    targetCompany: "현대자동차 제네시스",
    projectName: "제네시스 전용 셔틀 운영 서비스",
    coreMessage: "럭셔리 모빌리티 경험 설계",
    chapters: [
      { title: "산업 이해", contentSummary: "프리미엄 모빌리티 시장 현황과 기회" },
      { title: "브랜드 접점", contentSummary: "제네시스 고객 여정의 5가지 브랜드 경험 포인트" },
      { title: "운영 전략", contentSummary: "3개 모듈(의전/공항/이벤트) 통합 운영 방안" },
      { title: "실적", contentSummary: "42건 프로젝트, 600+ 차량, 10+ 연간 파트너" },
      { title: "제안", contentSummary: "비용, 일정, 기대효과" },
    ],
  };

  autoRefineLoop(testContext, { targetScore: 80, maxIterations: 2 })
    .then(result => {
      console.log("\n═══ 최종 카피 ═══");
      console.log(JSON.stringify(result.copies, null, 2));
      console.log("\n═══ 검증 결과 ═══");
      console.log(JSON.stringify(result.validation, null, 2));
    })
    .catch(err => console.error("에러:", err.message));
}
