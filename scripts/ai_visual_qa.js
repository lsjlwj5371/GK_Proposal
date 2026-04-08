/**
 * ═══════════════════════════════════════════════════════════════════
 *  모듈 ⑤ — AI 시각 QA (Visual Quality Assurance)
 * ═══════════════════════════════════════════════════════════════════
 *
 *  기능:
 *   1. PPTX → 슬라이드별 PNG 이미지 변환 (LibreOffice 또는 PowerShell)
 *   2. Claude Vision API로 각 슬라이드 품질 분석
 *   3. 레퍼런스 PPT 대비 유사도 비교
 *   4. 자동 수정 제안 생성 (좌표 포함)
 *   5. 슬라이드별 점수 + 전체 보고서
 *
 *  사용법:
 *   const { runVisualQA, convertPptxToImages } = require("./ai_visual_qa");
 *   const report = await runVisualQA("output.pptx", {
 *     referenceDir: "./Sample/",  // 레퍼런스 PPT 이미지 폴더 (선택)
 *   });
 *
 *  필요:
 *   - @anthropic-ai/sdk (npm install @anthropic-ai/sdk)
 *   - LibreOffice (soffice) 또는 Microsoft PowerPoint (Windows)
 *   - 환경 변수: ANTHROPIC_API_KEY
 * ═══════════════════════════════════════════════════════════════════
 */

const Anthropic = require("@anthropic-ai/sdk").default;
const { execSync, exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

// ─────────────────────────────────────────────────
// 1. PPTX → PNG 변환
// ─────────────────────────────────────────────────

/**
 * PPTX 파일의 각 슬라이드를 PNG 이미지로 변환합니다.
 *
 * 변환 방법 우선순위:
 *   1. LibreOffice (크로스 플랫폼, 무료)
 *   2. PowerShell + COM (Windows 전용, PowerPoint 필요)
 *
 * @param {string} pptxPath - PPTX 파일 경로
 * @param {string} [outputDir] - 출력 디렉토리 (기본: temp)
 * @returns {string[]} PNG 파일 경로 배열
 */
async function convertPptxToImages(pptxPath, outputDir) {
  if (!fs.existsSync(pptxPath)) {
    throw new Error(`PPTX 파일을 찾을 수 없습니다: ${pptxPath}`);
  }

  outputDir = outputDir || path.join(os.tmpdir(), `pptx_qa_${Date.now()}`);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`[VisualQA] PPTX → PNG 변환 시작: ${pptxPath}`);

  // 방법 1: LibreOffice
  const libreOfficePaths = [
    "soffice",
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
    "/usr/bin/soffice",
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
  ];

  for (const soffice of libreOfficePaths) {
    try {
      const cmd = `"${soffice}" --headless --convert-to png --outdir "${outputDir}" "${pptxPath}"`;
      execSync(cmd, { timeout: 60000, stdio: "pipe" });
      const files = fs.readdirSync(outputDir)
        .filter(f => f.endsWith(".png"))
        .sort()
        .map(f => path.join(outputDir, f));

      if (files.length > 0) {
        console.log(`[VisualQA] LibreOffice 변환 완료: ${files.length}장`);
        return files;
      }
    } catch (e) {
      // 다음 경로 시도
    }
  }

  // 방법 2: PowerShell + PowerPoint COM (Windows 전용)
  if (process.platform === "win32") {
    try {
      const psScript = `
$pptx = [System.IO.Path]::GetFullPath("${pptxPath.replace(/\\/g, "\\\\")}")
$outDir = [System.IO.Path]::GetFullPath("${outputDir.replace(/\\/g, "\\\\")}")
$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoFalse
$presentation = $ppt.Presentations.Open($pptx, $true, $false, $false)
$slideIndex = 1
foreach ($slide in $presentation.Slides) {
    $outFile = Join-Path $outDir ("slide_" + $slideIndex.ToString("D3") + ".png")
    $slide.Export($outFile, "PNG", 1920, 1080)
    $slideIndex++
}
$presentation.Close()
$ppt.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
Write-Output "SUCCESS:$($slideIndex - 1)"
`.trim();

      const result = execSync(
        `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`,
        { timeout: 120000, encoding: "utf8" }
      );

      if (result.includes("SUCCESS")) {
        const files = fs.readdirSync(outputDir)
          .filter(f => f.endsWith(".png"))
          .sort()
          .map(f => path.join(outputDir, f));
        console.log(`[VisualQA] PowerPoint COM 변환 완료: ${files.length}장`);
        return files;
      }
    } catch (e) {
      console.error(`[VisualQA] PowerPoint COM 변환 실패: ${e.message}`);
    }
  }

  // 방법 3: pdf2pic 폴백 (PPTX → PDF → PNG)
  try {
    // 먼저 LibreOffice로 PDF 변환 시도
    for (const soffice of libreOfficePaths) {
      try {
        execSync(`"${soffice}" --headless --convert-to pdf --outdir "${outputDir}" "${pptxPath}"`, {
          timeout: 60000, stdio: "pipe"
        });
        const pdfFile = fs.readdirSync(outputDir).find(f => f.endsWith(".pdf"));
        if (pdfFile) {
          const pdfPath = path.join(outputDir, pdfFile);
          // pdf2pic으로 PDF → PNG
          const { fromPath } = require("pdf2pic");
          const converter = fromPath(pdfPath, {
            density: 150,
            saveFilename: "slide",
            savePath: outputDir,
            format: "png",
            width: 1920,
            height: 1080,
          });
          // 페이지 수 확인
          const pdfParse = require("pdf-parse");
          const pdfBuffer = fs.readFileSync(pdfPath);
          const pdfData = await pdfParse(pdfBuffer);
          const pageCount = pdfData.numpages;

          for (let i = 1; i <= pageCount; i++) {
            await converter(i);
          }

          const files = fs.readdirSync(outputDir)
            .filter(f => f.startsWith("slide") && f.endsWith(".png"))
            .sort()
            .map(f => path.join(outputDir, f));

          if (files.length > 0) {
            console.log(`[VisualQA] PDF 경유 변환 완료: ${files.length}장`);
            return files;
          }
        }
      } catch (e) {
        // 다음 시도
      }
    }
  } catch (e) {
    // pdf2pic 없을 수 있음
  }

  throw new Error(
    "[VisualQA] PPTX → PNG 변환 실패.\n" +
    "다음 중 하나를 설치해주세요:\n" +
    "1. LibreOffice: https://www.libreoffice.org/download/\n" +
    "2. Microsoft PowerPoint (Windows)\n" +
    "설치 후 다시 실행하면 자동으로 변환됩니다."
  );
}

// ─────────────────────────────────────────────────
// 2. 단일 슬라이드 QA 분석
// ─────────────────────────────────────────────────

/**
 * Claude Vision으로 단일 슬라이드를 분석합니다.
 *
 * @param {string} imagePath - 슬라이드 PNG 경로
 * @param {Object} slideInfo - { index, type, chapterTitle }
 * @param {string} [referencePath] - 레퍼런스 이미지 경로 (선택)
 * @param {string} [apiKey]
 * @returns {Object} 분석 결과
 */
async function analyzeSlide(imagePath, slideInfo, referencePath, apiKey) {
  const client = new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });

  const imageData = fs.readFileSync(imagePath).toString("base64");
  const content = [];

  // 생성된 슬라이드
  content.push({
    type: "image",
    source: { type: "base64", media_type: "image/png", data: imageData },
  });

  // 레퍼런스 (있으면)
  if (referencePath && fs.existsSync(referencePath)) {
    const refData = fs.readFileSync(referencePath).toString("base64");
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/png", data: refData },
    });
    content.push({
      type: "text",
      text: `[첫 번째 이미지: 생성된 슬라이드] [두 번째 이미지: 레퍼런스]`
    });
  }

  content.push({
    type: "text",
    text: `
슬라이드 #${slideInfo.index} (유형: ${slideInfo.type || "본문"})를 아래 기준으로 분석해주세요.

[분석 기준]
1. 레이아웃 정렬 (alignment): 요소들이 좌우/상하로 정렬되어 있는가
2. 시각적 밀도 (fill-rate): 콘텐츠 영역의 채움 비율 (빈 공간 40% 이하)
3. 색상 일관성 (color): 6:3:1 비율이 지켜지는가, 색상이 조화로운가
4. 타이포그래피 (typography): 폰트 크기 위계, 가독성
5. 시각 요소 (visuals): 비텍스트 요소 2개 이상 있는가 (아이콘, 도형, 이미지 등)
6. 헤더 일관성 (header): 헤더 영역이 규격대로 배치되어 있는가
7. 전체 완성도 (overall): 전문적인 제안서 느낌이 나는가
${referencePath ? "8. 레퍼런스 대비 유사도 (similarity): 레퍼런스와 비교했을 때 품질 차이" : ""}

반드시 아래 JSON 형식으로만 답해주세요:
{
  "slideIndex": ${slideInfo.index},
  "scores": {
    "alignment": 85,
    "fillRate": 70,
    "color": 90,
    "typography": 80,
    "visuals": 75,
    "header": 95,
    "overall": 82
    ${referencePath ? ', "similarity": 70' : ''}
  },
  "estimatedFillRate": 65,
  "issues": [
    {
      "category": "alignment|fillRate|color|typography|visuals|header",
      "severity": "high|medium|low",
      "description": "문제 설명 (한국어)",
      "fix": "수정 방법 (좌표, 색상 등 구체적으로)"
    }
  ],
  "strengths": ["잘 된 점 1", "잘 된 점 2"],
  "needsRegeneration": false
}

JSON만 출력해주세요. 마크다운 코드블록 없이.`.trim()
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content }],
  });

  try {
    const text = response.content[0].text.trim();
    const jsonStr = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error(`[VisualQA] 슬라이드 ${slideInfo.index} 분석 파싱 실패`);
    return {
      slideIndex: slideInfo.index,
      scores: { overall: 50 },
      issues: [{ category: "parse", severity: "high", description: "분석 결과 파싱 실패" }],
      needsRegeneration: false,
    };
  }
}

// ─────────────────────────────────────────────────
// 3. 전체 QA 실행
// ─────────────────────────────────────────────────

/**
 * PPTX 파일 전체에 대한 시각 QA를 실행합니다.
 *
 * @param {string} pptxPath - PPTX 파일 경로
 * @param {Object} [options]
 *   - slideTypes: 슬라이드별 유형 배열 ["cover", "divider", "standard", "highlight", "ending"]
 *   - referenceDir: 레퍼런스 이미지 디렉토리 (선택)
 *   - referenceImages: 레퍼런스 이미지 경로 배열 (선택)
 *   - apiKey: Anthropic API Key
 *   - concurrency: 동시 분석 수 (기본 3)
 *   - outputDir: 변환 이미지 저장 디렉토리
 * @returns {Object} QA 보고서
 */
async function runVisualQA(pptxPath, options = {}) {
  const {
    slideTypes = [],
    referenceImages = [],
    apiKey,
    concurrency = 3,
    outputDir,
  } = options;

  console.log(`[VisualQA] ═══ 시각 QA 시작 ═══`);
  console.log(`[VisualQA] 대상: ${pptxPath}`);

  // Step 1: PPTX → PNG 변환
  const slideImages = await convertPptxToImages(pptxPath, outputDir);
  console.log(`[VisualQA] ${slideImages.length}장 변환 완료`);

  // Step 2: 각 슬라이드 분석 (동시 실행 제한)
  const results = [];
  for (let i = 0; i < slideImages.length; i += concurrency) {
    const batch = slideImages.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((imgPath, batchIdx) => {
        const slideIdx = i + batchIdx;
        const slideType = slideTypes[slideIdx] || inferSlideType(slideIdx, slideImages.length);
        const refImg = referenceImages[slideIdx] || null;

        console.log(`[VisualQA] 분석 중: 슬라이드 ${slideIdx + 1}/${slideImages.length} (${slideType})`);

        return analyzeSlide(imgPath, {
          index: slideIdx + 1,
          type: slideType,
        }, refImg, apiKey);
      })
    );
    results.push(...batchResults);
  }

  // Step 3: 종합 보고서 생성
  const report = generateReport(results, slideImages.length);

  console.log(`\n[VisualQA] ═══ QA 결과 요약 ═══`);
  console.log(`  전체 점수: ${report.overallScore}/100`);
  console.log(`  양호: ${report.summary.good}장 | 개선 필요: ${report.summary.needsImprovement}장 | 재생성: ${report.summary.needsRegeneration}장`);

  if (report.criticalIssues.length > 0) {
    console.log(`\n  🚨 핵심 이슈 (${report.criticalIssues.length}건):`);
    report.criticalIssues.forEach(issue => {
      console.log(`    - [슬라이드 ${issue.slideIndex}] ${issue.description}`);
    });
  }

  // 이미지 경로 정보 추가
  report.imageDir = path.dirname(slideImages[0]);
  report.slideImages = slideImages;

  return report;
}

// ─────────────────────────────────────────────────
// 4. 보고서 생성
// ─────────────────────────────────────────────────

function generateReport(results, totalSlides) {
  const scores = results.map(r => r.scores?.overall || 50);
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // 카테고리별 평균
  const categories = ["alignment", "fillRate", "color", "typography", "visuals", "header"];
  const categoryAverages = {};
  categories.forEach(cat => {
    const catScores = results
      .map(r => r.scores?.[cat])
      .filter(s => s != null);
    categoryAverages[cat] = catScores.length > 0
      ? Math.round(catScores.reduce((a, b) => a + b, 0) / catScores.length)
      : null;
  });

  // 핵심 이슈 (high severity)
  const criticalIssues = results.flatMap(r =>
    (r.issues || [])
      .filter(i => i.severity === "high")
      .map(i => ({ slideIndex: r.slideIndex, ...i }))
  );

  // 모든 이슈
  const allIssues = results.flatMap(r =>
    (r.issues || []).map(i => ({ slideIndex: r.slideIndex, ...i }))
  );

  // 분류
  const good = results.filter(r => (r.scores?.overall || 0) >= 80).length;
  const needsImprovement = results.filter(r => {
    const s = r.scores?.overall || 0;
    return s >= 60 && s < 80;
  }).length;
  const needsRegeneration = results.filter(r =>
    r.needsRegeneration || (r.scores?.overall || 0) < 60
  ).length;

  // Fill-Rate 통계
  const fillRates = results.map(r => r.estimatedFillRate).filter(f => f != null);
  const avgFillRate = fillRates.length > 0
    ? Math.round(fillRates.reduce((a, b) => a + b, 0) / fillRates.length)
    : null;
  const lowFillRateSlides = results
    .filter(r => r.estimatedFillRate != null && r.estimatedFillRate < 60)
    .map(r => r.slideIndex);

  return {
    overallScore,
    totalSlides,
    categoryAverages,
    avgFillRate,
    lowFillRateSlides,
    summary: { good, needsImprovement, needsRegeneration },
    criticalIssues,
    allIssues,
    slideResults: results,
    // 재생성이 필요한 슬라이드 인덱스
    regenerateSlides: results
      .filter(r => r.needsRegeneration || (r.scores?.overall || 0) < 60)
      .map(r => r.slideIndex),
    // 개선 제안이 있는 슬라이드
    improvementSlides: results
      .filter(r => {
        const s = r.scores?.overall || 0;
        return s >= 60 && s < 80 && (r.issues || []).length > 0;
      })
      .map(r => ({
        slideIndex: r.slideIndex,
        score: r.scores.overall,
        topIssue: r.issues[0]?.description,
        fix: r.issues[0]?.fix,
      })),
  };
}

// ─────────────────────────────────────────────────
// 5. 슬라이드 유형 추론
// ─────────────────────────────────────────────────

function inferSlideType(index, total) {
  if (index === 0) return "cover";
  if (index === total - 1) return "ending";
  // 간지는 보통 전체의 특정 비율에 나타남 — 추정
  const ratio = index / total;
  if (ratio < 0.05) return "divider";
  if (ratio > 0.9) return "standard";
  return "standard";
}

// ─────────────────────────────────────────────────
// 6. QA 기반 수정 제안 코드 생성
// ─────────────────────────────────────────────────

/**
 * QA 결과를 바탕으로 수정 코드 스니펫을 생성합니다.
 *
 * @param {Object} qaReport - runVisualQA()의 결과
 * @param {string} [apiKey]
 * @returns {Object} { patches: [{ slideIndex, code, description }] }
 */
async function generateFixPatches(qaReport, apiKey) {
  const client = new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });

  const slidesToFix = qaReport.slideResults.filter(r =>
    (r.scores?.overall || 0) < 80 && (r.issues || []).length > 0
  );

  if (slidesToFix.length === 0) {
    console.log("[VisualQA] 수정이 필요한 슬라이드가 없습니다.");
    return { patches: [] };
  }

  console.log(`[VisualQA] ${slidesToFix.length}장의 수정 코드 생성 중...`);

  const patches = [];

  for (const slide of slidesToFix) {
    const issueDesc = slide.issues
      .map(i => `- [${i.category}/${i.severity}] ${i.description} → 수정: ${i.fix}`)
      .join("\n");

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `
pptxgenjs로 생성한 PPT의 슬라이드 ${slide.slideIndex}에 아래 문제가 있습니다.
수정을 위한 pptxgenjs 코드 스니펫을 생성해주세요.

[현재 점수] ${slide.scores?.overall || "N/A"}/100
[문제 목록]
${issueDesc}

[규격 참조]
- 슬라이드: A4 가로 (11.69 x 8.27in)
- 헤더: 페이지번호 y=0.21, 핵심메시지 y=0.68, 부제목 y=1.18, 구분선 y=1.55
- 콘텐츠 시작: y=2.00
- 콘텐츠 영역: x=0.47~11.22 (w=10.75), y=2.00~7.50 (h=5.50)
- 색상: DOM(주), SEC(보조), ACC(강조) 변수 사용

아래 JSON으로 답해주세요:
{
  "slideIndex": ${slide.slideIndex},
  "description": "수정 설명",
  "additions": [
    "// 추가할 코드 (각 줄이 하나의 addText/addShape 호출)"
  ],
  "removals": ["제거할 요소 설명"],
  "modifications": ["수정할 요소 설명과 새 좌표/속성"]
}

JSON만 출력. 마크다운 코드블록 없이.`.trim()
      }],
    });

    try {
      const text = response.content[0].text.trim();
      const jsonStr = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      patches.push(JSON.parse(jsonStr));
    } catch (e) {
      patches.push({
        slideIndex: slide.slideIndex,
        description: "수정 코드 생성 실패",
        additions: [],
      });
    }
  }

  return { patches };
}

// ─────────────────────────────────────────────────
// 7. 전체 QA + 자동 수정 루프
// ─────────────────────────────────────────────────

/**
 * QA → 수정 → 재QA를 자동 반복합니다.
 * (현재는 수정 제안까지만 제공. 자동 코드 패치는 향후 구현)
 *
 * @param {string} pptxPath
 * @param {Object} options - runVisualQA options + { targetScore, maxIterations }
 * @returns {Object} { report, patches, finalScore }
 */
async function qaAndFixLoop(pptxPath, options = {}) {
  const { targetScore = 80, maxIterations = 1, ...qaOptions } = options;

  console.log(`[VisualQA] ═══ QA + 수정 루프 시작 (목표: ${targetScore}점) ═══`);

  let report = await runVisualQA(pptxPath, qaOptions);
  let iteration = 1;
  let patches = null;

  if (report.overallScore < targetScore) {
    console.log(`[VisualQA] 점수 ${report.overallScore} < 목표 ${targetScore}, 수정 제안 생성 중...`);
    patches = await generateFixPatches(report, qaOptions.apiKey);

    if (patches.patches.length > 0) {
      console.log(`\n[VisualQA] ═══ 수정 제안 ${patches.patches.length}건 ═══`);
      patches.patches.forEach(p => {
        console.log(`  슬라이드 ${p.slideIndex}: ${p.description}`);
        if (p.additions && p.additions.length > 0) {
          console.log(`    추가: ${p.additions.length}개 요소`);
        }
      });
    }
  }

  return {
    report,
    patches,
    finalScore: report.overallScore,
    passedTarget: report.overallScore >= targetScore,
    slidesNeedingWork: report.regenerateSlides.length + report.improvementSlides.length,
  };
}

// ─────────────────────────────────────────────────
// 8. 유틸리티: 레퍼런스 이미지 준비
// ─────────────────────────────────────────────────

/**
 * 레퍼런스 PPTX 파일들을 이미지로 변환하여 비교 준비합니다.
 *
 * @param {string[]} referencePptxPaths - 레퍼런스 PPTX 파일 경로 배열
 * @param {string} outputBaseDir - 출력 기본 디렉토리
 * @returns {Object} { [filename]: string[] } 파일명별 이미지 경로 배열
 */
async function prepareReferenceImages(referencePptxPaths, outputBaseDir) {
  const result = {};
  for (const pptxPath of referencePptxPaths) {
    const name = path.basename(pptxPath, ".pptx");
    const outDir = path.join(outputBaseDir, name);
    try {
      const images = await convertPptxToImages(pptxPath, outDir);
      result[name] = images;
      console.log(`[VisualQA] 레퍼런스 준비 완료: ${name} (${images.length}장)`);
    } catch (e) {
      console.error(`[VisualQA] 레퍼런스 변환 실패: ${name} — ${e.message}`);
      result[name] = [];
    }
  }
  return result;
}

// ─────────────────────────────────────────────────
// 9. 슬라이드 간 일관성 검증
// ─────────────────────────────────────────────────

/**
 * 같은 분류의 슬라이드들이 시각적으로 일관적인지 검증합니다.
 *
 * @param {string[]} slideImages - 같은 분류의 슬라이드 이미지 경로 배열
 * @param {string} classificationType - "standard" | "highlight" | "divider"
 * @param {string} [apiKey]
 * @returns {Object} { consistent, score, issues }
 */
async function checkConsistency(slideImages, classificationType, apiKey) {
  if (slideImages.length < 2) {
    return { consistent: true, score: 100, issues: [] };
  }

  const client = new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });

  // 최대 4장까지만 비교 (토큰 절약)
  const sampled = slideImages.slice(0, 4);
  const content = [];

  sampled.forEach((imgPath, i) => {
    const data = fs.readFileSync(imgPath).toString("base64");
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/png", data },
    });
  });

  content.push({
    type: "text",
    text: `
위 ${sampled.length}장의 슬라이드는 모두 "${classificationType}" 유형입니다.
같은 유형의 슬라이드들이 시각적으로 일관적인지 분석해주세요.

[일관성 체크 항목]
1. 헤더 위치가 모든 슬라이드에서 동일한가
2. 폰트 크기/색상이 동일한가
3. 여백/마진이 통일되어 있는가
4. 색상 팔레트가 동일한가
5. 시각 요소의 스타일이 통일되어 있는가 (카드 모서리, 그림자 등)

JSON으로 답해주세요:
{
  "consistent": true/false,
  "score": 85,
  "issues": [
    { "description": "불일치 설명", "affectedSlides": [1, 3], "fix": "수정 방법" }
  ]
}

JSON만 출력. 마크다운 코드블록 없이.`.trim()
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content }],
  });

  try {
    const text = response.content[0].text.trim();
    const jsonStr = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    return { consistent: true, score: 70, issues: [] };
  }
}

// ─────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────

module.exports = {
  convertPptxToImages,
  analyzeSlide,
  runVisualQA,
  generateFixPatches,
  qaAndFixLoop,
  prepareReferenceImages,
  checkConsistency,
};

// ─────────────────────────────────────────────────
// CLI 직접 실행
// ─────────────────────────────────────────────────

if (require.main === module) {
  const pptxPath = process.argv[2];
  if (!pptxPath) {
    console.log("사용법: node ai_visual_qa.js <pptx파일경로> [레퍼런스디렉토리]");
    console.log("예: node ai_visual_qa.js output.pptx ./Sample/");
    process.exit(1);
  }

  const refDir = process.argv[3] || null;

  qaAndFixLoop(pptxPath, {
    targetScore: 75,
    maxIterations: 1,
  })
    .then(result => {
      console.log("\n═══ 최종 보고서 ═══");
      console.log(`전체 점수: ${result.finalScore}/100`);
      console.log(`목표 달성: ${result.passedTarget ? "✅" : "❌"}`);
      console.log(`수정 필요: ${result.slidesNeedingWork}장`);

      if (result.patches && result.patches.patches.length > 0) {
        console.log("\n═══ 수정 제안 ═══");
        result.patches.patches.forEach(p => {
          console.log(`\n[슬라이드 ${p.slideIndex}] ${p.description}`);
          if (p.additions) {
            p.additions.forEach(a => console.log(`  + ${a}`));
          }
        });
      }

      // 보고서를 JSON 파일로 저장
      const reportPath = pptxPath.replace(".pptx", "_qa_report.json");
      fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), "utf8");
      console.log(`\n보고서 저장: ${reportPath}`);
    })
    .catch(err => console.error("에러:", err.message));
}
