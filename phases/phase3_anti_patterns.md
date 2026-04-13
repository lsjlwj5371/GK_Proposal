# Phase 3: 안티패턴 -- 절대 하지 말 것 (AP-01 ~ AP-22)

> **이 파일은 PPT 코드 생성(Phase 3) 전에 반드시 Read해야 합니다.**
> 이 규칙들을 무시하면 제안서 품질이 심각하게 저하됩니다.

---

## [AP-01] 밝은 배경 위 어두운 대면적 요소 금지 -- 정량 기준 25%

본문 페이지(흰색 배경)에서 카드/블록을 어두운 색(DOM, DK 등)으로 채우면 시각적 무게감이 과도해진다. 핵심은 **대비의 방향**: 어두운 배경+밝은 카드는 OK, 밝은 배경+어두운 카드는 NG.

> **정량 기준**: 본문 페이지(밝은 배경) 콘텐츠 영역(Content Box, 62.82 in2) 내에서 **단일 다크 블록(DOM/DK 색상)의 면적이 25%(약 15.7 in2)를 초과하면 위반**.

| 조합 | 판정 | 이유 |
|------|------|------|
| 어두운 배경 + 밝은 카드 | OK | 다크가 프레임 역할, 밝은 카드가 떠보이는 느낌 |
| 밝은 배경 + 어두운 카드(25% 초과) | NG | 흰 페이지 위에 어두운 덩어리가 무겁게 내려앉음 |
| 밝은 배경 + 어두운 카드(25% 이하, 균형 OK) | 그레이존 | 좌우 비대칭/상하 무게감 검토 필수 |
| 밝은 배경 + 밝은 카드 | OK (기본) | 그림자/보더로 카드 구분. 가장 안정적 |

**위반 시 대응**:
1. 콘텐츠 영역 전체 배경을 다크로 전환 -> "어두운 배경 + 밝은 카드" 구조로 재구성
2. 다크 블록을 ACC 컬러 라인 + 밝은 카드 + 그림자로 대체
3. 다크 블록 면적을 25% 이하로 축소하고 좌우 균형 재조정

```
(X) 나쁜 예: card-grid의 'dark' 스타일을 흰 배경 본문에서 사용
  -> 콘텐츠 영역 전체가 남색/검정으로 가득 차 밸런스 붕괴

(O) 좋은 대안:
  1. 밝은 카드(CD, LT, WHITE) + 그림자 + 액센트 바로 구분
  2. 카드에 이미지 배경 + 좌->우 그라데이션 오버레이
  3. 배너(상단 40% 다크) + 하단 밝은 카드 (bannerCards 패턴)
```

---

## [AP-02] 하드 컬러 분할(hard split) 금지

슬라이드 상반부 흰색 + 하반부 검은색 -> 페이지가 둘로 잘려 보이는 느낌.

```
(X) 나쁜 예: 상단 50% 흰색 + 하단 50% 순수 검정 -> 페이지가 잘림
(O) 좋은 대안:
  1. 하단 블록에 transparency: 10~20 적용하여 부드럽게
  2. 분할 비율을 70:30으로 (다크 영역 축소)
  3. 분할선에 그라데이션 전환 또는 ACC 색상 라인
  4. 하단에 이미지 배경 + 반투명 오버레이 사용
```

---

## [AP-03] 빈 장식 도형 금지

원형(OVAL), 사각형 등 장식 도형을 배치할 때, 내부가 비어있으면 **미완성 슬라이드**로 보인다.

```
(X) 나쁜 예: 원형 도형만 덩그러니 놓여 있고, 내부에 아이콘/텍스트 없음
(O) 반드시 내부에 다음 중 하나를 포함:
  - SVG 아이콘 (icon_helper.js로 변환)
  - 번호/숫자 텍스트
  - 의미 있는 라벨 텍스트
  - 이미지
  -> icon이 없으면 label의 첫 글자를 크게 넣는 등 폴백 처리 필수
```

---

## [AP-04] 배너/히어로 영역 텍스트만 배치 금지

배너(banner) 또는 히어로 영역에 텍스트만 넣으면 상단이 비어 보인다.

```
(X) 나쁜 예: 다크 배너 영역에 숫자+설명 텍스트만 존재
(O) 반드시 아이콘, 장식 도형, 이미지 플레이스홀더 중 하나 이상 함께 배치
```

---

## [AP-05] 텍스트박스 오버플로우 / 강제 줄바꿈 금지

텍스트박스의 width/height가 콘텐츠 길이를 수용하지 못해 텍스트가 도형 밖으로 빠져나가거나, 의도치 않은 위치에서 줄바꿈이 발생하는 경우.

| 증상 | 예시 |
|------|------|
| 라벨 도형 안 텍스트가 2줄로 줄바꿈 | "임직원 통근 셔틀 제안서" 가 표지 라벨 도형에서 한 줄 -> 두 줄 |
| 챕터 라벨이 슬라이드 좌측 경계 밖으로 빠져나감 | "CHAPTER" 텍스트박스 x좌표 음수 |
| 카드 본문이 카드 box 밖으로 흘러나감 | 텍스트박스 height 부족 |
| 히어로 타이포가 텍스트박스 width 부족으로 세로 1자씩 배치 | 마무리 페이지에서 빈번 |

**필수 조치**:
1. **라벨/히어로 도형은 width를 텍스트 길이에 맞춰 가변 처리**: 도형 width = 글자수 x 폰트사이즈(pt) / 72 x 0.6 (한글 기준 보정) + 패딩 0.3"
2. **autoFit/shrinkText 적용**: pptxgenjs `addText`의 `fit: 'shrink'` 또는 `autoFit: true` 옵션 사용
3. **마무리 히어로**: 텍스트박스 width를 슬라이드 width의 60% 이상으로 확보 (최소 7") -- 절대 1~2"로 좁게 배치 금지
4. **검증**: 자체 검수에서 글자수 x 폰트사이즈로 텍스트 점유 폭을 계산해 textbox width를 초과하지 않는지 확인

---

## [AP-06] 카드 그룹 내 폰트 크기 불일치 금지

같은 그리드(2x2, 3x1 등)에 속한 카드들은 콘텐츠 길이가 달라도 헤드라인/본문 폰트 크기가 **모두 동일**해야 한다.

```
(X) 나쁜 예: 카드 1=14pt, 카드 2=12pt, 카드 3=11pt (콘텐츠 길이에 따라 임의 조정)
(O) 원칙: 그리드 내 가장 긴 카드의 콘텐츠 기준으로 폰트를 결정하고, 모든 카드에 동일하게 적용
```

---

## [AP-07] 카드 그룹 내 좌측 정렬 불일치 금지

그리드 내 카드의 헤드라인, 구분선, 본문 텍스트는 **모두 동일한 좌측 시작 x좌표**를 가져야 한다.

```
(X) 나쁜 예: 카드 1 헤드라인 x=0.65, 구분선 x=0.70, 본문 x=0.65 (3개가 어긋남)
(O) 원칙: 모든 카드 내부 요소는 카드 좌측 + 패딩(예: 0.20") 으로 통일된 x좌표 사용
```

---

## [AP-08] ACC 도형 line(테두리) 정책 통일

ACC(액센트) 색상으로 채워진 도형은 한 제안서 내에서 line 속성이 통일되어야 한다.

```
(X) 나쁜 예: S6의 ACC 원형은 테두리 있음, S5의 ACC 원형은 테두리 없음
(O) 원칙: ACC 색상 도형의 line 속성을 컴포넌트 단위로 한 곳에서 정의하고 동일 사용
   기본값: line: { type: 'none' } -- 테두리 없이 fill만 사용
```

---

## [AP-09] 배경 PNG 파일 무결성 -- 진짜 PNG 바이너리만

`ai_brand_analyzer.generateGradientBg()` 등으로 생성한 배경 이미지 파일은 **반드시 디코딩된 PNG 바이너리**여야 한다.

```javascript
// (X) 나쁜 예 (데이터 URI를 텍스트로 저장)
fs.writeFileSync('bg_cover.png', `data:image/png;base64,${b64}`);

// (O) 좋은 예
fs.writeFileSync('bg_cover.png', Buffer.from(b64, 'base64'));
```

본문 PPT 코드에서 배경을 임베드할 때:
```javascript
function pngToDataURI(p) {
  const b64 = fs.readFileSync(p).toString('base64');
  return `image/png;base64,${b64}`;  // 'data:' 접두어 없이 -- pptxgenjs 4.x 표준
}
```

---

## [AP-10] KPI 카드 다크 스타일 본문 사용 금지

`cardGrid({ style: 'kpi' })`는 카드 전체를 다크(DOM/DK) 색으로 채우는 변형이다. 본문 페이지(밝은 배경)에서 사용하면 헤더 톤과 정면충돌 (AP-01의 변형).

```
(X) 나쁜 예: 본문 헤더(검정 텍스트) 밑에 cardGrid({ style: 'kpi' }) -> 다크 카드 4장
(O) 좋은 대안: 라이트 카드(palette.CD) + 큰 ACC 숫자 + DOM 타이틀로 직접 그리기 (addLightKpiCards 패턴)
```

**라이트 KPI 카드 표준 좌표** (Content Box 4-카드 가로 그리드):
- 카드 fill: `palette.CD`, 그림자, rounded
- 상단 0.08" ACC 액센트 바
- 큰 숫자: ACC, 글자수 따라 자동 축소 (<=3자: 48pt, 4자: 40pt, 5자+: 34pt)
- 구분선: DOM, 0.04"
- 타이틀: DOM, 15pt ExtraBold
- 본문: gray 4A5568, 11pt Medium

---

## [AP-11] 표지/마무리/간지 컴포넌트 내 placeholder 도형 금지

cover.js, ending.js 등 컴포넌트가 자체적으로 그리는 dashed rect나 "Image Placeholder" 텍스트는 실제 PPT에서 그대로 보이는 잔재물이다. 컴포넌트 코드에서 **반드시 제거**한다.

검증 방법: 컴포넌트 .js 파일에서 `placeholder`, `Image Placeholder`, `dashLg`, `dashed` 키워드 검색 -> 발견 시 삭제.

---

## [AP-12] 한글 텍스트에 charSpacing/wide-spacing 효과 금지

`charSpacing: 200~400`, 또는 `text.split('').join(' ')` 같은 wide-letter-spacing 효과는 영문에선 멋있지만 한글에선 글자가 1자씩 끊어지거나 세로로 쌓이는 렌더링 사고를 일으킨다.

```javascript
// (O) 한글 감지 헬퍼
function _hasKorean(text) {
  return /[\u3130-\u318F\uAC00-\uD7AF]/.test(text || "");
}
function _wideSpace(text) {
  if (!text) return "";
  if (_hasKorean(text)) return text;  // 한글이면 효과 없이 통과
  return text.split("").join(" ");
}
```

**charSpacing 정책**: 한글 텍스트박스에는 `charSpacing` 옵션을 **아예 넣지 않는다**.

---

## [AP-13] 카드 그리드 가로 5장 이상 금지 (max 4)

본문 페이지의 가로 카드 그리드는 최대 4장까지. 5장 이상이면 카드 폭이 좁아져(< 2.0") 텍스트가 잘린다.

```
(X) 나쁜 예: 5개 프로젝트를 한 줄에 가로 배치 (각 카드 폭 약 1.85")
(O) 좋은 대안:
  1. 4장으로 줄이고 가장 약한 항목 제거
  2. 2 x 3 그리드(6장)로 재배치
  3. 별도 페이지로 분할
```

**카드 폭 최소값**: 2.20" 이상. 한글 본문 11pt x 약 14자가 한 줄에 들어가는 최소치.

---

## [AP-14] 이모지(emoji) 사용 금지

이모지는 PowerPoint 폰트 환경에 따라 렌더링이 일관되지 않고, 제안서의 프로페셔널한 톤을 해친다.

```
(X) 나쁜 예: { stage: 'STEP 01', icon: '📱', title: '간편 예약' }
(O) 좋은 대안:
  1. SVG 아이콘 (icon_helper.js로 변환) -- 권장
  2. 큰 STEP 번호 텍스트 (예: '01', 88pt ACC) -- 가장 안전
  3. 도형 + 텍스트 결합 (원 안에 숫자)
```

**자동 검증**: generate_ppt.js 작성 후 정규식 `[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]` 로 이모지 자동 검출 -> 발견 시 즉시 교체.

---

## [AP-15] 시스템 `bold: true` 사용 절대 금지

pptxgenjs의 `bold: true` 옵션은 PowerPoint가 폰트 위에 페이크 볼드를 덧씌우는 방식이다. Pretendard 같은 가변 웨이트 한글 폰트에서는 자형이 뭉개진다. **굵기는 반드시 ExtraBold 폰트 자체(`fontFace: 'Pretendard ExtraBold'`)로만 표현한다.**

```
(X) 나쁜 예: { fontSize: 18, fontFace: 'Pretendard', bold: true }
(O) 좋은 예: { fontSize: 18, fontFace: 'Pretendard ExtraBold' }
```

**자동 검증**: `grep -rn "bold:\s*true" generate_ppt.js patterns/components/*.js` -> 0건이어야 한다.

---

## [AP-16] Content Box 수직 점유율 >= 85% -- 한 페이지 한 패턴(1:1) 금지

한 슬라이드에 컴포넌트 1개만 배치하면(예: cardGrid만, timeline만) 상/하 여백이 과다해진다. 본문 페이지는 **Content Box(5.91" H) 수직 점유율 85% 이상**을 유지해야 하며, **최소 2종 이상의 시각 구성요소**(KPI strip + 카드 + insight 등)를 배치한다.

```javascript
// (O) 권장 조합 (본문 밀도 슬라이드)
const [zTop, zMid, zBot] = split.TMB([0.18, 0.64, 0.18]);
addKpiStripZ(sl, pptx, zTop, [...]);        // 상단 3~4 지표
addBigCardsZ(sl, pptx, zMid, [...], {cols:4}); // 중단 큰 카드
addInsightBoxZ(sl, pptx, zBot, '...');        // 하단 한 줄 통찰
```

---

## [AP-17] 빈 아이콘 자리(원/X/!/? 문자) 금지

AP-03(빈 장식 도형)의 강화 규칙. 아이콘 자리에 `'X'`, `'!'`, `'?'` 같은 문자나 내부가 빈 원을 놓는 것은 금지. 허용 대안:
1. `patterns/components/icon_helper.js`의 SVG 아이콘 (권장)
2. 큰 번호 텍스트(`01` / `02` / `03`) 44~56pt ACC
3. 도형 + 번호 결합 (원/사각형 안에 숫자)

---

## [AP-18] 한 슬라이드 단일 컴포넌트 금지 -- 최소 2종 시각 구성 요소

본문 페이지는 다음 중 **최소 2종 이상**을 결합해야 한다:
- KPI strip (가로 지표 3~4개)
- Big cards (중단 대형 카드 2~4장)
- Timeline / Step flow
- Insight box (하단 한 줄 통찰)
- Icon grid / Image placeholder

예외: 간지(divider), 표지(cover), 마무리(ending), 강조(highlight) 컴포넌트는 전체 슬라이드 레이아웃을 의도적으로 점유하므로 단일 컴포넌트 허용.

---

## [AP-19] 줄글(산문) 본문 3줄 초과 금지

본문이 3줄을 넘어가면 **반드시** sub-bullet으로 쪼개거나 짧은 문장 2~3개로 분해한다.

```
(X) 나쁜 예 (4줄 산문):
  "예약 시점부터 정산까지 모든 데이터는 의료법/개인정보보호법 기준으로
   암호화 저장되며, 운전기사와 매니저는 환자 인적 정보에 접근할 수 없고,
   모든 접근 기록은 ISO 27001 기준으로 감사 로그가 남으며, 분기별
   외부 감사를 통해 검증한다."

(O) 좋은 예 (핵심 1줄 + bullets):
  body: '예약~정산 전 구간 암호화 저장/전송',
  bullets: ['의료법/PIPA 준수', '기사/매니저 접근 차단', 'ISO 27001 감사 로그']
```

---

## [AP-20] divider image-split 타입(C) 사용 시 bgImage 경로 검증 필수

divider Type C(image-split)는 `bgImage` PNG에 의존한다. 이미지 누락/깨짐 시 슬라이드가 통째로 망가진다. Type C를 사용할 때는 (1) `fs.existsSync(bgImage)` 검증, (2) 파일 크기 > 0 확인, (3) 첫 4바이트 PNG 매직(89 50 4E 47) 검사 후 사용한다. 검증 실패 시 **Type D(브랜드그래픽)로 자동 폴백**.

---

## [AP-21] 카드 상단에 얇은 색 바(accent bar) 얹는 패턴 금지 -- "AI 생성물 티"

둥근 사각형 카드 위에 가로 얇은 색칠 바(ACC/DOM 0.08~0.12" 높이)를 얹어 강조하는 패턴은 **AI가 생성한 HTML/이미지/보고서에 너무 흔해** 사람이 만든 느낌이 사라진다.

대안 (우선순위순):
1. **좌측 세로 thick bar** (0.08~0.14" 폭, 카드 높이 전체) -- 더 건축적 느낌
2. **번호/아이콘만 강조** (바 없음) -- 타이포그래피 자체가 시각 앵커
3. **카드 외곽선 1pt line** -- 채움 없이 border-only
4. **흰 박스 on 라이트 틴트 배경** -- 레이어 구조로 계층 표현
5. **도형 변경**: HEXAGON, OVAL, CHEVRON, TRAPEZOID 등 다양한 pptxgenjs shapes 활용

---

## [AP-22] 연속 3장 이상 동일 시각 구조 사용 금지 -- 구조적 다양성

모든 슬라이드가 동일 구조로 구성되면 제안서가 기계적이고 단조롭게 보인다.

**구조 다양성 체크리스트 (Ch 단위로 최소 3종류 이상 혼용)**:
- 카드 그리드 (3/4분할)
- 표 (`sl.addTable` -- 진짜 테이블, 카드로 표 흉내 금지)
- 순서도/플로우 (원 노드 + 연결선)
- 계층도/허브-스포크 (상단 원인 -> 하단 결과)
- 벤 다이어그램 (겹치는 원, `transparency`로 교차 표현)
- 간트/타임라인 (가로축 + 마커)
- LR 히어로 + 리스트 (대형 타이포 + 세로 아이템)
- 체크리스트 (원 + 체크마크 + divider line)

**LR vs TB 비율**: 전체 본문 슬라이드의 **최소 40% 이상은 Left-Right 분할 구조**를 사용한다 (`split.LR(ratio)`). TB 일변도는 수직 스크롤 느낌을 주어 지루하다.

**직전 슬라이드와의 구조 반복 금지**: 이전 슬라이드에서 사용한 구조를 바로 다음 슬라이드에서 다시 쓰지 않는다 (예: S03 카드 그리드 -> S04 카드 그리드 X, S03 카드 그리드 -> S04 허브-스포크 O).

---

## [AP-23] addShape 도형 이름 문자열 리터럴 금지 -- pptx.shapes enum 필수

pptxgenjs 4.x에서 도형 이름 체계가 변경되어, 문자열 리터럴로 도형을 지정하면 잘못된 OOXML이 생성되어 **PowerPoint에서 파일이 열리지 않는** 치명적 문제가 발생한다.

| 문자열 | pptxgenjs 3.x | pptxgenjs 4.x | 결과 |
|-------|--------------|--------------|------|
| `'oval'` | 정상 | **손상된 OOXML** | ❌ PowerPoint "파일 손상" |
| `'ellipse'` | — | 정상 | ✅ |
| `pptx.shapes.OVAL` | `'oval'` 반환 | `'ellipse'` 반환 | ✅ 항상 안전 |

```
(X) 나쁜 예: sl.addShape('oval', { ... })     // 4.x에서 파일 손상
(X) 나쁜 예: sl.addShape('roundRect', { ... }) // 현재는 작동하지만 향후 위험
(O) 좋은 예: sl.addShape(pptx.shapes.OVAL, { ... })
(O) 좋은 예: sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, { ... })
(O) 허용: sl.addShape('ellipse', { ... })      // 4.x 실제 값이므로 안전
(O) 허용: sl.addShape('rect', { ... })          // 4.x 실제 값이므로 안전
```

**자동 검증**: `grep -n "addShape('" generate_ppt.js` 로 문자열 리터럴 도형 이름 검출. `'oval'` 이 발견되면 즉시 `'ellipse'`로 교체.

---

## [AP-24] Shadow 객체 공유 금지 -- 팩토리 함수 필수

pptxgenjs는 shadow 옵션 객체를 처리할 때 **원본 객체를 직접 변환(mutate)**한다. blur, offset, angle, opacity 값을 EMU(English Metric Unit)로 변환하면서 원본 객체의 값을 덮어쓰므로, 동일 객체를 여러 도형에 공유하면 **매 호출마다 값이 ×12700씩 기하급수적으로 증가**한다.

| 호출 순서 | blur 값 (입력) | blur 값 (OOXML) | 결과 |
|----------|---------------|-----------------|------|
| 1번째 | 6 | 76,200 | ✅ 정상 |
| 2번째 | 76,200 (mutated) | 967,740,000 | ❌ 손상 |
| 3번째 | 967,740,000 | 12,290,298,000,000 | ❌ 천문학적 수치 |

```
(X) 나쁜 예: 공유 상수
const SHADOW = { type: 'outer', blur: 6, offset: 3, angle: 270, color: '000000', opacity: 0.15 };
sl1.addShape('rect', { shadow: SHADOW });  // OK
sl2.addShape('rect', { shadow: SHADOW });  // SHADOW 값이 이미 변환됨 → 파일 손상

(O) 좋은 예: 팩토리 함수
const sdw = () => ({ type: 'outer', blur: 6, offset: 3, angle: 270, color: '000000', opacity: 0.15 });
sl1.addShape('rect', { shadow: sdw() });   // 새 객체
sl2.addShape('rect', { shadow: sdw() });   // 새 객체 → 안전

(O) 좋은 예: 스프레드 연산자
const SHADOW_BASE = { type: 'outer', blur: 6, offset: 3, angle: 270, color: '000000', opacity: 0.15 };
sl1.addShape('rect', { shadow: { ...SHADOW_BASE } });
```

**표준 shadow 팩토리 (2종)**:
```javascript
const sdw     = () => ({ type: 'outer', blur: 6,  offset: 3, angle: 270, color: '000000', opacity: 0.15 });
const sdwHero = () => ({ type: 'outer', blur: 10, offset: 5, angle: 270, color: '000000', opacity: 0.20 });
```

**자동 검증**: `grep -n "shadow: SHADOW" generate_ppt.js` — 대문자 상수 참조가 있으면 팩토리 함수로 교체 필요.

---

## [AP-25] addText margin 배열 매핑 오류 -- 배열 사용 금지

pptxgenjs의 `margin` 배열 `[top, right, bottom, left]`이 OOXML inset에 매핑될 때 **위치가 뒤섞이는 버그**가 있다. 예를 들어 `margin: [0, 24, 0, 24]` (top=0, right=24, bottom=0, left=24 의도)가 실제로는 `tIns=24pt, lIns=0`으로 변환되어 텍스트가 아래로 밀린다.

```
(X) 나쁜 예: 배열 마진
sl.addText('...', {
  margin: [0, 24, 0, 24],  // tIns에 24pt가 들어가 텍스트가 아래로 밀림
  valign: 'middle',
});

(O) 좋은 예: 마진 제거 + 좌표로 패딩 제어
sl.addText('...', {
  margin: 0,  // 마진 없음
  align: 'center', valign: 'middle',  // 정렬로 해결
});

(O) 허용: 단일 숫자 마진 (모든 방향 동일)
sl.addText('...', { margin: 10 });  // 단일 값은 안전
```

**자동 검증**: `grep -n "margin: \[" generate_ppt.js` — 배열 형태 margin이 발견되면 제거 또는 단일 값으로 교체.

---

## [AP-26] pptxgenjs 4.x Content_Types.xml phantom slideMaster 버그

pptxgenjs 4.x가 PPTX를 생성할 때, `[Content_Types].xml`에 **실제로 존재하지 않는 slideMaster 엔트리**(slideMaster2~N)를 슬라이드 수만큼 생성하는 버그가 있다. 실제 ZIP 내에는 `slideMaster1.xml`만 존재한다.

- 3슬라이드 이하: PowerPoint이 무시하고 열 수 있음 (경우에 따라)
- 4슬라이드 이상: 열리지 않는 경우 발생 가능

이 버그는 shadow mutation(AP-24)이 수정되면 대부분 영향이 없어지지만, 엄격한 OOXML 검증이 필요한 환경에서는 후처리로 제거할 수 있다.

```javascript
// 후처리 예시 (필요 시에만)
const JSZip = require('jszip');
const zip = await JSZip.loadAsync(rawBuf);
let ct = await zip.files['[Content_Types].xml'].async('string');
ct = ct.replace(
  /<Override\s+PartName="\/ppt\/slideMasters\/slideMaster(?:[2-9]|\d{2,})\.xml"[^>]*\/>/g,
  ''
);
zip.file('[Content_Types].xml', ct);
```

**참고**: AP-24(shadow mutation)가 주 손상 원인이므로, AP-24 준수가 우선. AP-26은 보조적 방어선.
