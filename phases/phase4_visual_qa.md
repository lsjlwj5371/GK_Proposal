# Phase 4: 시각 QA (필수 -- 매 실행마다 자동 수행)

Phase 3.5(코드 레벨 자체 검수)를 통과한 후, **모든 실행에서 반드시** 시각 QA를 수행한다. 사용자 확인 없이 자동으로 진행하며, 결과는 사용자에게 보고한다.

## 기본 경로: PowerPoint COM + Claude 직접 분석 (API 키/LibreOffice 불필요)

Claude(나)는 이미 vision 모델이므로 `ai_visual_qa.js`(API 호출)를 거치지 않고 **직접** 슬라이드 이미지를 Read 툴로 읽어 분석한다.

**자동 실행 절차 (생략 금지):**

```
1. PPTX -> PNG 변환 (PowerShell + PowerPoint COM, Windows 기본)
2. Read 툴로 모든 PNG를 (병렬로) 읽어들여 Claude vision으로 직접 분석
3. 슬라이드별 점수/이슈/개선사항 표 작성
4. Critical 이슈(텍스트 잘림, AP 위반 등) 발견 시 수정 코드 생성 -> 재생성
5. 최종 보고를 사용자에게 전달
```

## Step 1 -- PPTX -> PNG 변환 (Windows / PowerPoint COM)

LibreOffice가 없어도 PowerPoint가 설치된 Windows 환경이면 아래 PowerShell 스크립트로 변환한다.

```powershell
$pptPath = "절대경로\file.pptx"
$outDir  = "절대경로\slides_png"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue
$pres = $ppt.Presentations.Open($pptPath, $true, $false, $false)
$i = 1
foreach ($slide in $pres.Slides) {
  $name = "slide_{0:D2}.png" -f $i
  $slide.Export("$outDir\$name", "PNG", 1600, 1131)
  $i++
}
$pres.Close(); $ppt.Quit()
"DONE: $($i-1) slides"
```

> **PowerPoint도 없을 때 폴백**: LibreOffice -> `soffice --headless --convert-to pdf` 후 `pdftoppm`. 둘 다 없으면 사용자에게 PPTX를 직접 열어 스크린샷을 요청. **절대 Phase 4를 스킵하지 않는다.**

## Step 2 -- Claude 직접 vision 분석

PNG가 생성되면 Read 툴을 4장씩 병렬 호출하여 모든 슬라이드를 읽어들인다. 각 슬라이드에 대해 다음 6개 축으로 평가한다:

| 축 | 체크 항목 |
|----|---------|
| **alignment** | Content Box 경계 준수, 카드 정렬, 헤더 좌표 일관성 |
| **fillRate** | 슬라이드 채움률 60%+, 카드 내부 여백 50% 이하 |
| **color** | WCAG AA 4.5:1 대비, 팔레트 일관성 |
| **typography** | 헤드라인 ExtraBold, 본문 위계, 텍스트 잘림 여부 |
| **visuals** | 빈 장식 도형(AP-03), 배너 아이콘(AP-04) 검사 |
| **antipattern** | AP-01(밝은 배경+다크 카드 25%+), AP-02(hard split), 간지/강조 페이지 변형 중복 |

## Step 3 -- 보고서 형식

```
[시각 QA 결과 -- 자동 분석]
종합 점수: XX/100

| # | 분류 | 점수 | 핵심 이슈 |
|---|------|-----|---------|
| 1 | 표지 | 85 | ... |
| ... |

주요 이슈 (우선순위):
1. [Critical] 슬라이드 N -- 텍스트 잘림 -> 즉시 수정
2. [High]     슬라이드 N -- AP-01 위반 -> 수정 권장
...
```

## Step 4 -- 자동 수정 트리거

- **Critical** (텍스트 잘림, 슬라이드 경계 이탈, 헤더 누락): 사용자 확인 없이 즉시 수정 -> 재생성 -> 재QA
- **High** (AP 위반, 70점 미만): 수정안 제시 후 사용자 확인
- **Medium/Low**: 보고서에만 기록
