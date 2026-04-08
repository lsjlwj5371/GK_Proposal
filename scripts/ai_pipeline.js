/**
 * ═══════════════════════════════════════════════════════════════════
 *  AI 강화 PPT 생성 파이프라인 (통합 오케스트레이터)
 * ═══════════════════════════════════════════════════════════════════
 *
 *  이 파일은 3개 AI 모듈을 통합하여 순차적으로 실행합니다.
 *
 *  파이프라인:
 *   Phase 1: 브랜드 분석 → 색상 팔레트 + 배경 이미지 자동 생성
 *   Phase 2: 카피 정제 → 표지/간지/마무리/헤더 카피 AI 생성 + 검증
 *   Phase 3: PPT 생성 → (기존 pptxgenjs 코드 — 외부에서 수행)
 *   Phase 4: 시각 QA → 슬라이드별 품질 분석 + 수정 제안
 *
 *  사용법:
 *   // 전체 파이프라인 실행:
 *   const { runFullPipeline } = require("./ai_pipeline");
 *   const result = await runFullPipeline({
 *     companyName: "그라운드케이",
 *     targetCompany: "현대자동차 제네시스",
 *     targetDomain: "genesis.com",
 *     projectName: "제네시스 전용 셔틀 운영 서비스",
 *     coreMessage: "럭셔리 모빌리티 경험 설계",
 *     chapters: [...],
 *     slides: [...],   // 선택
 *   });
 *
 *   // result.brand   → 브랜드 분석 결과 (팔레트, 배경 이미지 등)
 *   // result.copies  → 정제된 카피 (표지/간지/마무리/헤더)
 *   // → 이 데이터로 PPT 생성 코드를 실행
 *   // → 생성된 PPT 파일에 대해 QA 실행:
 *   //    const qa = await runQA("output.pptx", result);
 *
 *  환경 변수:
 *   ANTHROPIC_API_KEY - Claude API 키 (카피 정제 + 시각 QA에 필요)
 *
 *  필요 패키지:
 *   sharp, @anthropic-ai/sdk
 * ═══════════════════════════════════════════════════════════════════
 */

const { analyzeBrand } = require("./ai_brand_analyzer");
const { autoRefineLoop } = require("./ai_copy_refiner");
const { qaAndFixLoop } = require("./ai_visual_qa");
const fs = require("fs");
const path = require("path");

// ─────────────────────────────────────────────────
// 1. Phase 1 + 2 통합 (PPT 생성 전 준비)
// ─────────────────────────────────────────────────

/**
 * PPT 생성에 필요한 모든 AI 준비 작업을 실행합니다.
 *
 * @param {Object} config
 *   - companyName: "그라운드케이"
 *   - targetCompany: "현대자동차 제네시스"
 *   - targetDomain: "genesis.com" (선택, 없으면 색상 수동 지정)
 *   - projectName: "제네시스 전용 셔틀 운영"
 *   - coreMessage: "럭셔리 모빌리티 경험 설계"
 *   - chapters: [{ title, contentSummary }] or ["챕터명", ...]
 *   - slides: [{ chapterIdx, title, contentSummary }] (선택)
 *   - overrideColors: { dominant: "002C5F", accent: "C4A265" } (선택)
 *   - apiKey: Anthropic API Key (선택, 환경변수 대체)
 *   - skipCopy: true일 경우 카피 정제 건너뜀
 *   - skipBrand: true일 경우 브랜드 분석 건너뜀
 * @returns {Object} { brand, copies, pptxCodeVars }
 */
async function preparePptAssets(config) {
  const startTime = Date.now();
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║   AI 강화 PPT 생성 파이프라인 — Phase 1+2           ║");
  console.log("╚═══════════════════════════════════════════════════════╝");
  console.log(`  제안사: ${config.companyName || "그라운드케이"}`);
  console.log(`  대상:   ${config.targetCompany}`);
  console.log(`  프로젝트: ${config.projectName}`);
  console.log("");

  // ── Phase 1: 브랜드 분석 ──
  let brand = null;
  if (!config.skipBrand) {
    console.log("─── Phase 1: 브랜드 분석 ───────────────────────────────");
    brand = await analyzeBrand(
      config.targetCompany,
      config.targetDomain,
      config.overrideColors || {}
    );
    console.log("");
  } else {
    // 기본 팔레트
    const { generatePalette } = require("./ai_brand_analyzer");
    const palette = generatePalette(
      config.overrideColors?.dominant || "2E3092",
      config.overrideColors?.accent
    );
    brand = { palette, gradients: {}, logoBase64: null };
    console.log("─── Phase 1: 브랜드 분석 건너뜀 (기본 팔레트 사용) ──");
  }

  // ── Phase 2: 카피 정제 ──
  let copies = null;
  if (!config.skipCopy) {
    console.log("─── Phase 2: AI 카피 생성 + 정제 ──────────────────────");
    try {
      const copyResult = await autoRefineLoop({
        companyName: config.companyName || "그라운드케이",
        targetCompany: config.targetCompany,
        projectName: config.projectName,
        coreMessage: config.coreMessage,
        chapters: config.chapters || [],
        slides: config.slides || [],
      }, {
        targetScore: 85,
        maxIterations: 2,
        apiKey: config.apiKey,
      });
      copies = copyResult.copies;
      console.log(`  카피 품질 점수: ${copyResult.validation.score}/100`);
    } catch (e) {
      console.error(`  ⚠ 카피 정제 실패: ${e.message}`);
      console.error(`  → 수동으로 카피를 작성해주세요.`);
    }
    console.log("");
  }

  // ── 결과 조합 ──
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("─── 준비 완료 ──────────────────────────────────────────");
  console.log(`  소요시간: ${elapsed}초`);
  console.log(`  팔레트: DOM=#${brand.palette.DOM} SEC=#${brand.palette.SEC} ACC=#${brand.palette.ACC}`);
  console.log(`  배경: ${brand.gradients?.cover ? "생성됨" : "없음"}`);
  console.log(`  카피: ${copies ? "생성됨" : "수동 필요"}`);
  console.log("");

  // PPT 코드에서 바로 사용할 수 있는 변수 모음
  const pptxCodeVars = generatePptxVars(brand, copies, config);

  return { brand, copies, pptxCodeVars };
}

// ─────────────────────────────────────────────────
// 2. Phase 4: QA 실행 (PPT 생성 후)
// ─────────────────────────────────────────────────

/**
 * 생성된 PPT에 대한 시각 QA를 실행합니다.
 *
 * @param {string} pptxPath - 생성된 PPTX 파일 경로
 * @param {Object} pipelineResult - preparePptAssets()의 결과 (선택)
 * @param {Object} [options] - { targetScore, apiKey, referenceDir }
 * @returns {Object} QA 결과
 */
async function runQA(pptxPath, pipelineResult, options = {}) {
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║   AI 강화 PPT 생성 파이프라인 — Phase 4 (QA)        ║");
  console.log("╚═══════════════════════════════════════════════════════╝");
  console.log(`  대상: ${pptxPath}`);
  console.log("");

  const result = await qaAndFixLoop(pptxPath, {
    targetScore: options.targetScore || 75,
    maxIterations: 1,
    apiKey: options.apiKey,
    ...options,
  });

  console.log("");
  console.log("─── QA 결과 요약 ───────────────────────────────────────");
  console.log(`  최종 점수: ${result.finalScore}/100`);
  console.log(`  목표 달성: ${result.passedTarget ? "✅ YES" : "❌ NO"}`);

  if (result.report.categoryAverages) {
    console.log("  카테고리별 평균:");
    const cats = result.report.categoryAverages;
    if (cats.alignment != null) console.log(`    정렬:     ${cats.alignment}/100`);
    if (cats.fillRate != null) console.log(`    밀도:     ${cats.fillRate}/100`);
    if (cats.color != null) console.log(`    색상:     ${cats.color}/100`);
    if (cats.typography != null) console.log(`    타이포:   ${cats.typography}/100`);
    if (cats.visuals != null) console.log(`    시각요소: ${cats.visuals}/100`);
    if (cats.header != null) console.log(`    헤더:     ${cats.header}/100`);
  }

  if (result.report.lowFillRateSlides.length > 0) {
    console.log(`\n  ⚠ Fill-Rate 부족 슬라이드: ${result.report.lowFillRateSlides.join(", ")}`);
  }

  return result;
}

// ─────────────────────────────────────────────────
// 3. 전체 파이프라인 (Phase 1~4 통합)
// ─────────────────────────────────────────────────

/**
 * 전체 파이프라인을 순차 실행합니다.
 * (PPT 생성 자체는 외부에서 수행 — 이 함수는 준비와 QA만)
 *
 * @param {Object} config - preparePptAssets config + pptxOutputPath
 * @returns {Object} 전체 결과
 *
 * @example
 * // Step 1: 준비
 * const result = await runFullPipeline({
 *   targetCompany: "현대자동차",
 *   targetDomain: "hyundai.com",
 *   projectName: "VIP 셔틀",
 *   coreMessage: "프리미엄 이동 경험",
 *   chapters: ["현황", "솔루션", "실적"],
 * });
 *
 * // Step 2: 출력된 변수로 PPT 생성 코드 작성 & 실행
 * console.log(result.pptxCodeVars); // 복사하여 PPT 생성 코드에 붙여넣기
 *
 * // Step 3: QA
 * const qa = await runQA("output.pptx", result);
 */
async function runFullPipeline(config) {
  const totalStart = Date.now();

  // Phase 1+2: 준비
  const prepResult = await preparePptAssets(config);

  // Phase 3: PPT 생성은 외부에서 수행
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║   Phase 3: PPT 생성 (아래 변수를 사용하여 코드 작성)  ║");
  console.log("╚═══════════════════════════════════════════════════════╝");
  console.log("");
  console.log(prepResult.pptxCodeVars);
  console.log("");
  console.log("위 코드를 PPT 생성 스크립트 상단에 붙여넣고 실행하세요.");
  console.log("생성 후 runQA('output.pptx') 를 호출하면 품질 검수가 실행됩니다.");
  console.log("");

  const totalElapsed = ((Date.now() - totalStart) / 1000).toFixed(1);
  console.log(`═══ 전체 준비 소요시간: ${totalElapsed}초 ═══`);

  return prepResult;
}

// ─────────────────────────────────────────────────
// 4. PPT 코드 변수 생성 유틸리티
// ─────────────────────────────────────────────────

function generatePptxVars(brand, copies, config) {
  const p = brand.palette;

  let code = `// ══════════════════════════════════════════════════════
// AI 파이프라인 자동 생성 변수 (${new Date().toISOString().split("T")[0]})
// 대상: ${config.targetCompany} | 프로젝트: ${config.projectName}
// ══════════════════════════════════════════════════════

const pptxgen = require("pptxgenjs");
const pres = new pptxgen();

// ━━━ 1. 슬라이드 규격 ━━━
pres.defineLayout({ name: "A4L", width: 11.69, height: 8.27 });
pres.layout = "A4L";
pres.author = "${config.companyName || "그라운드케이"}";
pres.title = "${config.projectName}";

// ━━━ 2. 색상 변수 (AI 브랜드 분석 결과) ━━━
const DOM = '${p.DOM}';    // DOMINANT (60%) — 간지 배경, 넓은 면적
const SEC = '${p.SEC}';    // SECONDARY (30%) — 카드, 구분선, 태그
const ACC = '${p.ACC}';    // ACCENT (10%) — 핵심 수치, CTA
const DK  = '${p.DK}';     // DARK_BG — 표지/마무리 배경
const LT  = '${p.LT}';     // LIGHT_BG — 카드 배경
const CD  = '${p.CD}';     // CARD_BG — 테이블 교차행
const SB  = '${p.SB}';     // SUBTLE — 인사이트 박스
const TF  = '${p.TF}';     // TEXT_FAINT — 표지/간지 보조 텍스트
const W   = 'FFFFFF';
const TD  = '1A1A2E';       // 본문 텍스트
const TG  = '6B7280';       // 보조 텍스트
const FN  = 'Pretendard';
`;

  // 배경 이미지 변수 추가
  if (brand.gradients?.cover) {
    code += `
// ━━━ 3. AI 생성 배경 이미지 (base64) ━━━
const BG_COVER   = '${brand.gradients.cover}';
const BG_DIVIDER = '${brand.gradients.divider}';
const BG_ENDING  = '${brand.gradients.ending}';
`;
  }

  // 로고 변수
  if (brand.logoBase64) {
    code += `
// ━━━ 4. 로고 (base64) ━━━
const LOGO = '${brand.logoBase64}';
`;
  }

  // 카피 변수
  if (copies) {
    code += `
// ━━━ 5. AI 정제 카피 ━━━
const COPY = ${JSON.stringify(copies, null, 2)};
`;
  }

  return code;
}

// ─────────────────────────────────────────────────
// 5. 간편 사용 함수들
// ─────────────────────────────────────────────────

/**
 * 브랜드 분석만 빠르게 실행합니다.
 */
async function quickBrand(targetCompany, domain, overrides) {
  return analyzeBrand(targetCompany, domain, overrides);
}

/**
 * 생성된 PPT만 빠르게 QA합니다.
 */
async function quickQA(pptxPath, options) {
  return runQA(pptxPath, null, options);
}

// ─────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────

module.exports = {
  preparePptAssets,
  runQA,
  runFullPipeline,
  quickBrand,
  quickQA,
};

// ─────────────────────────────────────────────────
// CLI 직접 실행
// ─────────────────────────────────────────────────

if (require.main === module) {
  const mode = process.argv[2] || "help";

  if (mode === "prepare") {
    // node ai_pipeline.js prepare "현대자동차" "hyundai.com" "VIP 셔틀" "프리미엄 이동 경험"
    const target = process.argv[3] || "현대자동차";
    const domain = process.argv[4] || "";
    const project = process.argv[5] || "제안서";
    const message = process.argv[6] || "";

    preparePptAssets({
      targetCompany: target,
      targetDomain: domain,
      projectName: project,
      coreMessage: message,
      chapters: ["현황 분석", "솔루션", "실적", "제안"],
    }).then(result => {
      // 변수 코드를 파일로 저장
      const outPath = path.join(process.cwd(), "pptx_vars.js");
      fs.writeFileSync(outPath, result.pptxCodeVars, "utf8");
      console.log(`\n✅ 변수 코드 저장: ${outPath}`);
    }).catch(err => console.error("에러:", err.message));

  } else if (mode === "qa") {
    // node ai_pipeline.js qa "output.pptx"
    const pptxPath = process.argv[3];
    if (!pptxPath) {
      console.error("사용법: node ai_pipeline.js qa <pptx파일경로>");
      process.exit(1);
    }
    quickQA(pptxPath).then(result => {
      console.log(`\n최종 점수: ${result.finalScore}/100`);
    }).catch(err => console.error("에러:", err.message));

  } else if (mode === "brand") {
    // node ai_pipeline.js brand "현대자동차" "hyundai.com"
    const target = process.argv[3] || "그라운드케이";
    const domain = process.argv[4] || "";
    quickBrand(target, domain).then(result => {
      console.log("\n팔레트:", JSON.stringify(result.palette, null, 2));
    }).catch(err => console.error("에러:", err.message));

  } else {
    console.log(`
═══════════════════════════════════════════════════════
  AI 강화 PPT 생성 파이프라인
═══════════════════════════════════════════════════════

사용법:
  node ai_pipeline.js prepare <대상회사> <도메인> <프로젝트명> <핵심메시지>
    → 브랜드 분석 + 카피 정제 → pptx_vars.js 생성

  node ai_pipeline.js qa <pptx파일경로>
    → 생성된 PPT 시각 품질 검수

  node ai_pipeline.js brand <회사명> <도메인>
    → 브랜드 분석만 (색상 추출 + 팔레트 생성)

예시:
  node ai_pipeline.js prepare "현대자동차 제네시스" "genesis.com" "VIP 셔틀" "프리미엄 이동"
  node ai_pipeline.js qa "./output/제안서.pptx"
  node ai_pipeline.js brand "인천관광공사" "itour.or.kr"

환경 변수:
  ANTHROPIC_API_KEY  Claude API 키 (카피 정제 + QA에 필요)
═══════════════════════════════════════════════════════
    `.trim());
  }
}
