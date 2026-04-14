# Phase 3: Fill-Rate, 카드 밀도, 효과 가이드

> **이 파일은 PPT 코드 생성(Phase 3) 전에 반드시 Read해야 합니다.**

---

## 여백(white-space) 정량 판단 기준 -- 가장 중요

여백 관리는 본 스킬에서 가장 빈번하게 실패하는 영역이다.

### 1) 슬라이드 레벨 (Content Box 전체)

| 측정 | 정의 | 기준 |
|------|------|------|
| **Slide Fill Rate** | 콘텐츠 도형/텍스트 점유 면적 / Content Box 면적(10.63 x 5.91 = **62.82 in2**) | **>= 80%** |
| **연속 빈 영역(Empty Patch)** | 콘텐츠가 없는 사각형 영역의 최대 크기 | **<= 4 in2 (가로 2.5" x 세로 1.6" 이내)** |
| **하단 마진** | 마지막 콘텐츠 하단 ~ Content Box 하단(y=7.68) | **<= 0.35"** (insight box 미사용 시) |

### 2) 카드/그룹 레벨 (개별 카드 내부)

| 측정 | 정의 | 기준 |
|------|------|------|
| **Card Fill Rate** | 카드 내 텍스트+아이콘+장식 점유 면적 / 카드 전체 면적 | **>= 65%** |
| **수직 여백 비율** | 카드 내 텍스트 블록 아래 빈 공간 / 카드 높이 | **<= 20%** |
| **상단 패딩** | 카드 상단 ~ 첫 텍스트 | 카드 높이의 8~12% (그리드 내 일관) |

### 3) 여백 위반 시 대응 우선순위 (반드시 1번부터 순서대로)

1. **콘텐츠 보강** (Step 0 자료 추가 추출 -- 가장 우선)
2. **폰트 확대** (헤드라인 +2pt, 본문 +1~2pt -- 단, 카드 그리드 내에서는 일괄 적용)
3. **도식화** (아이콘, 구분선, 컬러 바, 작은 차트, 진행률 바 추가)
4. **이미지/플레이스홀더 삽입** (관련 이미지 영역 표시)
5. **카드 수 축소** (4개 -> 3개로 줄이고 카드 폭 확대)
6. **금지**: 의미 없는 장식 도형으로 빈 공간을 채우는 것 (AP-03)

---

## Fill-Rate 규칙 + 카드 내부 밀도 (매우 중요)

**슬라이드 레벨**: 콘텐츠 영역 채움률 80% 이상 유지

**카드/블록 레벨 (더 중요)**: 개별 카드 내부의 여백이 50%를 넘지 않도록 관리한다.

**밀도 확보 방법 (우선순위순):**

1. **폰트 크기 확대**: 카드 내 핵심 텍스트를 키워 시각적 무게감 확보
   - 카드 타이틀: 최소 14pt, 권장 16~20pt
   - 카드 본문: 최소 11pt, 권장 12~14pt
   - 핵심 수치: 28pt+ 대형 타이포그래피 적극 활용
   - **콘텐츠가 부족하면 폰트를 키워서 공간을 채운다** (빈 공간 방치 금지)

   **폰트 자동 확대 룰 (카드 그리드 내):**
   - 카드 본문이 **3줄 미만**이면 본문 폰트 +2pt 적용
   - 카드 본문이 **1줄**이면 본문 폰트 +4pt 적용
   - 단, **카드 그리드 내에서는 가장 긴 카드 기준으로 폰트를 결정하고 모든 카드에 동일하게 적용** (AP-06 준수)

2. **아이콘 확대 배치**: 카드 좌측이나 상단에 관련 아이콘을 48~64px로 크게 배치

3. **배경 이미지 + 오버레이 기법** (적극 권장):
   ```
   [배경 이미지 전체 깔기]        <- 카드 영역 전체에 관련 이미지
     [그라데이션 오버레이]         <- 반투명 도형 (좌->우 또는 하->상)
      opacity: 0.7~0.85             투명->불투명 그라데이션
      텍스트 (불투명 영역)         <- 텍스트는 오버레이의 불투명 부분에
   ```
   - 이미지가 필요한 부분에는 **`[IMAGE: 설명]`** 플레이스홀더를 코드 주석으로 표시

4. **장식 요소 추가**: 구분선, 컬러 바, 배경 도형 등으로 시각적 밀도 확보

---

## Insight Box 정책 (적재적소 원칙 -- 모든 페이지 강제 배치 금지)

> 이전에는 모든 본문 페이지 하단에 Insight Box를 의무 배치했지만, 이제는 **강조가 필요한 페이지에만 적재적소로 사용**한다.

**Insight Box를 사용해야 하는 페이지 유형:**
- 우리의 핵심 제안 / 솔루션 선언 페이지
- 우리의 역량/강점/차별점 페이지
- 핵심 경험/실적/레퍼런스 페이지
- 수치 KPI 강조 페이지의 결론
- 챕터의 마지막 페이지(챕터 요약)

**Insight Box를 사용하면 안 되는 페이지:**
- 단순 정보 나열 페이지 (목차, 회사 소개, 일정 등)
- 강조 페이지(이미 다크 배경/대형 타이포로 충분히 강조됨)
- 같은 챕터에서 이미 insight box가 등장한 페이지 (한 챕터 내 1~2개 제한)

**Insight Box 규격 (사용 시):**
```javascript
const INSIGHT_Y = CB_Y + CB_H - insightH;  // Content Box 하단에 배치
const INSIGHT_H = 0.60;  // 최소 높이 0.60"
const INSIGHT_FONT = 14; // 최소 14pt -- 핵심 결론이면 16pt까지 허용
```

**Insight Box 색상 규칙 (필수):**
- **Fill**: DOM (브랜드 주색상) -- DK(다크) 배경 사용 금지
- **Text**: W (흰색), 14pt FN_XB -- ACC(액센트) 텍스트 사용 금지
- 예: `{ fill: { color: DOM }, line: { type: 'none' } }` + `{ color: W, fontSize: 14, fontFace: FN_XB }`

**Insight Box 규칙:**
1. **최소 높이 0.60"**: 폰트가 커진 만큼 박스 높이도 격상
2. **최소 폰트 14pt** (핵심 결론이면 16pt): 강조 역할이므로 본문보다 확실히 크게
3. **겹침 방지 필수**: 위의 카드/콘텐츠와 최소 0.15" 간격 확보
4. **Content Box 경계 내 배치**: insight box 하단이 y=7.68"을 넘지 않도록
5. **한 챕터 내 1~2개 제한**: 너무 자주 등장하면 강조 효과 상실
6. **margin 배열 사용 금지**: `margin: [0, 24, 0, 24]`는 pptxgenjs 매핑 버그로 텍스트가 아래로 밀림. `margin: 0`과 `align: 'center'`를 사용 (AP-25 참조)

---

## pptxgenjs 꾸밈효과 적극 활용 가이드

**1. 그림자 (Shadow) -- 카드/블록에 적극 권장**

카드, 블록 등 콘텐츠 도형에 그림자를 적용하여 깊이감과 고급스러움을 부여한다.
- **카드/블록**: 표준 shadow 적용 (blur:6, offset:3, opacity:0.15)
- **히어로/강조 블록**: 강조 shadow 적용 (blur:10, offset:5, opacity:0.20)
- **미적용 대상**: accent bar, 구분선, 배경 도형, pill badge, 고스트 넘버 등 장식 요소
- 상세 규격은 `03_design_dna.md` 섹션 1 참조

```javascript
// 표준 shadow (카드, 블록)
shadow: { type: 'outer', blur: 6, offset: 3, angle: 270, color: '000000', opacity: 0.15 }
```

**2. 투명도 (Transparency)** -- 오버레이, 배경 도형에 적용:
```javascript
sl.addShape(pptx.shapes.RECTANGLE, {
  fill: { color: DOM, transparency: 25 },  // 75% 불투명
  x: 0, y: 0, w: '100%', h: '100%'
});
```

**3. 그라데이션 (Gradient Fill)** -- 배경, 오버레이, 카드에 적용:
```javascript
sl.addShape(pptx.shapes.RECTANGLE, {
  fill: {
    type: 'gradient',
    stops: [
      { position: 0, color: DOM, transparency: 0 },
      { position: 100, color: DOM, transparency: 80 }
    ],
    direction: 'right'  // 좌->우 그라데이션
  }
});
```

**4. 둥근 모서리 (Rounded Rectangle)** -- 카드에 적용:
```javascript
sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  rectRadius: 0.08,  // 표준 모서리 둥글기 (인치), hero 블록만 0.12 허용
  fill: { color: CD },
  line: { type: 'none' }  // 테두리 제거 필수
});
```

**5. 테두리 제거 필수 (line: { type: "none" })** -- 모든 도형에 적용:

> **필수 규칙**: 모든 addShape, addText 호출에 반드시 `line: { type: "none" }` 속성을 포함한다.

```javascript
// 올바른 사용법
sl.addShape(pptx.shapes.RECTANGLE, {
  fill: { color: DOM },
  line: { type: 'none' }   // 필수: 테두리 완전 제거
});
```

**경고**: `line: { width: 0 }` 는 사용 금지. width를 0으로 설정해도 **얇은 테두리가 렌더링**된다.
반드시 `line: { type: 'none' }` 만 사용할 것. 이를 위반하면 QA 위반(AP-line)으로 처리한다.

**6. 이미지/지도 플레이스홀더 표기 규칙**:

이미지가 들어가야 하는 위치에는 **시각적으로 명확한 플레이스홀더**를 배치하여 사용자가 교체할 수 있도록 한다.

**기본 플레이스홀더 패턴**:
```javascript
// 플레이스홀더 배경 (밝은 색 + 대시 없는 테두리)
sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x, y, w, h,
  fill: { color: palette.LT || 'EDF4F7' },
  line: { type: 'none' },
  rectRadius: 0.08,
});
// 아이콘 (이미지 아이콘 SVG가 있으면 사용, 없으면 텍스트)
sl.addText('Image Area', {
  x, y: y + h/2 - 0.15, w, h: 0.30,
  fontSize: 10, fontFace: FN_MD, color: palette.TG || '999999',
  align: 'center', valign: 'middle',
  wrap: false, margin: 0,
});
// 코드 주석으로 이미지 설명
// [IMAGE: 교통약자 이동 서비스 현장 사진]
```

**지도 플레이스홀더** (지역 데이터가 있는 페이지):
```javascript
// 지도는 사용자가 직접 삽입하는 것을 전제로, 큰 플레이스홀더 배치
sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x, y, w, h,
  fill: { color: palette.CD || 'F5F8FA' },
  line: { type: 'none' },
  rectRadius: 0.08,
});
sl.addText('Map Area\n(지도 이미지 삽입)', {
  x, y: y + h/2 - 0.30, w, h: 0.60,
  fontSize: 11, fontFace: FN_MD, color: palette.TG || '999999',
  align: 'center', valign: 'middle',
  wrap: true,
});
// [MAP: 서울시 자치구별 교통약자 분포 지도]
```

**규칙:**
1. 코드 주석으로 `// [IMAGE: 설명]` 또는 `// [MAP: 설명]` 형태로 표시 필수
2. 플레이스홀더 영역에는 LT 또는 CD 색상의 밝은 배경 도형 배치
3. 중앙에 "Image Area" 또는 "Map Area" 텍스트 (AP-14: 이모지 금지)
4. **빈 공간을 플레이스홀더로 채움**: 콘텐츠가 부족한 영역에 관련 이미지 플레이스홀더를 배치하여 Fill Rate 확보
5. **지역 데이터가 있는 페이지**에서는 지도 플레이스홀더를 적극 활용 (지도는 사용자가 삽입)

**빈 공간 대응 -- 폰트 확대와 플레이스홀더 병용**:
- 카드 내 텍스트가 공간 대비 작으면: 폰트 +2~4pt 확대 우선
- 카드/콘텐츠 옆에 빈 영역이 있으면: 관련 이미지 플레이스홀더 배치
- 두 방법을 병용하여 **Fill Rate 80% 이상** 달성

---

## 레이아웃 다양성 규칙 (Fill Rate 80% 달성의 핵심)

> Fill Rate 80%를 달성하려면 card_grid 하나로는 불가능하다. **6가지 레이아웃 패턴을 콘텐츠 유형에 맞게 선택**해야 한다.

### 레이아웃 패턴 선택 기준

| 콘텐츠 유형 | 1순위 레이아웃 | 2순위 | Fill Rate 기대치 |
|------------|-------------|-------|----------------|
| 동등 항목 나열 (서비스, 기능) | card_grid | comparison_columns | 80~85% |
| 비중/비율이 다른 항목 | **weighted_grid** | card_grid | **88~92%** |
| 프로세스/흐름 설명 | **flow_chain** + card/comparison | headline_band + card_grid | **82~88%** |
| 항목별 대응/대책 | **table_card** | card_grid | **85~90%** |
| 설명 + 지도/다이어그램 | **split_text_visual** | card_grid (좌) + placeholder (우) | **83~88%** |
| 차별점/강점 비교 | **comparison_columns** | card_grid | **78~85%** |
| 핵심 메시지 + 세부 항목 | **headline_band** + 하위 레이아웃 | banner_cards | **85~90%** |

### 콤포지트 레이아웃 (두 패턴 조합)

한 슬라이드에서 **상단/하단** 또는 **좌/우**로 두 패턴을 조합하면 Fill Rate를 극대화할 수 있다.

**자주 쓰는 조합:**
```
headline_band (상단 20~25%) + comparison_columns (하단 75~80%)  → p.9 스타일
headline_band (상단 20%) + flow_chain (중단 30%) + card_grid (하단 50%)
split_text_visual (좌 45%) + table_card (우 55%)                → p.41 스타일
weighted_grid (전체)                                             → p.13 스타일
```

**zone_helper 활용:**
```javascript
const { split } = require('../layouts/zone_helper');
const [top, bottom] = split.TB(0.25);        // 상 25% / 하 75%
headlineBand(sl, pptx, { zone: top, ... });
comparisonColumns(sl, pptx, { zone: bottom, ... });
```

### 슬라이드당 정보 단위 기준

| 기준 | 이전 | 개선 |
|------|------|------|
| 슬라이드당 정보 단위 | 3~4개 | **5~8개** |
| 텍스트 계층 깊이 | 2단계 (제목+본문) | **3~4단계** (라벨+제목+본문+불릿) |
| 시각 요소 종류 | 카드만 | **카드+플로우+테이블+비교+지도** |

> **정보 단위**: 독립적으로 의미를 전달하는 콘텐츠 블록 1개. 카드 1개, 플로우 노드 1개, 테이블 행 1개, 섹션 1개 등이 각각 1 정보 단위
