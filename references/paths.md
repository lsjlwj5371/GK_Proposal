# GK Proposal — 파일 경로 참조

## 가이드 파일 위치

프로젝트 루트: `C:/Users/akstn/OneDrive/바탕화~1-DESKTOP-G1P5I6M-334012/이우재/01. AX Project/02. 제안서 자동화`

| 파일 | 전체 경로 |
|------|----------|
| 생성프롬프트 가이드 | `★PPT 제작 가이드 파일/01. GK_생성프롬프트_가이드.md` |
| 제작시나리오 가이드 | `★PPT 제작 가이드 파일/02. GK_제작시나리오_가이드.md` |
| 마스터 템플릿 | `★PPT 제작 가이드 파일/03. GK_Master_v.0.1.pptx` |

## AI 모듈 위치

스킬 내 `scripts/` 디렉토리:
- `ai_brand_analyzer.js` — 브랜드 색상 분석
- `ai_copy_refiner.js` — 카피 정제
- `ai_visual_qa.js` — 시각 QA
- `ai_pipeline.js` — 통합 오케스트레이터

## 패키지 의존성

```bash
npm install pptxgenjs@4.0.1 sharp@0.34.5 @anthropic-ai/sdk adm-zip jszip
```
