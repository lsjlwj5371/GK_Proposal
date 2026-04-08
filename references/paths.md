# GK Proposal — 파일 구조 안내

## 스킬 디렉토리 구조

```
gk-proposal/
├── SKILL.md                              ← 메인 스킬 (파이프라인 워크플로우)
├── references/
│   ├── 01_생성프롬프트_가이드.md           ← STEP 1~4, 색상, 헤더 좌표, 코드 생성
│   ├── 02_제작시나리오_가이드.md           ← 43개 템플릿 설명, 조합 패턴
│   └── paths.md                          ← 이 파일
└── scripts/
    ├── ai_brand_analyzer.js              ← 브랜드 색상 분석 + 배경 생성
    ├── ai_copy_refiner.js                ← 카피 정제 (Claude API)
    ├── ai_visual_qa.js                   ← 시각 QA (Claude Vision)
    └── ai_pipeline.js                    ← 통합 오케스트레이터
```

## 패키지 의존성

```bash
npm install pptxgenjs@4.0.1 sharp@0.34.5 @anthropic-ai/sdk adm-zip jszip
```

## 환경변수

```
ANTHROPIC_API_KEY=sk-ant-...  (카피 정제 + 시각 QA에 필요)
```
