# 03. Design DNA -- 그라운드케이 제안서 시각 언어 규격

이 문서는 제안서 PPT의 **시각적 정체성(Design DNA)**을 정의한다.
Phase 3 코드 생성 시 반드시 참조하며, 모든 규격은 우수 레퍼런스(BIFF, APEC, 아산병원, 연세대) 분석에서 도출되었다.

---

## 1. 플랫 디자인 원칙 (Flat Design DNA)

그라운드케이 제안서의 기본 조형 원리는 **플랫 디자인**이다.

| 항목 | 규격 | 비고 |
|------|------|------|
| **그림자** | 사용 금지 (`shadow` 옵션 사용하지 않음) | 카드, 블록, 아이콘 등 모든 도형에 적용 |
| **rectRadius (표준)** | `0.08` | 카드, 블록, 태그 등 일반 도형 |
| **rectRadius (히어로)** | `0.12` | 히어로 블록, 대형 강조 영역 |
| **rectRadius (필 뱃지)** | `h / 2` (완전 원형 캡슐) | Pill badge 전용 |
| **테두리** | `line: { type: "none" }` 필수 | `line: { width: 0 }`은 얇은 테두리 렌더링 버그 발생 |
| **그라데이션** | 배경 이미지로만 사용, 도형 fill에는 단색만 적용 | |

> **왜 플랫인가**: 그림자와 3D 효과는 슬라이드 간 일관성을 깨뜨리고, pptxgenjs에서 렌더링 편차가 크다. 플랫 디자인은 색상과 타이포그래피만으로 위계를 만들어 안정적이고 세련된 결과를 보장한다.

---

## 2. 도형 테두리 제거 규칙

pptxgenjs에서 `addShape`, `addText`(배경 있는 경우) 사용 시 **반드시** 테두리를 명시적으로 제거한다.

```javascript
// ✅ 올바른 방법
sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 1.0, y: 2.0, w: 3.0, h: 1.5,
  fill: { color: DOM },
  rectRadius: 0.08,
  line: { type: "none" }   // 테두리 완전 제거
});

// ❌ 잘못된 방법 -- 얇은 테두리 렌더링됨
sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 1.0, y: 2.0, w: 3.0, h: 1.5,
  fill: { color: DOM },
  line: { width: 0 }       // 버그: 테두리 보임
});

// ❌ 잘못된 방법 -- line 생략 시 기본 테두리
sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 1.0, y: 2.0, w: 3.0, h: 1.5,
  fill: { color: DOM }     // line 옵션 누락
});
```

**적용 대상**: 카드, 블록, 태그, Insight Box, 히어로 영역, accent bar, 배경 도형 등 **모든 addShape/addText(fill 있는 경우)** 호출.

---

## 3. DNA 색상 상수

generate_ppt.js 상단에 정의하는 고정 색상 상수. 팔레트(DOM/SEC/ACC)와 별도로, 디자인 DNA에서 일관되게 사용하는 색상이다.

```javascript
// ── DNA 색상 상수 ──
const HERO_TINT    = 'DOM 또는 DARK_BG';  // 히어로 블록 배경 (프로젝트별 팔레트에서 결정)
const GHOST_CLR    = 'E0E3E8';            // 고스트 넘버 색상 (극히 연한 회색)
const DIV_CLR      = 'DOM';               // 헤더 구분선 색상 (DOM 사용)
const BODY_CLR     = '333355';            // 본문 텍스트 기본 색상
const LIGHT_ON_DARK = 'F5F5F5';           // 다크 배경 위 밝은 텍스트
const TG           = '888888';            // 태그/라벨 등 보조 텍스트
const W            = 'FFFFFF';            // 순백
```

> **DIV_CLR 변경 이력**: 기존에는 ACC(Accent) 색상이었으나, DOM으로 변경하여 헤더 구분선이 브랜드 정체성을 더 강하게 표현하도록 수정됨.

---

## 4. 고스트 넘버 (Ghost Number)

카드 배경에 대형 숫자를 희미하게 배치하여 시각적 깊이감을 주는 장식 요소.

```javascript
// 고스트 넘버 예시
sl.addText('01', {
  x: cardX - 0.1, y: cardY - 0.15,
  w: 1.5, h: 1.2,
  fontSize: 44,
  fontFace: FN_XB,
  color: GHOST_CLR,       // 'E0E3E8' -- 극히 연한 회색
  align: 'left',
  valign: 'top',
  line: { type: "none" }
});
```

| 항목 | 규격 |
|------|------|
| 폰트 크기 | 44pt |
| 폰트 | FN_XB (Pretendard ExtraBold) |
| 색상 | `E0E3E8` (GHOST_CLR) |
| 위치 | 카드 좌상단, 카드 경계에서 살짝 벗어나게 배치 |
| 용도 | 카드 순번 표시 (01, 02, 03...) |

> **주의**: 고스트 넘버는 텍스트와 겹쳐도 되지만, 가독성을 해치지 않을 만큼 연해야 한다. GHOST_CLR보다 진한 색은 사용 금지.

---

## 5. 필 뱃지 (Pill Badge)

카테고리, 태그, 라벨 등에 사용하는 캡슐형 뱃지.

```javascript
// Pill badge
sl.addText('STRATEGY', {
  x: 1.0, y: 2.0, w: 1.4, h: 0.28,
  fontSize: 8,
  fontFace: FN_MD,
  color: W,
  fill: { color: ACC },
  rectRadius: 0.14,       // h / 2 = 0.28 / 2 = 0.14 (완전 캡슐)
  align: 'center',
  valign: 'middle',
  line: { type: "none" }
});
```

| 항목 | 규격 |
|------|------|
| rectRadius | `h / 2` (높이의 절반 = 완전 캡슐형) |
| 높이 | 0.25~0.30" |
| 폰트 크기 | 8~9pt |
| 폰트 | FN_MD |
| 배경색 | ACC 또는 DOM |
| 텍스트 색 | W (흰색) |

---

## 6. ACC 투명 원형 (Accent Transparent Circle)

카드 상단에 아이콘 배경으로 사용하는 반투명 원형.

```javascript
// ACC 투명 원형
sl.addShape(pptx.shapes.OVAL, {
  x: iconX - 0.15, y: iconY - 0.15,
  w: 0.70, h: 0.70,
  fill: { color: ACC, transparency: 87 },  // 85~88% 투명
  line: { type: "none" }
});
```

| 항목 | 규격 |
|------|------|
| 도형 | OVAL |
| 크기 | 0.60~0.80" (아이콘보다 약간 크게) |
| 투명도 | 85~88% (`transparency: 85` ~ `transparency: 88`) |
| 색상 | ACC |
| 용도 | 아이콘 뒤 배경, 시각적 깊이감 부여 |

> **다크 카드 위 아이콘**: 다크 배경 카드에 아이콘을 배치할 경우, ACC 투명 원형 대신 **밝은 색 불투명 원형**(fill: W, transparency: 0)을 깔아 아이콘 가시성을 확보한다.

---

## 7. 영문 대문자 태그 (English Uppercase Tag)

챕터 구분, 카테고리 표시 등에 사용하는 영문 대문자 텍스트.

```javascript
// English uppercase tag
sl.addText('OVERVIEW', {
  x: 0.53, y: 1.90, w: 2.0, h: 0.22,
  fontSize: 8,
  fontFace: FN_MD,
  color: ACC,
  charSpacing: 2,         // 영문 전용 -- 한글에는 절대 사용 금지 (AP-12)
  align: 'left',
  valign: 'middle',
  line: { type: "none" }
});
```

| 항목 | 규격 |
|------|------|
| 폰트 크기 | 8~9pt |
| 폰트 | FN_MD |
| 색상 | ACC 또는 SEC |
| charSpacing | 2 (영문 전용) |
| 텍스트 | 항상 대문자 (OVERVIEW, STRATEGY, KEY RESULTS 등) |

> **AP-12 주의**: `charSpacing` 옵션은 영문 텍스트에만 사용한다. 한글에 적용하면 글자 간격이 비정상적으로 벌어진다.

---

## 8. Insight Box 표준 규격

본문 페이지 하단에 배치하는 핵심 인사이트 강조 박스.

```javascript
// Insight Box
sl.addText('핵심 인사이트 메시지를 여기에 작성합니다.', {
  x: CB_X + CB_PAD, y: 7.00,
  w: CB_W - CB_PAD * 2, h: 0.60,
  fontSize: 14,
  fontFace: FN_XB,
  color: W,               // 흰색 텍스트
  fill: { color: DOM },   // DOM 배경
  rectRadius: 0.06,
  align: 'left',
  valign: 'middle',
  margin: [0, 12, 0, 12],
  line: { type: "none" }
});
```

| 항목 | 규격 |
|------|------|
| 배경색 | DOM |
| 텍스트 색 | W (흰색) |
| 폰트 | FN_XB 14pt |
| 높이 | 최소 0.60" |
| rectRadius | 0.06 |
| 위치 | Content Box 하단 (적재적소 -- 모든 페이지에 의무 배치 아님) |

> **배치 원칙**: Insight Box는 해당 페이지의 핵심 메시지를 강조할 때만 사용한다. 모든 본문 페이지에 기계적으로 배치하면 강조 효과가 희석된다.

---

## 9. 좌측 수직 바 (Left-Side Vertical Bar)

카드의 시각적 구분을 위한 좌측 세로 강조 바. **AP-21에 의해 상단 가로 accent bar는 금지**.

```javascript
// 좌측 수직 바 (카드 좌측에 배치)
sl.addShape(pptx.shapes.RECTANGLE, {
  x: cardX,
  y: cardY + 0.10,
  w: 0.04,                // 얇은 세로 바
  h: cardH - 0.20,        // 카드 높이에서 상하 여백 제외
  fill: { color: ACC },
  line: { type: "none" }
});
```

| 항목 | 규격 |
|------|------|
| 너비 | 0.04" |
| 높이 | 카드 높이 - 상하 패딩 |
| 위치 | 카드 좌측 변 |
| 색상 | ACC |

> **AP-21**: 카드 상단에 얇은 가로 accent bar를 배치하지 않는다. 시각적 구분이 필요하면 좌측 수직 바를 사용한다.

---

## 10. bold:true 사용 금지 (AP-15)

pptxgenjs 시스템의 `bold: true` 옵션은 사용하지 않는다. 폰트 두께는 **fontFace 이름으로만** 제어한다.

```javascript
// ✅ 올바른 방법
sl.addText('제목', { fontFace: FN_XB, fontSize: 16 });    // ExtraBold
sl.addText('본문', { fontFace: FN_MD, fontSize: 12 });    // Medium
sl.addText('설명', { fontFace: FN, fontSize: 11 });       // Regular

// ❌ 잘못된 방법
sl.addText('제목', { fontFace: FN_MD, bold: true });      // AP-15 위반
```

| fontFace 변수 | 실제 폰트명 | 용도 |
|-------------|-----------|------|
| `FN_XB` | Pretendard ExtraBold | 헤드라인, 핵심 메시지, 히어로 카피 |
| `FN_MD` | Pretendard Medium | 라벨, 태그, 카드 제목 |
| `FN` | Pretendard | 본문, 설명 텍스트 |
| `FN_TN` | Pretendard Thin | 서브카피, 보조 설명, 저작권 |

---

## 11. 헤더 구분선 색상

본문 페이지 헤더 하단의 구분선은 **DOM** 색상을 사용한다.

```javascript
// 헤더 구분선
sl.addShape(pptx.shapes.RECTANGLE, {
  x: 0.47, y: 1.55,
  w: 10.75, h: 0.015,
  fill: { color: DOM },   // DOM 색상 (이전: ACC)
  line: { type: "none" }
});
```

> **변경 이력**: ACC → DOM. 구분선이 브랜드 색상과 동일하면 헤더 영역의 브랜드 정체성이 강화된다.

---

## 체크리스트 (Phase 3.5 자체 검수 시 확인)

- [ ] 모든 도형에 `line: { type: "none" }` 적용되었는가?
- [ ] `bold: true`가 코드에 0건인가?
- [ ] 그림자(`shadow`) 옵션이 0건인가?
- [ ] rectRadius가 표준(0.08) 또는 히어로(0.12) 또는 pill(h/2)만 사용되었는가?
- [ ] Insight Box가 DOM fill + W text인가?
- [ ] 헤더 구분선이 DOM 색상인가?
- [ ] 고스트 넘버 색상이 E0E3E8인가?
- [ ] 카드 상단에 가로 accent bar가 없는가? (AP-21)
- [ ] charSpacing이 한글 텍스트에 적용되지 않았는가? (AP-12)
