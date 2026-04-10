# GK_Proposal - 제안서 PPT 자동 생성 스킬

> **Status: :construction: 개발 중 (Work In Progress)**

그라운드케이(GroundK)의 제안서 PPT를 처음부터 끝까지 자동 생성하는 Claude Code 스킬입니다.
클라이언트 분석 자료를 입력하면, 브랜드 색상 추출 → 카피 정제 → pptxgenjs 코드 생성 → 시각 QA까지 자동으로 수행합니다.

---

## 프로젝트 설명

| 항목 | 내용 |
|------|------|
| **목적** | 제안서 PPT 제작 프로세스를 자동화하여 품질은 높이고 작업 시간은 줄이기 |
| **기술 스택** | Claude Code Skill, Node.js, pptxgenjs, Claude API (Vision + Text) |
| **슬라이드 규격** | A4 가로 (11.69 x 8.27 inches), Pretendard 폰트 |
| **디자인 시스템** | Adobe Color Harmony 기반 6:3:1 팔레트, 검증된 레이아웃 컴포넌트 5종 + Zone-based 멀티 컴포넌트 |
| **구조 다양성** | 카드/표/순서도/허브-스포크/벤/간트/타임라인/체크리스트 8종 혼용 (AP-22) |
| **안티패턴** | AP-01~22 실전 피드백 기반 (AI 생성물 티 제거 + 구조 다양성 강제) |

---

## 현재 상태

- [x] Phase 0: 자료 수집 / 인터뷰 프로세스
- [x] Phase 1: 브랜드 분석 (로고 색상 추출, 팔레트 생성, 배경 이미지)
- [x] Phase 2: 콘텐츠 구조화 (논리 설계 → 템플릿 매핑)
- [x] Phase 3: PPT 코드 생성 (pptxgenjs)
- [x] Phase 3.5: 자체 검수 (코드 레벨 QA)
- [x] Phase 4: 시각 QA (Claude Vision 기반)
- [x] 레이아웃 컴포넌트 5종 (표지, 간지, 카드 그리드, 강조 본문, 마무리)
- [x] **Zone-based 멀티 컴포넌트 레이아웃** (`patterns/layouts/zone_helper.js` — split.LR/TB/TMB/grid2x2/mainAside)
- [x] 아이콘 시스템 (606개 Lineicons SVG)
- [x] **안티패턴 가이드라인 (AP-01~22)** — 실전 피드백 기반 지속 확장
- [x] **구조 다양성 규칙** (AP-22): 8가지 시각 구조 체크리스트, LR 40%+ 강제
- [ ] 실전 테스트 및 피드백 반영 반복 중

---

## 사용법

Claude Code에서 아래와 같이 호출합니다:

```
/gk-proposal [제안서 주제]
```

**예시:**
```
/gk-proposal 제네시스 전용 셔틀 운영 제안서 만들어줘
/gk-proposal KeSPA 이스포츠 대회 수송 제안서
```

이후 대화형으로 자료 수집 → 색상 확인 → 구조 확인 → PPT 생성까지 진행됩니다.

---

## 파이프라인 흐름

```
사용자 요청
    |
    v
Phase 0: 자료 수집 / 인터뷰
    |  사업명, 발주처, 배경, 제안 내용, 실적 등 수집
    v
Phase 1: 브랜드 분석
    |  로고 색상 추출 → 6:3:1 팔레트 생성 → 배경 이미지 생성
    v
Phase 2: 콘텐츠 구조화
    |  스토리라인 설계 → 페이지별 콘텐츠 깊이 검증 → 템플릿 매핑
    v
Phase 3: PPT 코드 생성
    |  pptxgenjs로 슬라이드 코드 작성 → .pptx 파일 출력
    v
Phase 3.5: 자체 검수 (필수)
    |  겹침/정렬, 색상 대비, 안티패턴, 폰트, 콘텐츠 밀도 등 10개 항목 검수
    v
Phase 4: 시각 QA (권장)
    |  PPT → 이미지 변환 → Claude Vision으로 슬라이드별 품질 분석
    v
최종 .pptx 파일 전달
```

---

## 환경 설정

### 필수

| 항목 | 설정 방법 |
|------|----------|
| **Node.js** | v18 이상 |
| **패키지 설치** | `npm install pptxgenjs sharp @anthropic-ai/sdk adm-zip jszip` |
| **Pretendard 폰트** | [다운로드](https://cactus.tistory.com/306) 후 시스템에 설치 |

### 선택

| 항목 | 설정 방법 | 용도 |
|------|----------|------|
| **ANTHROPIC_API_KEY** | 환경변수로 설정 | 카피 정제 / 시각 QA (미설정 시 수동 진행) |
| **LibreOffice** | 시스템에 설치 | 시각 QA의 PPTX → 이미지 변환 |

---

## 프로젝트 구조

```
gk-proposal/
├── SKILL.md                    # 스킬 정의 (메인 가이드라인)
├── references/
│   ├── 01_생성프롬프트_가이드.md  # 색상 시스템, 헤더 좌표, 코드 생성 가이드
│   └── 02_제작시나리오_가이드.md  # 43개 템플릿, 조합 패턴, 품질 체크리스트
├── patterns/
│   ├── pattern_index.json      # 콘텐츠 유형 → 추천 패턴 매핑
│   ├── layouts/
│   │   └── zone_helper.js      # Zone-based 분할 (split.LR/TB/TMB/grid2x2/mainAside + sub.cols/rows)
│   └── components/
│       ├── cover.js            # 표지 (미니멀 / 시네마틱)
│       ├── divider.js          # 간지 (센터 / 사이드바 / 이미지분할 / 브랜드그래픽)
│       ├── card_grid.js        # 카드 그리드 (기본 / 다크 / KPI / 이미지오버레이)
│       ├── highlight_body.js   # 강조 본문 (다크키워드 / 이미지오버레이 / 스플릿임팩트)
│       └── ending.js           # 마무리 (미니멀 / 시네마틱 / 브랜드컬러)
├── scripts/
│   ├── ai_brand_analyzer.js    # 로고 색상 추출, 팔레트 생성
│   ├── ai_copy_refiner.js      # Claude API 카피 정제
│   ├── ai_visual_qa.js         # Claude Vision 시각 QA
│   ├── ai_pipeline.js          # 통합 오케스트레이터
│   └── icon_helper.js          # SVG 아이콘 유틸리티
├── assets/icons/
│   ├── svgs/                   # 606개 Lineicons SVG
│   └── icon_manifest.json      # 한/영 키워드 매핑
└── Sample/Good Example/        # 우수 PPT 레퍼런스 이미지
```

---

## 담당

- **소속**: 그라운드케이 (GroundK)
- **문의**: 내부 Slack 채널 참고
