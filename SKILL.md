---
name: GK_Proposal
description: "GroundK(그라운드케이) 제안서 PPT 자동 생성 스킬. /gk-proposal 명령으로 호출하면 클라이언트 자료 수집부터 브랜드 분석, 카피 정제, PPT 코드 생성, 시각 QA까지 전체 파이프라인을 실행합니다. 사용자가 제안서, 프레젠테이션, PPT, 발표자료 생성을 요청하거나 '그라운드케이', 'GK', '제안서 자동화' 등을 언급할 때 반드시 이 스킬을 사용하세요."
---

# GK_Proposal -- 제안서 PPT 자동 생성 파이프라인

그라운드케이(GroundK)의 제안서 PPT를 처음부터 끝까지 자동 생성하는 스킬입니다.
사용자의 클라이언트 분석 자료를 받아 구조화하고, AI로 브랜드 색상 추출 -> 카피 정제 -> pptxgenjs 코드 생성 -> 시각 QA까지 수행합니다.

## 핵심 원칙

1. **콘텐츠 우선 원칙**: 템플릿보다 논리 구조를 먼저 설계한다
2. **가이드 기반 정밀 매칭**: 표지/간지/마무리는 가이드에 정의된 실측 좌표를 정확히 따른다
3. **대화형 진행**: 정보가 부족하면 사용자에게 물어보고, 단계별 확인을 받으며 진행한다
4. **4분류 체계**: 모든 페이지는 표지/간지/본문-기본/본문-강조/마무리로 분류한다
5. **생성 후 자체 검수 필수**: PPT 생성 후 반드시 코드 레벨에서 전 슬라이드를 검수하고, 문제를 수정한 뒤에 최종 결과물을 사용자에게 전달한다

## 필수 참조 파일

이 스킬에 포함된 가이드 파일입니다. 각 단계에서 필요한 파일을 Read로 로드하세요.
경로는 이 스킬의 base directory 기준 상대 경로입니다.

| 파일 | 경로 | 용도 | 언제 읽는가 |
|------|------|------|-----------|
| **생성프롬프트 가이드** | `references/01_생성프롬프트_가이드.md` | STEP 1~4 워크플로우, 색상 시스템, 헤더 좌표, 코드 생성 가이드 | Phase 3 시작 전 |
| **제작시나리오 가이드** | `references/02_제작시나리오_가이드.md` | 43개 템플릿 설명, 조합 패턴, 품질 체크리스트 | Phase 2 템플릿 매핑 시 |
| **디자인 DNA** | `references/03_design_dna.md` | 플랫 디자인 원칙, 고스트 넘버, 필 뱃지, DNA 색상 상수, 도형 규격 | Phase 3 코드 작성 시 |
| **컴포넌트 카탈로그** | `references/05_component_catalog.md` | 마스터 PPT 기반 37개 컴포넌트 ID, 변형 규칙, 색상 치환 | Phase 3 코드 작성 시 |
| **패턴 인덱스** | `patterns/pattern_index.json` | 콘텐츠 유형 -> 추천 패턴 매핑, 분위기별 패턴 선택 | Phase 2 레이아웃 선택 시 |

> **가이드 파일에 디자인 규격(좌표, 폰트, 색상 등)이 포함되어 있습니다.** 추가로, 마스터 컴포넌트 PPT(`assets/component_master.pptx`)에서 파서로 추출한 정확한 디자인 수치가 `assets/component_catalog.json`에 저장되어 있습니다.

## 코드 패턴 라이브러리 (검증된 레이아웃 컴포넌트)

실제 우수 PPT 레퍼런스 18장을 분석하여 추출한 **파라미터화된 적응형 컴포넌트**입니다.

### 컴포넌트 목록

| 컴포넌트 | 경로 | 변형 | 용도 |
|---------|------|------|------|
| **표지** | `patterns/components/cover.js` | A(풀블리드+그라데이션), B(좌우분할) | 표지 페이지 -- bgImage 필수 권장 |
| **간지** | `patterns/components/divider.js` | A(센터), B(사이드바), C(이미지분할), D(브랜드그래픽) | 챕터 구분 |
| **카드 그리드** | `patterns/components/card_grid.js` | default, dark, kpi, image-overlay | 본문 균등 카드 레이아웃 (AP-21: 평면+그림자, accent bar 금지) |
| **강조 본문** | `patterns/components/highlight_body.js` | dark-keywords, image-overlay-message, split-impact | 클라이맥스 -- addHeader OOXML 버그, 수동 구현 필수 |
| **마무리** | `patterns/components/ending.js` | A(미니멀), B(시네마틱), C(브랜드컬러) | 감사/다짐 페이지 |

### 레이아웃 패턴 (Fill Rate 80% 달성용 -- 콘텐츠 유형별 선택)

| 레이아웃 | 경로 | 용도 | Fill Rate |
|---------|------|------|-----------|
| **비대칭 그리드** | `patterns/layouts/weighted_grid.js` | 비중별 크기가 다른 카드 배치 (과업분석, 예산배분) | 88~92% |
| **프로세스 흐름** | `patterns/layouts/flow_chain.js` | 원형/캡슐 노드 + 화살표 (프로세스, 서비스 체인) | 단독 30%, 조합 82~88% |
| **테이블 카드** | `patterns/layouts/table_card.js` | 좌측 라벨 + 우측 텍스트 행 (보안대책, 항목별 대응) | 85~90% |
| **텍스트+비주얼** | `patterns/layouts/split_text_visual.js` | 텍스트 섹션 + 지도/다이어그램 분할 | 83~88% |
| **비교 컬럼** | `patterns/layouts/comparison_columns.js` | 구분선 기반 비교/차별점 표시 | 78~85% |
| **헤드라인 밴드** | `patterns/layouts/headline_band.js` | 상단 메시지 밴드 + 하단 서브 레이아웃 조합 | 85~90% |

> **Fill Rate 80% 달성 핵심**: card_grid 하나만으로는 65% 수준. 콘텐츠 유형에 맞는 레이아웃 패턴을 선택하고, headline_band + flow_chain 같은 조합을 적극 활용해야 80%+ 달성 가능.

### 패턴 선택 흐름

```
Phase 2에서 콘텐츠 구조화 완료
    |
pattern_index.json의 moodMapping에서 제안서 분위기에 맞는 패턴 세트 선택
    |
각 페이지의 콘텐츠 유형에 따라 contentRecommendations 참조
    |
선택된 컴포넌트를 require()로 로드하여 사용
    |
컴포넌트가 카드 수, 텍스트 양에 따라 자동 적응
```

### 사용 예시

```javascript
const cardGrid = require('./patterns/components/card_grid');
const createDivider = require('./patterns/components/divider');
const createCover = require('./patterns/components/cover');

// 표지 A (풀블리드 — 배경 이미지 + DOM 그라데이션 오버레이)
createCover(sl, pptx, {
  type: 'A', title: '제안서 제목', companyName: '(주)그라운드케이',
  palette, label: 'VIP Protocol', bgImage: '/path/to/cover.jpg'
});

// 표지 B (좌우 분할 — 좌측 텍스트 45% + 우측 이미지 55%)
createCover(sl, pptx, {
  type: 'B', title: '제안서 제목', companyName: '(주)그라운드케이',
  palette, label: 'Premium Service', bgImage: '/path/to/cover.jpg'
});

// 간지 (사이드바 타입 + 하위 목차)
createDivider(sl, pptx, {
  type: 'B', chapterNum: '01', chapterTitle: '제안 개요',
  subItems: ['사업 배경', '제안 범위', '추진 방향'], palette
});

// 카드 그리드 (KPI 스타일)
cardGrid(sl, pptx, {
  style: 'kpi', palette,
  cards: [
    { number: '35%', title: 'GRP 수익 전환', body: '상금 체계 -> 글로벌 수익 풀 도입' },
    { number: '2M+', title: '팬 도달 규모', body: '디지털 플랫폼 기반 글로벌 팬덤' },
  ]
});
```

> **핵심 원칙**: 패턴의 "뼈대"(그리드, 비율)는 콘텐츠에 따라 유동적으로 변하고, "피부"(그림자, 둥근 모서리, 색상, 오버레이)만 레퍼런스에서 검증된 것을 고정 적용한다.

### 컴포넌트 AP 준수 현황 (v2 리팩토링 완료)

모든 컴포넌트가 AP-01~AP-33을 준수하도록 리팩토링되었습니다. **5개 컴포넌트 모두 사용 가능합니다.**

| 컴포넌트 | v2 변경사항 |
|---------|-----------|
| **cover.js** | v3: A(풀블리드+그라데이션), B(좌우분할)로 전면 교체. 장식 도형 제거, bgImage 중심 설계. 이미지 없을 시 DOM 솔리드 폴백 |
| **divider.js** | `charSpacing` 제거(AP-12), `line:{type:'none'}`, `wrap:false`, subText 파라미터 추가 |
| **card_grid.js** | 모든 accent bar 제거(AP-21 전면 금지) -> 평면+그림자만, 이모지 제거(AP-14), `sdw()` 팩토리, ghostNum 지원 |
| **highlight_body.js** | addHeader 제거 -> 수동 헤더 렌더링, API 변경(badges/pillars), `line:{type:'none'}`. v3: 배지 fill을 DK로 변경(AP-28), 배지-인사이트 겹침 해소(AP-29) |
| **ending.js** | 히어로=약속카피/서브=감사합니다 올바른 순서, `charSpacing` 제거, promiseText 필수 |

**pptxgenjs 자체 버그 (컴포넌트에서 이미 우회 처리됨):**

| 버그 | 우회 방법 |
|------|---------|
| shadow 객체 내부 mutate (AP-24) | **`sdw()` 팩토리 함수로 매번 새 객체 생성** |
| `margin: [t,r,b,l]` 배열 매핑 오류 (AP-25) | **`margin: 0` 또는 단일 숫자만 사용** |
| phantom slideMaster 엔트리 (AP-26) | AP-24 준수 시 실질 영향 없음 |
| addText 기본값 wrap="square" 강제 줄바꿈 (AP-27) | **`wrap: false, margin: 0`** 단일줄 텍스트에 필수 적용 |

## 아이콘 시스템 (Lineicons SVG)

606개 Lineicons SVG 아이콘이 `assets/icons/svgs/`에 포함되어 있습니다.

| 파일 | 경로 | 역할 |
|------|------|------|
| **SVG 아이콘** | `assets/icons/svgs/*.svg` | 606개 Lineicons (MIT 라이선스) |
| **아이콘 매니페스트** | `assets/icons/icon_manifest.json` | 한/영 키워드 매핑, 카테고리, 용도 설명 |
| **아이콘 헬퍼** | `scripts/icon_helper.js` | SVG 로드, 색상 변환, PNG 변환 유틸리티 |

```javascript
const { findIcons, iconToBase64PNG } = require('./scripts/icon_helper');
const matches = findIcons('전략', { limit: 3 });
const iconData = await iconToBase64PNG('rocket-5.svg', { color: '#FFFFFF', size: 64 });
sl.addImage({ data: iconData, x: 1.0, y: 2.0, w: 0.5, h: 0.5 });
```

## AI 모듈 스크립트

| 스크립트 | 역할 |
|---------|------|
| `scripts/ai_brand_analyzer.js` | 로고에서 색상 추출, 팔레트 생성, 배경 생성 |
| `scripts/ai_copy_refiner.js` | Claude API로 카피 정제 + 일관성 검증 |
| `scripts/ai_visual_qa.js` | PPT를 이미지로 변환 후 품질 분석 |
| `scripts/ai_pipeline.js` | 위 3개 모듈의 통합 오케스트레이터 |
| `scripts/icon_helper.js` | SVG 아이콘 검색, 색상 변환, PNG 변환 |

> **환경 요구사항**: `ANTHROPIC_API_KEY` 환경변수 필요. 패키지: pptxgenjs, sharp, @anthropic-ai/sdk, adm-zip

---

## 전체 파이프라인 (5 Phase)

```
사용자 요청 -> Phase 0: 자료 수집/인터뷰
                |
           Phase 1: 브랜드 분석 (색상 + 배경)
                |
           Phase 2: 콘텐츠 구조화 (논리설계 -> 템플릿 매핑)
                |
           Phase 3: PPT 코드 생성 (pptxgenjs)
                |
           Phase 3.5: 자체 검수 (겹침/정렬/색상대비/분류차별화/폰트) <- 필수
                |     문제 발견 시 수정 후 재생성
           Phase 4: 시각 QA (필수 -- PowerPoint COM + Claude 직접 vision 분석)
                |
           최종 .pptx 파일 전달
```

---

## Phase별 상세 가이드 (분리 파일)

> **중요**: 각 Phase에 진입할 때 반드시 해당 파일을 Read 도구로 로드하세요.
> 대화가 길어져 컨텍스트가 압축되더라도 각 Phase 파일이 독립적으로 생존합니다.

### Phase 0: 자료 수집
**-> Read: `phases/phase0_data_collection.md`**
- 필수 수집 항목 8가지, 자료 부족 시 A/B/C 등급 처리, 인터뷰 방식

### Phase 1: 브랜드 분석
**-> Read: `phases/phase1_brand_analysis.md`**
- 로고 추출, 색상 조화 규칙, CI 교차 검증 (필수), 팔레트 확인

### Phase 2: 콘텐츠 구조화
**-> Read: `phases/phase2_content_structure.md`**
- 콘텐츠 깊이 검증, 4분류 매핑, 간지 통일성, 강조 페이지 다양성, 카피 정제

### Phase 3: PPT 코드 생성
**-> Read: `phases/phase3_code_generation.md`** (좌표, Content Box, 폰트 규격)
**-> Read: `phases/phase3_anti_patterns.md`** (AP-01~AP-33 -- 반드시 읽을 것!)
**-> Read: `phases/phase3_fill_rate.md`** (여백 기준, 카드 밀도, pptxgenjs 효과)

### Phase 3.5: 자체 검수
**-> Read: `phases/phase35_self_review.md`**
- 12항목 체크리스트 (겹침, 색상, 폰트, AP-01~22, 여백, 간지 통일성 등)

### Phase 4: 시각 QA
**-> Read: `phases/phase4_visual_qa.md`**
- PowerPoint COM -> PNG 변환, 6축 vision 분석, 자동 수정 트리거

---

## 환경 설정

| 항목 | 설정 방법 |
|------|----------|
| **ANTHROPIC_API_KEY** | 환경변수로 설정. 미설정 시 카피 정제/시각 QA 단계를 스킵하고 수동 진행 |
| **Node.js 패키지** | 작업 디렉토리에서 `npm install pptxgenjs sharp @anthropic-ai/sdk adm-zip jszip` |
| **Pretendard 폰트** | 시스템에 설치 필요. 미설치 시 Arial로 대체 |
| **LibreOffice** (선택) | 시각 QA의 PPTX->이미지 변환에 필요. 없으면 PowerPoint COM 사용 |

## 참고

- 이 스킬은 `그라운드케이(GroundK)` 전용입니다
- 모든 디자인 규격(좌표, 폰트, 색상 시스템)은 `references/` 내 가이드 파일에 정의되어 있습니다
- 템플릿 상세 설명은 `references/02_제작시나리오_가이드.md`의 S01~S43 섹션을 참조하세요
- 색상 시스템 상세는 `references/01_생성프롬프트_가이드.md`의 섹션 5를 참조하세요
