# Phase 3: PPT 코드 생성

`references/01_생성프롬프트_가이드.md`의 섹션 12 (PPT 코드 생성 가이드)를 반드시 읽고 따른다.

## 작업 디렉토리 정책 (필수)

PPT 생성 작업 폴더는 **사용자가 지정한 베이스 경로 하위에** 시나리오별 서브폴더로 생성한다. Temp 폴더(`%TEMP%`, `AppData\Local\Temp`)는 사용 금지.

### 베이스 경로 결정 흐름

Phase 0의 자료 수집 단계에서 **반드시 사용자에게 작업 폴더 위치를 물어본다.** 이전 대화에서 이미 정해진 경로가 메모리에 저장되어 있다면 그 경로를 기본값으로 제시하고 유지 여부만 확인한다.

**질문 형식:**
```
PPT 작업 파일을 어디에 저장할까요?

  [기본값] {memory에 저장된 경로 또는 "지정 안 됨"}

  - 기본값 그대로 사용하려면 'ㄱㄱ' 또는 'ok'
  - 다른 경로를 원하시면 절대경로를 입력해 주세요
    (예: D:\Proposals\2026\)
```

사용자가 새 경로를 지정하면 **memory에 reference 타입으로 저장**하여 다음 대화부터 기본값으로 사용한다 (memory 키: "ppt 작업 폴더 베이스 경로").

### 폴더 구조

```
{사용자_지정_베이스_경로}\
  {YYYYMMDD}_{시나리오슬러그}_v{N}\
    generate_ppt.js
    pptx_vars.js
    slides_png/           <- Phase 4 시각 QA용 PNG
    {제안서명}.pptx       <- 최종 산출물
    (기타 작업 파일들)
```

**규칙:**
1. **베이스 경로 변수**로 코드 상단에 정의:
   ```javascript
   const WORK_BASE = '<사용자가 지정한 절대경로>';
   ```
2. **폴더명 형식**: `YYYYMMDD_시나리오슬러그_v버전` (예: `20260410_samsung_pyeongtaek_v1`)
   - 시나리오슬러그는 영문 소문자 + 언더스코어
   - 같은 날 같은 시나리오를 재생성하면 v2, v3로 증가
3. **폴더 미존재 시 생성**: `fs.mkdirSync(workDir, { recursive: true })`
4. **경로 처리 주의**:
   - Bash 환경에서 OneDrive 한글 경로는 종종 단축 경로로 표시되지만, **Node.js / PowerShell에서는 원본 한글 경로를 사용**한다
   - 경로에 공백이 있으므로 PowerShell 호출 시 반드시 따옴표 처리
5. **사용자에게 안내**: 작업 시작 시 "작업 폴더: `{베이스경로}\YYYYMMDD_xxx_v1`" 한 줄로 통지

## 핵심 규격

**폰트 변수:**
```javascript
const FN_XB = 'Pretendard ExtraBold';
const FN_MD = 'Pretendard Medium';
const FN    = 'Pretendard';           // Regular weight
const FN_TN = 'Pretendard Thin';
```

**표지 (createCover) -- S01:**
```
x=0.57"  라벨 y=2.43" 18pt Medium
         메인카피 y=2.91" 40~54pt ExtraBold
         서브카피 y=4.83" 14pt Thin
         bgImage 파라미터로 AI 배경 적용
```

**간지 (createDivider) -- S02:**
```
x=0.57"  챕터라벨 y=2.33" 13pt Medium
         타이틀 y=3.03" 40pt ExtraBold
         보조텍스트 y=4.47" 13pt Thin
         bgImage 파라미터로 AI 배경 적용
```

**마무리 (createEnding) -- S43:**
```
LEFT-ALIGNED x=1.47"
         히어로 = 다짐/약속 카피 (36pt ExtraBold, y=3.40")
           -> "감사합니다"가 아니라 "성공적인 대회를 약속드립니다" 같은 약속 문구가 주인공
         구분선 y=5.30" w=2"
         "감사합니다" y=5.63" 14pt Medium (보조 텍스트로 격하)
         저작권 y=6.45" 12pt Thin
         bgImage 파라미터로 AI 배경 적용
```

> **마무리 페이지 히어로 규칙**: 마무리 슬라이드의 가장 큰 텍스트(히어로)는 **약속/다짐 카피**여야 한다. "감사합니다"는 보조 텍스트(14pt)로 아래에 작게 배치한다.

> **ending.js Type B 코드 불일치 경고**: `ending.js` Type B("cinematic")는 현재 `thankYouText`를 38pt 히어로로, `promiseText`를 15pt 서브로 렌더링한다. 이는 히어로 규칙과 **정면 충돌**한다. **수동으로 마무리 슬라이드를 구현**해야 한다.

> **마무리 히어로 텍스트박스 자동 검증 (필수)**:
> - 한글 1자 점유 폭(인치) = `폰트사이즈(pt) x 0.6 / 72`
> - 필요 width = `글자수 x 한글 1자 폭 + 패딩 0.5"`
> - 히어로 텍스트박스 width는 슬라이드 width의 **60% 이상(최소 7")** 확보
> - 텍스트박스 height는 폰트사이즈 x 1.5 x 줄수 / 72 + 0.3" 이상

**본문 헤더 (모든 본문 페이지 공통 -- 절대 고정):**
```
챕터라벨: x=0.47" y=0.21" w=5.0" h=0.25"  (9pt FN_MD, 단일 텍스트 요소)
  -> 형식: "Ch1. 산업 이해와 과제 진단" (챕터번호 + 챕터명을 하나의 텍스트로 통일)
  -> 하나의 addText로 구현 (pageNum + label 두 개로 분리 금지)
  -> (X) "03  산업 이해" (페이지 번호 사용 금지)
핵심 메시지 (ExtraBold 16pt): x=0.47" y=0.68" w=10.75" h=0.47"  <- 반드시 FN_XB 적용
부제목 (Regular 10pt): x=0.47" y=1.18" w=10.75" h=0.29"
구분선 (DOM): x=0.47" y=1.55" w=10.75" h=0.015"
콘텐츠 시작선: y=1.77" (Content Box 상단)
콘텐츠 영역: Content Box 참조 -- x=0.53~11.16" (w=10.63"), y=1.77~7.68" (h=5.91")
```

> **헤드라인 폰트 규칙**: 각 본문 페이지의 핵심 메시지(y=0.68 위치)는 반드시 `Pretendard ExtraBold` (FN_XB)를 사용한다.

> **챕터 라벨 규칙**: 좌측 상단 라벨은 해당 페이지가 속한 챕터의 번호와 챕터명을 표시한다. 페이지 순번이 아닌 챕터 정보를 보여주는 것이 목적이다.

**슬라이드 규격**: A4 가로 11.69 x 8.27 inches

## Content Box -- 본문 페이지 레이아웃의 핵심 원칙

모든 본문 페이지(기본+강조)에서, 헤더 아래의 콘텐츠는 **가상의 사각형 영역(Content Box)** 안에 균형감 있게 배치한다.

```
슬라이드 (11.69" x 8.27")
  헤더 (y=0.21~1.55)
  Content Box (10.63" x 5.91")
    x=0.53"  ->  x=11.16"
    y=1.77"  ->  y=7.68"
```

**Content Box 규격:**
| 항목 | 값 | 비고 |
|------|-----|------|
| 너비 | 10.63" (27cm) | 슬라이드 좌우 중앙 정렬 |
| 높이 | 5.91" (15cm) | 헤더 구분선 아래부터 |
| X 시작 | 0.53" | (11.69 - 10.63) / 2 |
| Y 시작 | 1.77" | 헤더 구분선(y=1.55) + 여백 0.22" |
| X 끝 | 11.16" | 0.53 + 10.63 |
| Y 끝 | 7.68" | 1.77 + 5.91 |

**Content Box 적용 규칙:**
1. **경계 준수**: 모든 텍스트, 카드, 아이콘, 차트는 Content Box 경계를 벗어나지 않는다
2. **균등 배치**: 카드나 아이콘이 여러 개일 때, Content Box 내에서 균등 간격으로 배치한다
3. **여백 일관성**: Content Box 내부의 상하좌우 패딩은 최소 0.15"를 유지한다
4. **슬라이드 간 통일성**: 서로 다른 본문 페이지라도 콘텐츠의 시작점(x, y)과 끝점이 Content Box 기준으로 정렬
5. **그리드 활용**: Content Box를 2등분(좌/우), 3등분, 4등분 등으로 나눠 레이아웃 그리드로 활용

**레이아웃 그리드 예시:**
```javascript
// Content Box 기본 상수
const CB_X = 0.53;   // Content Box X 시작
const CB_Y = 1.77;   // Content Box Y 시작
const CB_W = 10.63;  // Content Box 너비
const CB_H = 5.91;   // Content Box 높이
const CB_PAD = 0.15; // Content Box 내부 패딩
const CB_GAP = 0.20; // 카드 간 간격

// 2열 그리드
const col2W = (CB_W - CB_PAD * 2 - CB_GAP) / 2;
const col2_x1 = CB_X + CB_PAD;
const col2_x2 = col2_x1 + col2W + CB_GAP;

// 3열 그리드
const col3W = (CB_W - CB_PAD * 2 - CB_GAP * 2) / 3;
const col3_x1 = CB_X + CB_PAD;
const col3_x2 = col3_x1 + col3W + CB_GAP;
const col3_x3 = col3_x2 + col3W + CB_GAP;
```

> **주의**: 표지(S01), 간지(S02), 마무리(S43)에는 Content Box를 적용하지 않는다. 이들은 가이드에 정의된 고정 좌표를 따른다.

## 도형 테두리 제거 필수 규칙

모든 도형(addShape)에는 반드시 `line: { type: "none" }` 속성을 추가하여 테두리를 제거한다.
- 올바른 예: `line: { type: "none" }`
- 금지: `line: { width: 0 }` -- pptxgenjs에서 얇은 테두리가 렌더링됨
- 금지: `line` 속성 생략 -- 기본 검정 테두리가 표시됨

## Insight Box 표준 규격

본문 페이지에서 핵심 인사이트를 강조할 때 사용하는 박스의 표준:
- **Fill**: DOM (브랜드 대표색), `rectRadius: 0.06`
- **Text**: W (white), 14pt FN_XB, `align: 'center'`
- **Height**: 최소 0.60" 이상 확보
- 반드시 `line: { type: "none" }` 적용

## 코드 생성 절차

1. `pptx_vars.js` 생성 -- Phase 1/2의 결과(팔레트, 카피, 배경)를 변수로 정리
2. 메인 생성 코드 작성 -- pptxgenjs로 각 슬라이드 생성
3. `node generate_ppt.js` 실행하여 .pptx 출력
4. 생성된 파일 경로를 사용자에게 전달

> **Phase 3 코드 작성 전, 반드시 다음 파일들을 Read하세요:**
> - `phases/phase3_anti_patterns.md` -- AP-01~AP-22 안티패턴 규칙
> - `phases/phase3_fill_rate.md` -- Fill-Rate, 카드 밀도, pptxgenjs 효과 가이드
