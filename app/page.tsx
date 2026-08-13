"use client";

import { CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";
import { loadAccount, loginAccount, logoutAccount, saveAccount } from "./supabase-api";

type Tab = "today" | "workout" | "records" | "food";
type Persona = "T" | "F";
type WeightEntry = { day: number; weight: number };
type LoadEntry = { day: number; name: string; kg: number };
type Interval = { time: string; target: string };
type Exercise = { name: string; detail: string; weighted?: boolean; intervals?: Interval[] };
type BodyStat = { date: string; day: number; weight: number; muscle: number; bodyFat: number; bmi: number | null };
type ExerciseGuide = { image: string; motion: string; focus: string; steps: string[]; caution: string; program?: Interval[] };
type FoodAdvice = { name: string; verdict: string; tone: "good" | "careful" | "limit" | "unknown"; calories: string; serving: string; fact: string; encouragement: string; actions: string[] };
type FoodChat = { id: number; query: string; advice: FoodAdvice };

const PLAN_START = "2026-08-10";
const PLAN_TARGET = "2026-09-30";

const INITIAL_WEIGHTS: WeightEntry[] = [
];

const MILESTONES = [
  { range: "DAY 1—10", name: "적응기", target: "73kg 전후", mission: "식사량 80% · 야식 줄이기" },
  { range: "DAY 11—30", name: "본격 감량기", target: "71kg 전후", mission: "밥 1/2—2/3공기" },
  { range: "DAY 31—40", name: "정체기 관리", target: "70kg 전후", mission: "저녁 밥 조금 더 줄이기" },
  { range: "DAY 41—52", name: "마무리", target: "68—70kg", mission: "술·야식·간식 최소화" },
];

const ROUTINES: Record<string, Exercise[]> = {
  push: [
    { name: "벤치프레스", detail: "4세트 × 15회", weighted: true },
    { name: "숄더프레스", detail: "4세트 × 15회", weighted: true },
    { name: "체스트 플라이", detail: "가슴 수축에 집중 · 4세트 × 15회", weighted: true },
    { name: "사이드 레터럴 레이즈", detail: "반동 없이 · 4세트 × 15회", weighted: true },
  ],
  pull: [
    { name: "랫풀다운", detail: "4세트 × 15회", weighted: true },
    { name: "시티드 로우", detail: "4세트 × 15회", weighted: true },
    { name: "코어 슈퍼세트", detail: "크런치 15회 + 플랭크 30초 × 4세트" },
  ],
  legs: [
    { name: "레그프레스", detail: "4세트 × 15회", weighted: true },
    { name: "레그익스텐션", detail: "4세트 × 15회", weighted: true },
    { name: "레그컬", detail: "4세트 × 15회", weighted: true },
  ],
  pain: [
    { name: "시티드 로우", detail: "등받이에 기대어 4세트 × 15회", weighted: true },
    { name: "랫풀다운", detail: "반동 없이 4세트 × 15회", weighted: true },
    { name: "좌식 사이클", detail: "편안한 강도로 20분" },
    { name: "크런치", detail: "4세트 × 15회" },
  ],
};

const OPTIONAL: Record<string, Exercise[]> = {
  push: [
    { name: "페이스 풀", detail: "어깨 균형 보완 · 4세트 × 15회", weighted: true },
    { name: "데드버그", detail: "프레스 안정성을 위한 코어 · 좌우 4세트 × 15회" },
    { name: "백 익스텐션", detail: "허리 중립 유지 · 4세트 × 15회" },
  ],
  pull: [
    { name: "페이스 풀", detail: "어깨 뒤쪽 4세트 × 15회", weighted: true },
    { name: "백 익스텐션", detail: "허리 중립 4세트 × 15회" },
    { name: "데드버그", detail: "등 운동 안정성을 위한 코어 · 좌우 4세트 × 15회" },
  ],
  legs: [
    { name: "힙 어브덕션", detail: "둔근 집중 4세트 × 15회", weighted: true },
    { name: "카프 레이즈", detail: "정점 정지 4세트 × 15회", weighted: true },
    { name: "데드버그", detail: "허리 부담 없는 코어 · 좌우 4세트 × 15회" },
  ],
  pain: [
    { name: "페이스 풀", detail: "앉아서 4세트 × 15회", weighted: true },
    { name: "데드버그", detail: "천천히 좌우 4세트 × 15회" },
    { name: "백 익스텐션", detail: "통증 없는 범위 · 4세트 × 15회" },
  ],
};

const EXERCISE_GUIDES: Record<string, ExerciseGuide> = {
  벤치프레스: { image: "/exercise-bench-press.png", motion: "/exercise-bench-press-motion.webp", focus: "가슴 · 삼두 · 전면 어깨", steps: ["눈이 바 아래 오도록 눕고 발·엉덩이·등·머리를 안정시켜요.", "어깨뼈를 뒤와 아래로 고정하고 바를 가슴 중앙으로 천천히 내려요.", "손목 아래에 팔꿈치를 두고 발로 바닥을 밀며 곧게 올려요."], caution: "엄지까지 감싼 그립을 쓰고, 어깨가 들리거나 엉덩이가 뜨면 중량을 낮추세요." },
  숄더프레스: { image: "/exercise-shoulder-press.png", motion: "/exercise-shoulder-press-motion.webp", focus: "어깨 · 삼두", steps: ["손잡이가 어깨 높이에 오도록 좌석을 맞추고 등을 붙여요.", "손목과 팔꿈치를 수직으로 두고 머리 위로 부드럽게 밀어요.", "허리를 과하게 꺾지 말고 팔꿈치를 잠그기 직전에 멈춰요."], caution: "목 뒤로 밀지 말고 통증 없는 범위에서만 움직이세요." },
  랫풀다운: { image: "/exercise-lat-pulldown.png", motion: "/exercise-lat-pulldown-motion.webp", focus: "광배근 · 등", steps: ["허벅지 패드를 고정하고 배에 힘을 준 채 바를 잡아요.", "어깨를 먼저 아래로 내린 뒤 상체를 30도 이내로만 기울여요.", "바를 윗가슴 쪽으로 당기고 반동 없이 천천히 되돌려요."], caution: "바를 목 뒤로 당기거나 허리를 크게 젖히지 마세요." },
  "시티드 로우": { image: "/exercise-seated-row.png", motion: "/exercise-seated-row-motion.webp", focus: "등 중앙 · 광배근", steps: ["무릎을 살짝 굽히고 허리를 중립으로 세워 손잡이를 잡아요.", "몸통을 고정한 채 팔꿈치를 뒤로 보내며 아랫가슴 쪽으로 당겨요.", "등을 둥글게 말지 않고 팔을 천천히 펴며 돌아가요."], caution: "몸을 앞뒤로 흔들어 중량을 당기지 마세요." },
  레그프레스: { image: "/exercise-leg-press.png", motion: "/exercise-leg-press-motion.webp", focus: "대퇴사두근 · 둔근", steps: ["발을 어깨너비로 놓고 허리와 골반을 패드에 붙여요.", "무릎이 발끝 방향을 따라가게 하며 약 90도까지 천천히 내려요.", "발바닥 전체로 밀고 무릎이 완전히 잠기기 전에 멈춰요."], caution: "골반이 말려 들리거나 무릎이 안쪽으로 모이면 가동범위와 중량을 줄이세요." },
  레그익스텐션: { image: "/exercise-leg-extension.png", motion: "/exercise-leg-extension-motion.webp", focus: "대퇴사두근", steps: ["기구 회전축과 무릎 관절을 맞추고 패드를 발목 위에 놓아요.", "등을 붙인 채 정강이 패드를 부드럽게 들어 올려요.", "무릎을 세게 잠그지 않고 정점에서 멈춘 뒤 천천히 내려요."], caution: "무릎 앞쪽 통증이 있으면 중량과 가동범위를 즉시 줄이세요." },
  레그컬: { image: "/exercise-leg-curl.png", motion: "/exercise-leg-curl-motion.webp", focus: "햄스트링", steps: ["기구 회전축과 무릎을 맞추고 허벅지 패드를 고정해요.", "엉덩이가 들리지 않게 발꿈치를 아래와 뒤로 당겨요.", "가장 깊은 편안한 지점에서 멈춘 뒤 천천히 되돌려요."], caution: "반동을 쓰거나 허리를 과하게 꺾지 마세요." },
  "체스트 플라이": { image: "/exercise-chest-fly.png", motion: "/exercise-chest-fly-motion.webp", focus: "가슴", steps: ["손잡이가 가슴 중앙에 오도록 좌석을 맞춰요.", "팔꿈치를 살짝 굽힌 채 가슴 앞에서 손잡이를 모아요.", "어깨가 앞으로 말리지 않는 범위에서 천천히 열어요."], caution: "팔이 몸 뒤로 과하게 넘어가거나 어깨 앞쪽이 아프면 범위를 줄이세요." },
  "사이드 레터럴 레이즈": { image: "/exercise-lateral-raise.png", motion: "/exercise-lateral-raise-motion.webp", focus: "측면 어깨", steps: ["가벼운 덤벨을 들고 무릎과 팔꿈치를 살짝 굽혀요.", "어깨가 으쓱하지 않게 양팔을 어깨 높이까지 올려요.", "반동 없이 2초 동안 천천히 내려요."], caution: "손목이 팔꿈치보다 높아지지 않게 하고 목에 힘이 몰리면 중량을 줄이세요." },
  "페이스 풀": { image: "/exercise-face-pull.png", motion: "/exercise-face-pull-motion.webp", focus: "후면 어깨 · 등 위쪽", steps: ["로프를 얼굴 높이에 두고 몸통을 단단히 고정해요.", "팔꿈치를 옆으로 벌리며 로프를 눈썹 양옆으로 당겨요.", "견갑을 유지한 채 팔을 천천히 뻗어요."], caution: "허리를 젖혀 끌어당기지 말고 어깨 통증 없는 범위에서 진행하세요." },
  "백 익스텐션": { image: "/exercise-back-extension.png", motion: "/exercise-back-extension-motion.webp", focus: "둔근 · 햄스트링 · 척추기립근", steps: ["패드가 골반 아래에 오도록 맞추고 몸을 일직선으로 세워요.", "허리를 둥글게 말지 않고 엉덩이를 접어 상체를 내려요.", "둔근을 조이며 몸이 일직선이 되는 지점까지만 올라와요."], caution: "상체를 뒤로 꺾지 말고 허리 통증이 있으면 즉시 멈추세요." },
  "힙 어브덕션": { image: "/exercise-hip-abduction.png", motion: "/exercise-hip-abduction-motion.webp", focus: "중둔근 · 둔근", steps: ["등을 등받이에 붙이고 발을 발판에 안정시켜요.", "무릎으로 패드를 밀어 양옆으로 부드럽게 벌려요.", "골반을 고정한 채 천천히 시작 위치로 돌아와요."], caution: "반동을 쓰거나 허리가 뜨면 중량과 가동범위를 줄이세요." },
  "카프 레이즈": { image: "/exercise-calf-raise.png", motion: "/exercise-calf-raise-motion.webp", focus: "종아리", steps: ["발 앞부분을 발판에 두고 뒤꿈치를 편안하게 내려요.", "무릎을 잠그지 않고 발끝으로 높이 올라가요.", "정점에서 잠깐 멈춘 뒤 끝까지 천천히 내려요."], caution: "발목이 안팎으로 꺾이지 않게 하고 아킬레스건 통증이 있으면 멈추세요." },
  데드버그: { image: "/exercise-deadbug.png", motion: "/exercise-deadbug-motion.webp", focus: "복부 · 코어", steps: ["허리를 바닥에 붙이고 팔을 위로, 무릎을 90도로 들어요.", "반대쪽 팔과 다리를 천천히 뻗되 허리가 뜨지 않게 해요.", "시작 자세로 돌아와 반대쪽을 반복해요."], caution: "허리가 뜨기 시작하면 팔과 다리를 덜 뻗으세요." },
  "천국의 계단": { image: "/cardio-stair.png", motion: "/cardio-stair-motion.webp", focus: "근력 후 15분 · RPE 5—6", steps: ["첫 2분은 낮은 레벨에서 자세와 호흡을 정리해요.", "이후 10분은 대화는 가능하지만 노래는 어려운 중강도로 일정하게 올라요.", "마지막 3분은 레벨을 낮추고 런닝머신으로 자연스럽게 이어가요."], caution: "손잡이에 체중을 싣지 말고, 무릎 통증·어지럼이 있으면 즉시 강도를 낮추거나 런닝머신으로 바꾸세요.", program: [{ time: "0—2분", target: "레벨 3 · 자세 정리" }, { time: "2—12분", target: "레벨 4—6 · 중강도 유지" }, { time: "12—15분", target: "레벨 3 · 전환 회복" }] },
  "런닝머신 걷기": { image: "/cardio-treadmill.png", motion: "/cardio-treadmill-motion.webp", focus: "근력 후 15분 · 빠른 걷기", steps: ["몸을 세우고 손잡이를 잡지 않은 채 편한 속도로 시작해요.", "호흡이 안정되면 말할 수 있는 중강도로 속도나 경사를 하나만 올려요.", "마지막 3분은 속도와 경사를 낮춰 심박을 천천히 회복해요."], caution: "속도는 참고값입니다. 통증·어지럼이 있으면 즉시 낮추고, 하체 날에는 경사를 0—3%로 제한하세요.", program: [{ time: "0—3분", target: "4.5km/h · 경사 1%" }, { time: "3—12분", target: "5.0—5.5km/h · 경사 3—5%" }, { time: "12—15분", target: "4.2km/h · 경사 0—1%" }] },
  "하체 날 런닝머신 걷기": { image: "/cardio-treadmill.png", motion: "/cardio-treadmill-motion.webp", focus: "하체 근력 후 30분 · 저충격", steps: ["첫 5분은 경사 0—1%에서 다리 상태를 확인하며 천천히 걸어요.", "중간 20분은 대화가 편한 RPE 3—4로 유지하고 보폭을 무리하게 늘리지 않아요.", "마지막 5분은 속도를 낮춰 다리의 긴장을 풀고 마무리해요."], caution: "하체 운동 뒤에는 천국의 계단을 하지 않습니다. 무릎이나 발목이 불편하면 경사를 0%로 낮추거나 시간을 줄이세요.", program: [{ time: "0—5분", target: "4.0—4.5km/h · 경사 0—1%" }, { time: "5—25분", target: "4.5—5.0km/h · 경사 1—3%" }, { time: "25—30분", target: "3.8—4.2km/h · 경사 0%" }] },
};

const DEFAULT_LOADS: Record<string, number> = {
  벤치프레스: 40, 숄더프레스: 20, 랫풀다운: 40, "시티드 로우": 35,
  레그프레스: 80, 레그익스텐션: 25, 레그컬: 25,
  "체스트 플라이": 25, "사이드 레터럴 레이즈": 5, "페이스 풀": 20,
  "힙 어브덕션": 30, "카프 레이즈": 40,
};

const DAILY = [
  { image: "/motivation-01.png", quote: "의지는 시작하게 하고, 습관은 끝까지 가게 한다.", cue: "신발끈을 묶는 순간, 오늘의 승부는 이미 시작됐어요." },
  { image: "/motivation-02.png", quote: "느려도 멈추지 않으면 결국 달라진다.", cue: "오늘의 60분이 내일의 몸을 만듭니다." },
  { image: "/motivation-03.png", quote: "완벽한 한 끼보다 꾸준한 80%가 강하다.", cue: "굶지 말고, 양을 조절하고, 다시 반복하세요." },
  { image: "/motivation-01.png", quote: "동기보다 강한 것은 어제와의 약속이다.", cue: "딱 하나만 기록해도 연속 기록은 이어집니다." },
  { image: "/motivation-02.png", quote: "힘든 날의 작은 행동이 쉬운 날의 큰 행동보다 값지다.", cue: "3분만 시작하면 몸은 다음 동작을 기억해요." },
  { image: "/motivation-03.png", quote: "몸은 하루에 바뀌지 않지만, 방향은 하루에 바뀐다.", cue: "오늘 한 끼의 방향만 바로잡아도 충분해요." },
  { image: "/motivation-01.png", quote: "계속하는 사람이 결국 원하는 사람이 된다.", cue: "이번 주의 마지막 점 하나를 채워보세요." },
];

const STREAK_CELEBRATION_MESSAGES = [
  "오늘의 선택이 내일의 자신감을 만들었습니다.",
  "의지가 흔들려도, 쌓아온 습관은 당신을 앞으로 데려갑니다.",
  "완벽해서가 아니라 계속했기 때문에 강해지고 있습니다.",
  "오늘 지킨 약속 하나가 목표에 한 걸음 더 가까워지게 했습니다.",
  "변화는 조용히 쌓이다가 어느 날 분명하게 보입니다.",
  "포기하지 않은 오늘이 가장 강한 운동이었습니다.",
  "어제보다 나은 한 번의 반복, 그걸로 충분합니다.",
  "꾸준함은 재능을 이깁니다. 오늘도 그 증거를 만들었습니다.",
  "몸은 당신이 반복한 방향을 기억하고 있습니다.",
  "힘든 날에도 이어낸 기록이 진짜 자신감을 만듭니다.",
  "지금의 속도면 충분합니다. 중요한 건 멈추지 않는 것입니다.",
  "스스로와의 약속을 지킨 오늘을 오래 기억하세요.",
];

const STORAGE_KEY = "pace50-state-v5";
const SESSION_KEY = "pace50-account-session";

const FOOD_LIBRARY: Array<{ aliases: string[]; advice: FoodAdvice }> = [
  { aliases: ["짜장면", "자장면"], advice: { name: "짜장면", verdict: "먹어도 돼요 · 양 조절 필요", tone: "careful", calories: "약 800—950 kcal", serving: "보통 1그릇 · 가게와 조리법에 따라 차이", fact: "면과 춘장 소스가 함께 들어가 탄수화물·나트륨이 높은 한 끼예요. 한 그릇을 다 비우면 오늘 식사 중 가장 큰 열량이 될 가능성이 큽니다.", encouragement: "짜장면 한 끼가 감량을 망치지는 않아요. 오늘은 ‘안 먹기’보다 ‘덜 먹고 만족하기’를 연습해요.", actions: ["면은 70% 정도에서 멈추기", "군만두·볶음밥·달달한 음료는 함께 먹지 않기", "다음 끼니는 굶지 말고 단백질+채소 위주로 평소의 70—80%"] } },
  { aliases: ["삶은 달걀", "삶은 계란", "달걀", "계란"], advice: { name: "삶은 달걀", verdict: "좋은 선택이에요", tone: "good", calories: "1개 약 70—80 kcal", serving: "간식 1—2개", fact: "한 개에 단백질이 약 6g 들어 있어 포만감을 보태기 좋습니다. 다만 여러 개를 소스와 함께 먹으면 열량과 나트륨도 늘어요.", encouragement: "배고픔을 참는 대신 달걀처럼 씹는 간식을 고른 건 오래 가는 감량 습관이에요.", actions: ["간식은 1—2개", "소금·마요네즈는 최소화", "미숫가루나 과자 대신 물과 함께 천천히 먹기"] } },
  { aliases: ["미숫가루"], advice: { name: "미숫가루", verdict: "자주 마시기엔 주의", tone: "limit", calories: "약 180—350 kcal", serving: "설탕·우유·분말 양에 따라 큰 차이", fact: "곡물 분말과 당을 액체로 빠르게 마셔 포만감 대비 열량이 높아지기 쉬워요.", encouragement: "완전히 금지할 필요는 없어요. 달게 마시는 한 잔을 ‘가끔 즐거움 하나’로만 남겨두면 됩니다.", actions: ["무가당·작은 컵으로 선택", "식사와 중복하지 말고 간식으로 계산", "평소에는 삶은 달걀·사과·그릭요거트로 교체"] } },
  { aliases: ["라면"], advice: { name: "라면", verdict: "먹어도 돼요 · 조합이 중요", tone: "careful", calories: "약 450—550 kcal", serving: "봉지라면 1개 기준 추정", fact: "열량뿐 아니라 나트륨이 높고 단백질·채소가 부족해 한 봉지만 먹어도 금방 허기질 수 있어요.", encouragement: "라면을 먹는 날도 계획 안에 있어요. 무엇을 더하고 무엇을 남길지만 정하면 됩니다.", actions: ["면은 70—80%, 국물은 남기기", "달걀 1개와 채소 추가", "밥·김밥·만두는 같이 먹지 않기"] } },
  { aliases: ["삼겹살", "목살", "고기 회식"], advice: { name: "돼지고기 구이", verdict: "적당량이면 괜찮아요", tone: "careful", calories: "약 450—650 kcal", serving: "구운 고기 150—200g 추정", fact: "단백질은 얻을 수 있지만 지방 비율이 높고 술·밥·소스가 붙으면 한 끼 열량이 빠르게 커져요.", encouragement: "회식에서도 고기 자체보다 곁들이는 선택이 결과를 좌우해요. 한 가지만 덜어내도 충분합니다.", actions: ["쌈채소와 함께 150—200g", "술을 마시면 밥·면은 먼저 치우기", "쌈장·기름장과 후식 냉면 최소화"] } },
  { aliases: ["떡볶이"], advice: { name: "떡볶이", verdict: "양을 정하고 먹어요", tone: "limit", calories: "약 400—600 kcal", serving: "1인분 추정 · 토핑 제외", fact: "떡과 단맛 있는 소스 중심이라 탄수화물 밀도가 높고 단백질은 적은 편이에요.", encouragement: "먹고 싶은 날엔 작은 양으로 선명하게 즐기고, 애매하게 계속 집어 먹는 흐름만 끊어요.", actions: ["1인분의 70% 또는 작은 컵 선택", "튀김·순대·주먹밥은 추가하지 않기", "달걀이나 어묵을 곁들이고 소스는 남기기"] } },
  { aliases: ["치킨", "닭튀김"], advice: { name: "치킨", verdict: "부위와 양을 먼저 정해요", tone: "limit", calories: "약 600—1,000 kcal", serving: "반 마리 안팎 · 조리법에 따라 차이", fact: "튀김옷과 소스, 껍질 때문에 같은 닭고기라도 열량 차이가 크게 납니다.", encouragement: "치킨을 먹는 날에도 멈출 지점을 미리 정하면 계획은 그대로 이어져요.", actions: ["구이·후라이드 순으로 선택하고 양념은 덜기", "3—5조각을 접시에 덜어 먹기", "맥주·치즈볼·감자튀김은 함께 먹지 않기"] } },
  { aliases: ["김밥"], advice: { name: "김밥", verdict: "한 줄은 한 끼로 계산", tone: "careful", calories: "약 400—550 kcal", serving: "일반 김밥 1줄 추정", fact: "작아 보여도 밥과 참기름이 모여 한 줄이면 한 끼 열량에 가까워요.", encouragement: "편의식 중에서는 양을 세기 쉬운 편이에요. 한 줄을 천천히 먹고 거기서 끝내면 됩니다.", actions: ["한 줄 또는 2/3줄", "라면·떡볶이와 세트로 먹지 않기", "단백질이 적으면 달걀 1개 보완"] } },
  { aliases: ["닭가슴살"], advice: { name: "닭가슴살", verdict: "좋은 단백질 선택", tone: "good", calories: "약 150—200 kcal", serving: "조리된 100—120g 추정", fact: "단백질을 채우기 좋지만 이것만 먹는 극단적인 식단보다 평소 식사에 보완하는 방식이 오래 갑니다.", encouragement: "특별식을 버티는 것보다 평소 한 끼의 균형을 만드는 선택이 더 강해요.", actions: ["한 끼 손바닥 크기 1장", "밥 1/2—2/3공기와 채소 곁들이기", "달고 짠 소스는 절반만"] } },
  { aliases: ["바나나"], advice: { name: "바나나", verdict: "운동 전후 간식으로 좋아요", tone: "good", calories: "약 90—110 kcal", serving: "중간 크기 1개", fact: "간편한 탄수화물과 칼륨을 얻을 수 있지만 여러 개를 연달아 먹으면 간식 열량이 커집니다.", encouragement: "달달한 음료 대신 바나나 하나를 씹어 먹는 선택이면 방향이 아주 좋아요.", actions: ["한 번에 1개", "운동 전후 또는 출출한 오후에", "주스·우유와 갈기보다 그대로 씹어 먹기"] } },
  { aliases: ["그릭요거트", "요거트", "요구르트"], advice: { name: "그릭요거트", verdict: "무가당이면 좋은 선택", tone: "good", calories: "약 100—180 kcal", serving: "제품 1컵 · 당과 지방에 따라 차이", fact: "제품마다 첨가당과 지방 함량 차이가 커서 앞면 문구보다 영양정보의 총 내용량을 확인하는 게 정확합니다.", encouragement: "라벨 한 번 보는 습관이 참는 의지보다 훨씬 오래 갑니다.", actions: ["무가당 제품 1컵", "그래놀라·꿀은 합쳐서 한 숟갈 이내", "과일은 한 줌만 추가"] } },
  { aliases: ["아메리카노", "블랙커피"], advice: { name: "아메리카노", verdict: "부담이 적어요", tone: "good", calories: "약 5—15 kcal", serving: "시럽·크림 없는 1잔", fact: "무가당 아메리카노는 열량 부담이 적지만 수면을 방해하면 다음 날 식욕과 운동 리듬에 영향을 줄 수 있어요.", encouragement: "달달한 음료 대신 고른 선택은 오늘의 작지만 확실한 승리예요.", actions: ["시럽·설탕·크림 없이", "늦은 오후에는 디카페인 고려", "물 섭취를 따로 챙기기"] } },
];

function analyzeFood(query: string): FoodAdvice {
  const normalized = query.replaceAll(" ", "").toLowerCase();
  const match = FOOD_LIBRARY.find((item) => item.aliases.some((alias) => normalized.includes(alias.replaceAll(" ", "").toLowerCase())));
  if (match) {
    const countMatch = normalized.match(/([2-5])개/);
    if (countMatch && match.advice.name === "삶은 달걀") {
      const count = Number(countMatch[1]);
      return { ...match.advice, calories: `${count}개 약 ${count * 70}—${count * 80} kcal`, serving: `${count}개 기준 · 간식 권장은 보통 1—2개`, verdict: count <= 2 ? "좋은 선택이에요" : "먹어도 되지만 양은 줄여요", tone: count <= 2 ? "good" : "careful" };
    }
    return match.advice;
  }
  return { name: "음식 정보 더 필요", verdict: "양과 조리법을 알려주세요", tone: "unknown", calories: "아직 계산하기 어려워요", serving: "음식명 · 양 · 조리법 · 제품명", fact: "같은 음식도 1인분 크기, 튀김·볶음·구이 같은 조리법, 소스와 브랜드에 따라 열량 차이가 큽니다.", encouragement: "정확히 몰라도 괜찮아요. 먹을 양을 먼저 정하는 것만으로도 충분히 좋은 시작입니다.", actions: ["예: ‘돈가스 1인분, 소스 절반 먹어도 돼?’처럼 질문", "포장식품이면 총 내용량과 kcal를 함께 입력", "모르는 음식은 평소 양의 70—80%에서 멈추기"] };
}

function stageForDay(day: number) {
  if (day <= 10) return 0;
  if (day <= 30) return 1;
  if (day <= 40) return 2;
  return 3;
}

function dateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function daysAgo(amount: number) {
  const date = new Date();
  date.setDate(date.getDate() - amount);
  return dateKey(date);
}

function dayGap(from: string, to: string) {
  const start = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

function dateFromPlanDay(day: number) {
  const date = new Date(`${PLAN_START}T12:00:00`);
  date.setDate(date.getDate() + day - 1);
  return dateKey(date);
}

function planDayForDate(date: string) {
  return Math.max(1, Math.min(dayGap(PLAN_START, PLAN_TARGET) + 1, dayGap(PLAN_START, date) + 1));
}

function clampPlanDate(date: string, max: string) {
  if (date < PLAN_START) return PLAN_START;
  if (date > max) return max;
  return date;
}

type RoutineMode = "normal" | "pain";

function requiredWorkoutNames(date: string, mode: RoutineMode) {
  if (mode === "pain") return [...ROUTINES.pain.map(({ name }) => name), "좌식 사이클"];
  const targetDay = planDayForDate(date);
  const targetCycleDay = ((targetDay - 1) % 6) + 1;
  const targetKind = targetCycleDay === 1 || targetCycleDay === 4 ? "push" : targetCycleDay === 2 || targetCycleDay === 5 ? "pull" : "legs";
  const cardioNames = targetKind === "legs" ? ["하체 날 런닝머신 걷기"] : ["천국의 계단", "런닝머신 걷기"];
  return [...ROUTINES[targetKind].map(({ name }) => name), ...cardioNames];
}

function isWorkoutComplete(date: string, checks: Record<string, boolean>) {
  const targetDay = planDayForDate(date);
  return (["normal", "pain"] as RoutineMode[]).some((mode) =>
    requiredWorkoutNames(date, mode).every((name) => checks[`${date}-${mode}-${name}`] || checks[`${targetDay}-${mode}-${name}`]),
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("today");
  const [accessDate, setAccessDate] = useState(dateKey());
  const [selectedDate, setSelectedDate] = useState(dateKey());
  const [weights, setWeights] = useState<WeightEntry[]>(INITIAL_WEIGHTS);
  const [weightInput, setWeightInput] = useState("");
  const [travelMode, setTravelMode] = useState(false);
  const [painMode, setPainMode] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [nextPersona, setNextPersona] = useState<Persona>("T");
  const [modal, setModal] = useState<{ persona: Persona; eyebrow: string; title: string; body: string } | null>(null);
  const [loadHistory, setLoadHistory] = useState<LoadEntry[]>([]);
  const [loadInputs, setLoadInputs] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState(0);
  const [freezePasses, setFreezePasses] = useState(1);
  const [activeDates, setActiveDates] = useState<string[]>([]);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  const [guideView, setGuideView] = useState<"photo" | "motion">("photo");
  const [hour, setHour] = useState(9);
  const [bodyStats, setBodyStats] = useState<BodyStat[]>([]);
  const [bodyForm, setBodyForm] = useState({ weight: "", muscle: "", bodyFat: "" });
  const [pastForm, setPastForm] = useState({ date: dateKey(), weight: "", muscle: "", bodyFat: "" });
  const [foodQuery, setFoodQuery] = useState("");
  const [foodChats, setFoodChats] = useState<FoodChat[]>([]);
  const [session, setSession] = useState<{ token: string; name: string } | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authForm, setAuthForm] = useState({ name: "", pin: "" });
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [profileSetupCompleted, setProfileSetupCompleted] = useState(true);
  const [profileSetupVersion, setProfileSetupVersion] = useState(0);
  const [profileSetupOpen, setProfileSetupOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ weight: "", height: "" });
  const [profileError, setProfileError] = useState("");
  const [celebratedDates, setCelebratedDates] = useState<string[]>([]);
  const [celebrationOpen, setCelebrationOpen] = useState(false);

  const today = accessDate;
  const availableEnd = today < PLAN_START ? PLAN_START : today > PLAN_TARGET ? PLAN_TARGET : today;
  const day = planDayForDate(selectedDate);
  const accessDay = planDayForDate(today);
  const totalPlanDays = dayGap(PLAN_START, PLAN_TARGET) + 1;
  const dDay = dayGap(today, PLAN_TARGET);
  const selectedDDay = dayGap(selectedDate, PLAN_TARGET);
  const viewingToday = selectedDate === today;
  const daily = DAILY[(new Date().getDay() + day) % DAILY.length];
  const recordedWeightDates = useMemo(() => new Set(weights.map((entry) => dateFromPlanDay(entry.day))), [weights]);
  const completedDates = useMemo(() => new Set([...recordedWeightDates].filter((date) => isWorkoutComplete(date, checks))), [recordedWeightDates, checks]);
  const todayWeightComplete = recordedWeightDates.has(today);
  const todayWorkoutComplete = isWorkoutComplete(today, checks);
  const todayComplete = todayWeightComplete && todayWorkoutComplete;

  function hydrateState(parsed: Record<string, any>) {
        const loadedWeights: WeightEntry[] = parsed.weights?.length ? parsed.weights : INITIAL_WEIGHTS;
        setWeights(loadedWeights.filter((entry) => entry.day <= planDayForDate(today)));
        setTravelMode(Boolean(parsed.travelMode));
        setChecks(parsed.checks ?? {});
        setNextPersona(parsed.nextPersona ?? "T");
        setLoadHistory(parsed.loadHistory ?? []);
        setLoadInputs(parsed.loadInputs ?? {});
        setStreak(parsed.streak ?? 0);
        setFreezePasses(parsed.freezePasses ?? 1);
        setActiveDates(parsed.activeDates ?? []);
        setBodyStats((parsed.bodyStats ?? []).filter((entry: BodyStat) => entry.date >= PLAN_START && entry.date <= today).map((entry: BodyStat) => ({ ...entry, day: planDayForDate(entry.date) })));
        setFoodChats(parsed.foodChats ?? []);
        setHeightCm(Number(parsed.heightCm) >= 120 && Number(parsed.heightCm) <= 230 ? Number(parsed.heightCm) : null);
        const hasSavedProfile = Number(parsed.heightCm) >= 120 && Number(parsed.heightCm) <= 230 && loadedWeights.length > 0;
        const setupVersion = Number(parsed.profileSetupVersion) || 0;
        const setupComplete = setupVersion >= 1 || hasSavedProfile;
        setProfileSetupCompleted(setupComplete);
        setProfileSetupVersion(setupComplete ? 1 : 0);
        setProfileSetupOpen(!setupComplete);
        setCelebratedDates(parsed.celebratedDates ?? []);
  }

  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession) as { token: string; name: string };
        loadAccount(parsedSession.token).then((result) => {
          if (result.ok && result.name) {
            setSession({ token: parsedSession.token, name: result.name });
            hydrateState(result.state ?? {});
          } else localStorage.removeItem(SESSION_KEY);
        }).catch(() => localStorage.removeItem(SESSION_KEY)).finally(() => { setHydrated(true); setAuthReady(true); });
      } catch { localStorage.removeItem(SESSION_KEY); setHydrated(true); setAuthReady(true); }
    } else { setHydrated(true); setAuthReady(true); }
    const now = new Date();
    const current = dateKey(now);
    setAccessDate(current);
    setSelectedDate(clampPlanDate(current, current > PLAN_TARGET ? PLAN_TARGET : current < PLAN_START ? PLAN_START : current));
    setPastForm((value) => ({ ...value, date: clampPlanDate(current, current > PLAN_TARGET ? PLAN_TARGET : current < PLAN_START ? PLAN_START : current) }));
    setHour(now.getHours());
  }, []);

  useEffect(() => { if (session && profileSetupCompleted && !profileSetupOpen && localStorage.getItem("pace50-inspiration-date") !== today) setDailyOpen(true); }, [session, today, profileSetupCompleted, profileSetupOpen]);

  useEffect(() => {
    const timer = window.setInterval(() => { const now = new Date(); setHour(now.getHours()); setAccessDate(dateKey(now)); }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const selectedDay = planDayForDate(selectedDate);
    const savedWeight = weights.find((entry) => entry.day === selectedDay)?.weight;
    const savedBody = bodyStats.find((entry) => entry.date === selectedDate);
    if (savedWeight) setWeightInput(savedWeight.toFixed(1));
    if (savedBody) setBodyForm({ weight: savedBody.weight.toFixed(1), muscle: savedBody.muscle.toFixed(1), bodyFat: savedBody.bodyFat.toFixed(1) });
  }, [selectedDate, weights, bodyStats]);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) return;
    const state = { weights, travelMode, checks, nextPersona, loadHistory, loadInputs, streak, freezePasses, activeDates, bodyStats, foodChats, heightCm, profileSetupCompleted, profileSetupVersion, celebratedDates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const timer = window.setTimeout(() => saveAccount(session.token, state).catch(() => undefined), 500);
    return () => window.clearTimeout(timer);
  }, [weights, travelMode, checks, nextPersona, loadHistory, loadInputs, streak, freezePasses, activeDates, bodyStats, foodChats, heightCm, profileSetupCompleted, profileSetupVersion, celebratedDates, hydrated, session]);

  const stageIndex = stageForDay(day);
  const availableWeights = weights.filter((entry) => entry.day <= accessDay);
  const selectedWeights = availableWeights.filter((entry) => entry.day <= day);
  const startingWeight = weights.at(0)?.weight ?? null;
  const currentWeight = selectedWeights.at(-1)?.weight ?? null;
  const recent = selectedWeights.slice(-7);
  const sevenDayAverage = recent.length ? recent.reduce((sum, item) => sum + item.weight, 0) / recent.length : null;
  const change = currentWeight !== null && startingWeight !== null ? currentWeight - startingWeight : null;
  const cycleDay = ((day - 1) % 6) + 1;
  const routineKind = cycleDay === 1 || cycleDay === 4 ? "push" : cycleDay === 2 || cycleDay === 5 ? "pull" : "legs";
  const routineLabel = routineKind === "push" ? "가슴 / 어깨" : routineKind === "pull" ? "등 / 코어" : "하체";
  const exercises = painMode ? ROUTINES.pain : ROUTINES[routineKind];
  const optionalExercises = painMode ? OPTIONAL.pain : OPTIONAL[routineKind];
  const stairProgram = EXERCISE_GUIDES["천국의 계단"].program ?? [];
  const treadmillProgram = EXERCISE_GUIDES["런닝머신 걷기"].program ?? [];
  const legTreadmillProgram = EXERCISE_GUIDES["하체 날 런닝머신 걷기"].program ?? [];
  const cardio: Exercise[] = painMode
    ? [{ name: "좌식 사이클", detail: "20분 · 통증 없는 강도" }]
    : routineKind === "legs"
      ? [{ name: "하체 날 런닝머신 걷기", detail: "30분 · 경사 0—3% 저강도 회복 걷기", intervals: legTreadmillProgram }]
      : [
        { name: "천국의 계단", detail: "15분 · 중강도를 일정하게 유지", intervals: stairProgram },
        { name: "런닝머신 걷기", detail: "15분 · 빠른 걷기 후 쿨다운", intervals: treadmillProgram },
      ];
  const allItems = [...exercises, ...cardio];
  const completed = allItems.filter(({ name }) => checks[`${selectedDate}-${painMode ? "pain" : "normal"}-${name}`] || checks[`${day}-${painMode ? "pain" : "normal"}-${name}`]).length;
  const chartData = selectedWeights.slice(-7);
  const chartMin = chartData.length ? Math.min(...chartData.map((d) => d.weight)) - 0.2 : 0;
  const chartMax = chartData.length ? Math.max(...chartData.map((d) => d.weight)) + 0.2 : 1;

  const coach = useMemo(() => {
    if (travelMode) return { persona: "F" as Persona, line: "여행의 목표는 감량이 아니라 유지예요. 한 끼에 즐거움 하나면 충분해요." };
    if (stageIndex === 0) return { persona: "F" as Persona, line: "완벽한 식단보다 평소 양의 80%. 오늘도 오래 갈 수 있는 선택을 해요." };
    if (stageIndex === 1 && sevenDayAverage !== null) return { persona: "T" as Persona, line: `현재 7회 평균 ${sevenDayAverage.toFixed(1)}kg. 하루 숫자보다 추세가 정확합니다.` };
    if (stageIndex === 1) return { persona: "T" as Persona, line: "첫 체중을 기록하면 7일 평균과 변화 추세를 정확하게 보여드려요." };
    if (stageIndex === 2) return { persona: "T" as Persona, line: "정체는 실패가 아니라 적응 신호입니다. 저녁 밥만 한두 숟갈 줄여보세요." };
    return { persona: "F" as Persona, line: "마지막까지 굶지 않기. 가볍게, 평소처럼, 끝까지 가면 됩니다." };
  }, [stageIndex, sevenDayAverage, travelMode]);

  const monday = new Date(`${today}T12:00:00`);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const weekly = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const key = dateKey(date);
    return { key, date: `${date.getMonth() + 1}.${date.getDate()}`, label: date.toLocaleDateString("ko-KR", { weekday: "short" }).replace("요일", ""), done: completedDates.has(key) };
  });
  const completionStreak = useMemo(() => {
    let count = 0;
    const cursor = new Date(`${today}T12:00:00`);
    if (!completedDates.has(today)) cursor.setDate(cursor.getDate() - 1);
    while (completedDates.has(dateKey(cursor))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [completedDates, today]);
  const celebrationMilestone = [3, 7, 14, 30, 50].includes(completionStreak);
  const celebrationMessage = STREAK_CELEBRATION_MESSAGES[(planDayForDate(today) + completionStreak) % STREAK_CELEBRATION_MESSAGES.length];

  useEffect(() => {
    if (!hydrated || !session || !todayComplete || completionStreak < 1 || celebratedDates.includes(today)) return;
    if (profileSetupOpen || dailyOpen || modal || celebrationOpen) return;
    setCelebratedDates((dates) => [...new Set([...dates, today])]);
    setCelebrationOpen(true);
  }, [celebratedDates, celebrationOpen, completionStreak, dailyOpen, hydrated, modal, profileSetupOpen, session, today, todayComplete]);

  const progressRows = Object.keys(DEFAULT_LOADS).map((name) => {
    const history = loadHistory.filter((item) => item.name === name).sort((a, b) => a.day - b.day);
    return { name, first: history.at(0)?.kg, latest: history.at(-1)?.kg, count: history.length };
  }).filter((item) => item.count > 0);

  const mascot = hour < 12
    ? { state: "morning", label: "오전 코치", message: "좋은 아침! 아침 체중부터 기록하고 필수 운동까지 이어가요." }
    : hour < 19
      ? { state: "afternoon", label: "오후 코치", message: "아직 충분해요. 운동 한 세트만 시작하면 흐름이 다시 붙어요!" }
      : hour < 22
        ? { state: "night", label: "저녁 코치", message: "오늘이 얼마 안 남았어요. 남은 필수 운동까지 체크하고 편하게 쉬어요." }
        : { state: "night urgent", label: "자정 임박", message: `제발… 자정 전에 체중과 필수 운동을 모두 끝내 주세요. 연속 ${completionStreak}일을 잃을 순 없어요!` };
  const guide = selectedGuide ? EXERCISE_GUIDES[selectedGuide] : null;
  const recordChart = availableWeights.slice(-14);
  const recordMin = Math.min(...recordChart.map((entry) => entry.weight), 68) - 0.3;
  const recordMax = Math.max(...recordChart.map((entry) => entry.weight), 70) + 0.3;
  const heightMeters = heightCm ? heightCm / 100 : 0;
  const bodyBmi = Number(bodyForm.weight) > 0 && heightMeters > 0 ? Number(bodyForm.weight) / (heightMeters * heightMeters) : null;

  function markDate(date: string) {
    if (activeDates.includes(date)) return;
    const last = [...activeDates].sort().at(-1);
    setActiveDates((dates) => [...new Set([...dates, date])]);
    if (date === today) setStreak((value) => last && dayGap(last, today) === 1 ? value + 1 : Math.max(1, value));
  }

  function closeDaily() {
    localStorage.setItem("pace50-inspiration-date", today);
    setDailyOpen(false);
  }

  function finishProfileSetup(skipped = false) {
    if (!skipped) {
      const weight = Number(profileForm.weight);
      const height = Number(profileForm.height);
      if (!Number.isFinite(weight) || weight < 40 || weight > 150 || !Number.isFinite(height) || height < 120 || height > 230) {
        setProfileError("체중은 40—150kg, 키는 120—230cm 사이로 입력해 주세요.");
        return;
      }
      setHeightCm(height);
      setWeightInput(weight.toFixed(1));
      setBodyForm((value) => ({ ...value, weight: weight.toFixed(1) }));
      setWeights((items) => [...items.filter((entry) => entry.day !== accessDay), { day: accessDay, weight }].sort((a, b) => a.day - b.day));
      markDate(today);
    }
    setProfileSetupCompleted(true);
    setProfileSetupVersion(1);
    setProfileSetupOpen(false);
    setProfileError("");
    setDailyOpen(true);
  }

  function openCoach(eyebrow: string, tCopy: string, fCopy: string) {
    const persona = nextPersona;
    setModal({ persona, eyebrow, title: persona === "T" ? "팩트로 중심 잡기" : "마음부터 가볍게", body: persona === "T" ? tCopy : fCopy });
    setNextPersona(persona === "T" ? "F" : "T");
  }

  function saveWeight(event: FormEvent) {
    event.preventDefault();
    const value = Number(weightInput);
    if (!Number.isFinite(value) || value < 40 || value > 150) {
      setModal({ persona: "T", eyebrow: "입력 확인", title: "체중을 다시 확인해 주세요", body: "40kg에서 150kg 사이의 숫자로 입력해 주세요." });
      return;
    }
    const previous = [...weights].reverse().find((entry) => entry.day !== day)?.weight;
    setWeights((items) => [...items.filter((entry) => entry.day !== day), { day, weight: value }].sort((a, b) => a.day - b.day));
    markDate(selectedDate);
    if (previous && value - previous >= 1) {
      setModal({ persona: "T", eyebrow: "+1kg 감지", title: "이건 ‘가짜 몸무게’일 가능성이 커요", body: "수분과 염분에 의한 일시적 변화이므로 굶거나 과도한 보상 운동을 하지 마세요." });
    } else {
      openCoach("아침 체중 기록 완료", `기록은 ${value.toFixed(1)}kg입니다. 같은 조건의 기록이 추세를 만듭니다.`, "숫자를 피하지 않고 기록한 것만으로 오늘의 첫 미션은 성공이에요.");
    }
  }

  function currentLoad(name: string) {
    if (loadInputs[name] !== undefined) return loadInputs[name];
    return [...loadHistory].reverse().find((item) => item.name === name)?.kg ?? DEFAULT_LOADS[name] ?? 0;
  }

  function adjustLoad(name: string, delta: number) {
    setLoadInputs((items) => ({ ...items, [name]: Math.max(0, (items[name] ?? currentLoad(name)) + delta) }));
  }

  function toggleCheck(exercise: Exercise) {
    const key = `${selectedDate}-${painMode ? "pain" : "normal"}-${exercise.name}`;
    const willComplete = !checks[key];
    setChecks((items) => ({ ...items, [key]: willComplete }));
    if (willComplete) {
      markDate(selectedDate);
      if (exercise.weighted) {
        const kg = currentLoad(exercise.name);
        setLoadHistory((items) => [...items.filter((item) => !(item.day === day && item.name === exercise.name)), { day, name: exercise.name, kg }]);
      }
    }
  }

  function saveBodyStat(event: FormEvent) {
    event.preventDefault();
    const weight = Number(bodyForm.weight);
    const muscle = Number(bodyForm.muscle);
    const bodyFat = Number(bodyForm.bodyFat);
    if (weight < 40 || weight > 150 || muscle < 10 || muscle > 80 || bodyFat < 3 || bodyFat > 60) {
      setModal({ persona: "T", eyebrow: "주간 측정 확인", title: "수치를 다시 확인해 주세요", body: "체중 40—150kg, 근육량 10—80kg, 체지방률 3—60% 범위로 입력해 주세요." });
      return;
    }
    const bmi = heightMeters > 0 ? weight / (heightMeters * heightMeters) : null;
    const entry: BodyStat = { date: selectedDate, day, weight, muscle, bodyFat, bmi };
    setBodyStats((items) => [...items.filter((item) => item.date !== selectedDate), entry].sort((a, b) => a.date.localeCompare(b.date)));
    markDate(selectedDate);
    openCoach("주간 체성분 기록 완료", `${entry.bmi !== null ? `BMI ${entry.bmi.toFixed(1)}, ` : ""}근육량 ${muscle.toFixed(1)}kg, 체지방률 ${bodyFat.toFixed(1)}%를 저장했습니다. 주간 간격의 같은 조건 측정이 변화 확인에 유리합니다.`, "이번 주의 몸을 있는 그대로 기록했어요. 숫자는 평가가 아니라 다음 선택을 위한 지도예요.");
  }

  function savePastRecord(event: FormEvent) {
    event.preventDefault();
    const date = clampPlanDate(pastForm.date, availableEnd);
    const recordDay = planDayForDate(date);
    const weight = Number(pastForm.weight);
    const muscle = Number(pastForm.muscle);
    const bodyFat = Number(pastForm.bodyFat);
    if (!Number.isFinite(weight) || weight < 40 || weight > 150) {
      setModal({ persona: "T", eyebrow: "과거 기록 확인", title: "체중을 다시 확인해 주세요", body: "40kg에서 150kg 사이의 체중을 입력해 주세요. 근육량과 체지방률은 선택사항입니다." });
      return;
    }
    setWeights((items) => [...items.filter((entry) => entry.day !== recordDay), { day: recordDay, weight }].sort((a, b) => a.day - b.day));
    if (muscle >= 10 && muscle <= 80 && bodyFat >= 3 && bodyFat <= 60) {
      const bmi = heightMeters > 0 ? weight / (heightMeters * heightMeters) : null;
      const entry: BodyStat = { date, day: recordDay, weight, muscle, bodyFat, bmi };
      setBodyStats((items) => [...items.filter((item) => item.date !== date), entry].sort((a, b) => a.date.localeCompare(b.date)));
    }
    markDate(date);
    setPastForm((value) => ({ ...value, weight: "", muscle: "", bodyFat: "" }));
    setModal({ persona: "F", eyebrow: "지난 기록 저장", title: `${date.slice(5).replace("-", "월 ")}일 기록을 채웠어요`, body: `DAY ${recordDay}의 체중 ${weight.toFixed(1)}kg 기록이 그래프와 기록표에 반영됐습니다.` });
  }

  function moveSelectedDate(delta: number) {
    const next = new Date(`${selectedDate}T12:00:00`);
    next.setDate(next.getDate() + delta);
    setSelectedDate(clampPlanDate(dateKey(next), availableEnd));
  }

  function askFood(event: FormEvent) {
    event.preventDefault();
    const query = foodQuery.trim();
    if (!query) return;
    setFoodChats((items) => [...items.slice(-7), { id: Date.now(), query, advice: analyzeFood(query) }]);
    setFoodQuery("");
  }

  function askQuickFood(query: string) {
    setFoodChats((items) => [...items.slice(-7), { id: Date.now(), query, advice: analyzeFood(query) }]);
  }

  async function submitLogin(event: FormEvent) {
    event.preventDefault();
    const name = authForm.name.trim();
    if (name.length < 2) { setAuthError("이름을 두 글자 이상 입력해 주세요."); return; }
    if (!/^\d{4}$/.test(authForm.pin)) { setAuthError("초기 접속번호는 숫자 4자리입니다."); return; }
    setAuthBusy(true); setAuthError("");
    try {
      const result = await loginAccount(name, authForm.pin);
      if (!result.ok || !result.token || !result.name) { setAuthError(result.error ?? "이름 또는 접속번호를 확인해 주세요."); return; }
      const nextSession = { token: result.token, name: result.name };
      setSession(nextSession);
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      hydrateState(result.state ?? {});
      if (result.created) {
        setProfileSetupCompleted(false);
        setProfileSetupVersion(0);
        setProfileSetupOpen(true);
        setProfileForm({ weight: "", height: "" });
        setDailyOpen(false);
      } else {
        setDailyOpen(true);
      }
    } catch (error) { setAuthError(error instanceof Error ? error.message : "로그인에 실패했습니다."); }
    finally { setAuthBusy(false); }
  }

  async function signOut() {
    if (session) await logoutAccount(session.token).catch(() => undefined);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(STORAGE_KEY);
    setSession(null); setWeights([]); setWeightInput(""); setChecks({}); setLoadHistory([]); setLoadInputs({}); setActiveDates([]); setBodyStats([]); setBodyForm({ weight: "", muscle: "", bodyFat: "" }); setFoodChats([]); setHeightCm(null); setProfileSetupCompleted(true); setProfileSetupVersion(0); setProfileSetupOpen(false); setProfileForm({ weight: "", height: "" }); setDailyOpen(false); setCelebratedDates([]); setCelebrationOpen(false); setAuthForm({ name: "", pin: "" });
  }

  if (!authReady) return <main className="auth-loading"><div className="auth-loader" /><span>자기관리 공간을 준비하고 있어요</span></main>;

  if (!session) return <main className="login-page"><section className="login-visual"><div className="login-brand"><span>50</span><b>PACE MAKER</b></div><div className="login-copy"><p>50일, 나를 바꾸는 가장 현실적인 기록</p><h1>자기관리의<br /><em>시작</em></h1><span>체중 · 운동 · 식사를 한곳에서 이어가세요.</span></div><div className="login-stats"><div><b>50</b><span>DAY PLAN</span></div><div><b>4</b><span>MILESTONES</span></div><div><b>1</b><span>DAILY PROMISE</span></div></div></section><section className="login-panel"><div className="login-form-wrap"><p className="section-label">WELCOME TO YOUR PACE</p><h2>내 기록 시작하기</h2><p className="login-help">처음 입력한 이름과 숫자 4자리가 내 접속 정보가 됩니다. 다음부터 같은 정보로 로그인하세요.</p><form onSubmit={submitLogin}><label htmlFor="account-name">이름</label><input id="account-name" autoComplete="username" maxLength={20} value={authForm.name} onChange={(e) => setAuthForm((value) => ({ ...value, name: e.target.value }))} placeholder="사용할 이름" /><label htmlFor="account-pin">초기 접속번호</label><input id="account-pin" type="password" inputMode="numeric" autoComplete="current-password" maxLength={4} value={authForm.pin} onChange={(e) => setAuthForm((value) => ({ ...value, pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))} placeholder="숫자 4자리" /><div className="pin-preview" aria-hidden="true">{[0,1,2,3].map((index) => <i key={index} className={authForm.pin.length > index ? "filled" : ""} />)}</div>{authError && <p className="auth-error" role="alert">{authError}</p>}<button type="submit" disabled={authBusy}>{authBusy ? "확인 중…" : "시작하기"}<span>→</span></button></form><small>접속번호는 암호화되어 저장됩니다. 공용 기기에서는 사용 후 로그아웃하세요.</small></div></section></main>;

  return (
    <main className={travelMode ? "app travel-on" : "app"}>
      {travelMode && <div className="travel-banner"><span>여행 모드 · 오늘의 목표는 유지</span><strong>한 끼에 즐거움 하나</strong></div>}

      <header className="topbar">
        <a className="brand" href="#top" aria-label="50일 페이스메이커 홈"><span className="brand-mark">50</span><span>PACE<br />MAKER</span></a>
        <div className="header-actions">
          <button className={todayComplete ? "streak-chip safe" : "streak-chip"} onClick={() => document.getElementById("streak")?.scrollIntoView()}><span>🔥</span><b>{completionStreak}일 연속</b></button>
          <label className="travel-switch"><input type="checkbox" checked={travelMode} onChange={(event) => setTravelMode(event.target.checked)} /><span aria-hidden="true" />여행</label>
          <button className="avatar" onClick={signOut} aria-label={`${session.name} 로그아웃`} title="로그아웃">{session.name.slice(0, 1)}</button>
        </div>
      </header>

      <section className="content" id="top">
        {tab === "today" && <>
          <section className="photo-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(11,18,32,.93) 0%, rgba(11,18,32,.65) 48%, rgba(11,18,32,.08) 100%), url(${daily.image})` }}>
            <div className="hero-copy">
              <p className="kicker">{selectedDate.replaceAll("-", ".")} · DAY {day}</p>
              <h1>{daily.quote}</h1>
              <p className="hero-cue">{daily.cue}</p>
              <div className="day-control"><button onClick={() => moveSelectedDate(-1)} disabled={selectedDate <= PLAN_START} aria-label="이전 날짜">−</button><span><b>DAY {day}</b><small> / {totalPlanDays}</small></span><button onClick={() => moveSelectedDate(1)} disabled={selectedDate >= availableEnd} aria-label="다음 날짜">＋</button></div>
            </div>
            <div className="hero-progress"><strong>{selectedDDay > 0 ? `D-${selectedDDay}` : selectedDDay === 0 ? "D-DAY" : `D+${Math.abs(selectedDDay)}`}</strong><span>목표일 9월 30일 · DAY {day} / {totalPlanDays}</span></div>
          </section>

          {!viewingToday && <section className="past-day-banner"><div><b>과거 기록 보기 · {selectedDate}</b><span>DAY {day}의 체중과 운동 기록을 지금도 수정할 수 있어요.</span></div><button onClick={() => setSelectedDate(clampPlanDate(today, availableEnd))}>오늘로 돌아가기</button></section>}

          <section className={todayComplete ? "streak-panel safe" : "streak-panel"} id="streak">
            <div className={`mascot-art ${mascot.state}`} role="img" aria-label={`${mascot.label} 호랑이 헬스 코치`} />
            <div className="streak-copy">
              <p>🔥 {mascot.label} · 연속 기록</p>
              <h2>{todayComplete ? `체중과 운동 완료. ${completionStreak}일 연속!` : !todayWeightComplete ? `아침 체중과 필수 운동을 모두 완료해야 연속 ${completionStreak}일을 지켜요.` : `체중 기록 완료. 이제 필수 운동까지 체크해 주세요.`}</h2>
              <span className="mascot-message">“{todayComplete ? "오늘의 두 가지 약속을 모두 지켰어요!" : mascot.message}”</span>
            </div>
            <div className="week-dots">{weekly.map((item) => <div key={item.key} className={item.done ? "done" : item.key === today ? "today" : ""}><span className="week-date">{item.date}</span><i>{item.done ? "✓" : ""}</i><span>{item.label}</span></div>)}</div>
            <div className="streak-side"><span>🧊 보호권 {freezePasses}개</span><button onClick={() => { if (!todayWeightComplete) { setTab("today"); setSelectedDate(clampPlanDate(today, availableEnd)); window.setTimeout(() => document.getElementById("weight")?.focus(), 0); } else if (!todayWorkoutComplete) { setSelectedDate(clampPlanDate(today, availableEnd)); setTab("workout"); } }}>{todayComplete ? "연속 기록 안전" : !todayWeightComplete ? "아침 체중 기록하기" : "필수 운동 마치기"}</button></div>
          </section>

          <section className="milestone-strip">{MILESTONES.map((m, index) => <article className={index === stageIndex ? "milestone active" : index < stageIndex ? "milestone done" : "milestone"} key={m.name}><div className="milestone-num">0{index + 1}</div><div><span>{m.range}</span><strong>{m.name}</strong><small>{m.target}</small></div>{index === stageIndex && <i>NOW</i>}</article>)}</section>

          <section className="dashboard-grid">
            <article className={`coach-card coach-${coach.persona.toLowerCase()}`}><div className="coach-badge">{coach.persona}</div><div><p>{coach.persona === "T" ? "오늘의 팩트 코치" : "오늘의 마음 코치"}</p><h2>{coach.line}</h2></div><span className="quote-mark">”</span></article>

            <article className="weight-card card">
              <div className="card-heading"><div><p className="section-label">WEIGHT TREND</p><h2>숫자보다 <em>7일의 흐름</em></h2></div><div className="weight-stat"><strong>{currentWeight !== null ? currentWeight.toFixed(1) : "—"}</strong>{currentWeight !== null && <span>kg</span>}<small>{change !== null ? `${change.toFixed(1)}kg` : "첫 기록을 기다려요"}</small></div></div>
              <div className={chartData.length ? "chart" : "chart empty-chart"}>{chartData.length ? <><div className="average-line" style={{ bottom: `${(((sevenDayAverage ?? chartMin) - chartMin) / (chartMax - chartMin)) * 100}%` }}><span>7회 평균 {sevenDayAverage?.toFixed(1)}</span></div>{chartData.map((entry) => { const height = 18 + ((entry.weight - chartMin) / (chartMax - chartMin)) * 68; return <div className="chart-column" key={entry.day}><span className="bar-value">{entry.weight.toFixed(1)}</span><div className={entry.day === day ? "bar active" : "bar"} style={{ height: `${height}%` }} /><small>D{entry.day}</small></div>; })}</> : <div className="chart-empty-copy"><b>아직 체중 기록이 없어요.</b><span>첫 체중을 입력하면 변화 그래프가 시작됩니다.</span></div>}</div>
              <form className="weight-form" onSubmit={saveWeight}><label htmlFor="weight">{viewingToday ? "오늘" : selectedDate.slice(5).replace("-", ".")} 아침 공복 체중</label><div className="input-shell"><input id="weight" inputMode="decimal" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} /><span>kg</span></div><button type="submit">{viewingToday ? "오늘" : "지난"} 기록 저장 <span>→</span></button></form>
              <p className="tiny-note">날짜를 뒤로 이동하면 지나간 날의 기록도 언제든 보완할 수 있습니다.</p>
            </article>

            <article className="mission-card card"><div className="card-heading compact"><div><p className="section-label">THIS STAGE</p><h2>{MILESTONES[stageIndex].name} 미션</h2></div><span className="stage-pill">{stageIndex + 1} / 4</span></div><div className="mission-main"><span>핵심 미션</span><strong>{MILESTONES[stageIndex].mission}</strong></div><ul className="principles"><li><i>01</i><span><b>평소 식사의 70—80%</b>극단적인 다이어트식은 필요 없어요.</span></li><li><i>02</i><span><b>밥은 1/2—2/3공기</b>반찬은 평소처럼, 탄수화물만 조절해요.</span></li><li><i>03</i><span><b>마실 것은 가볍게</b>물 · 아메리카노 · 무칼로리 음료.</span></li></ul></article>

            <article className="defense-card card"><div><p className="section-label">QUICK DEFENSE</p><h2>위기 전에 한 번만 눌러요</h2></div><div className="defense-actions"><button onClick={() => openCoach("외식 · 회식 방어", "술을 마신다면 밥(탄수화물)을 가장 먼저 치우세요.", "회식 한 번으로 계획은 무너지지 않아요. 술과 밥을 같이 먹지 않는 것만 기억해요.")}><span>酒</span><b>외식 / 회식</b><small>가기 전 체크</small></button><button onClick={() => openCoach("간식 교체", "미숫가루 같은 고농축 액상 탄수화물은 포만감은 짧고 에너지 밀도는 높습니다.", "삶은 달걀이나 사과처럼 씹는 간식 하나로 방향만 바꿔봐요.")}><span>!</span><b>나쁜 간식</b><small>미숫가루 등</small></button></div></article>
          </section>
        </>}

        {tab === "workout" && <section className="workout-page page-panel">
          <div className="page-title-row"><div><p className="kicker">{selectedDate} · DAY {day}</p><h1>{viewingToday ? "오늘의" : "지난날의"} 60분</h1><p>날짜를 골라 과거 운동도 체크할 수 있습니다. 중량은 ±5kg로 조절하세요.</p><div className="date-picker-row"><button onClick={() => moveSelectedDate(-1)} disabled={selectedDate <= PLAN_START}>이전 날</button><input type="date" min={PLAN_START} max={availableEnd} value={selectedDate} onChange={(e) => setSelectedDate(clampPlanDate(e.target.value, availableEnd))} /><button onClick={() => moveSelectedDate(1)} disabled={selectedDate >= availableEnd}>다음 날</button></div></div><div className="workout-day"><span>CYCLE</span><strong>{cycleDay}</strong><small>/ 6</small></div></div>
          <div className="routine-head"><div><span>{painMode ? "PAIN-SAFE ROUTINE" : `DAY ${cycleDay}`}</span><h2>{painMode ? "무릎 부담 없는 루틴" : routineLabel}</h2></div><button className={painMode ? "pain-button active" : "pain-button"} onClick={() => setPainMode((v) => !v)}><span>＋</span>{painMode ? "통증 모드 끄기" : "무릎 통증"}</button></div>
          {painMode && <div className="pain-notice"><b>체중이 실리는 동작을 뺐어요.</b><span>앉아서 하는 기구와 코어 위주로 편안하게 진행하세요.</span></div>}
          <div className="routine-list">
            <p className="list-title"><span>STRENGTH</span><b>{exercises.length}개 필수 동작 · 동작명을 누르면 자세 보기</b></p>
            {exercises.map((exercise, index) => { const key = `${selectedDate}-${painMode ? "pain" : "normal"}-${exercise.name}`; const legacyKey = `${day}-${painMode ? "pain" : "normal"}-${exercise.name}`; return <ExerciseRow key={exercise.name} index={index + 1} exercise={exercise} checked={Boolean(checks[key] || checks[legacyKey])} kg={exercise.weighted ? currentLoad(exercise.name) : null} onAdjust={(delta) => adjustLoad(exercise.name, delta)} onToggle={() => toggleCheck(exercise)} onGuide={EXERCISE_GUIDES[exercise.name] ? () => { setGuideView("photo"); setSelectedGuide(exercise.name); } : undefined} />; })}
            <p className="list-title cardio-title"><span>CARDIO · 근력 운동 후</span><b>{painMode ? "저충격" : routineKind === "legs" ? "하체 보호 30분" : "중강도 30분"}</b></p>
            {cardio.map((exercise, index) => { const key = `${selectedDate}-${painMode ? "pain" : "normal"}-${exercise.name}`; const legacyKey = `${day}-${painMode ? "pain" : "normal"}-${exercise.name}`; return <ExerciseRow key={exercise.name} index={exercises.length + index + 1} exercise={exercise} checked={Boolean(checks[key] || checks[legacyKey])} kg={null} onAdjust={() => {}} onToggle={() => toggleCheck(exercise)} onGuide={EXERCISE_GUIDES[exercise.name] ? () => { setGuideView("photo"); setSelectedGuide(exercise.name); } : undefined} />; })}
            <p className="list-title optional-title"><span>OPTIONAL · 선택 운동</span><b>여유가 있는 날만 추가</b></p>
            <div className="optional-note">필수 운동을 끝낸 뒤 1—2개만 골라 가볍게 수행하세요.</div>
            {optionalExercises.map((exercise, index) => { const key = `${selectedDate}-${painMode ? "pain" : "normal"}-${exercise.name}`; const legacyKey = `${day}-${painMode ? "pain" : "normal"}-${exercise.name}`; return <ExerciseRow key={exercise.name} index={index + 1} exercise={exercise} checked={Boolean(checks[key] || checks[legacyKey])} kg={exercise.weighted ? currentLoad(exercise.name) : null} onAdjust={(delta) => adjustLoad(exercise.name, delta)} onToggle={() => toggleCheck(exercise)} onGuide={EXERCISE_GUIDES[exercise.name] ? () => { setGuideView("photo"); setSelectedGuide(exercise.name); } : undefined} optional />; })}
          </div>
          <div className="workout-footer"><div><strong>{completed}</strong><span>/ {allItems.length} 완료</span></div><div className="completion-track"><i style={{ width: `${completed / allItems.length * 100}%` }} /></div><button disabled={completed !== allItems.length} onClick={() => openCoach("운동 완료", "오늘 계획한 근력과 유산소를 모두 수행했습니다.", "오늘 60분을 끝냈어요. 아주 좋은 반복이에요.")}>{completed === allItems.length ? "운동 완료 · 코칭 받기" : `${allItems.length - completed}개 더 체크하세요`}</button></div>
        </section>}

        {tab === "records" && <section className="records-page page-panel">
          <div className="page-title-row"><div><p className="kicker">MY 50-DAY LOG</p><h1>쌓인 기록</h1><p>체중의 방향과 기구 중량의 성장을 함께 확인하세요.</p></div><div className="record-summary"><span>누적 변화</span><strong>{change !== null ? change.toFixed(1) : "—"}{change !== null && <small>kg</small>}</strong></div></div>
          <form className="past-record-card card" onSubmit={savePastRecord}><div><p className="section-label">BACKFILL RECORD</p><h2>지난 기록 입력</h2><span>8월 10일부터 접속일 사이의 날짜를 골라 빠진 기록을 채우세요.</span></div><label><span>기록 날짜</span><input type="date" min={PLAN_START} max={availableEnd} value={pastForm.date} onChange={(e) => setPastForm((value) => ({ ...value, date: e.target.value }))} /></label><label><span>체중 · 필수</span><div><input inputMode="decimal" placeholder="예: 73.2" value={pastForm.weight} onChange={(e) => setPastForm((value) => ({ ...value, weight: e.target.value }))} /><b>kg</b></div></label><label><span>근육량 · 선택</span><div><input inputMode="decimal" placeholder="예: 30.0" value={pastForm.muscle} onChange={(e) => setPastForm((value) => ({ ...value, muscle: e.target.value }))} /><b>kg</b></div></label><label><span>체지방률 · 선택</span><div><input inputMode="decimal" placeholder="예: 22.0" value={pastForm.bodyFat} onChange={(e) => setPastForm((value) => ({ ...value, bodyFat: e.target.value }))} /><b>%</b></div></label><button type="submit">지난 기록 저장 <span>→</span></button></form>
          <div className="record-grid"><article className="record-table card"><div className="card-heading compact"><div><p className="section-label">WEIGHT LOG</p><h2>체중 기록</h2></div><span className="stage-pill">{weights.length}회</span></div><div className="table-head"><span>날짜 / 일차</span><span>체중</span><span>시작 대비</span></div>{weights.length === 0 ? <div className="body-empty">첫 체중을 기록하면 여기에 쌓입니다.</div> : [...weights].reverse().map((entry) => <div className="table-row" key={entry.day}><span>{dateFromPlanDay(entry.day).slice(5).replace("-", ".")} · D{entry.day}</span><strong>{entry.weight.toFixed(1)} kg</strong><em>{startingWeight !== null ? `${(entry.weight - startingWeight).toFixed(1)} kg` : "—"}</em></div>)}</article>
            <article className="rules-card card"><p className="section-label">STREAK SYSTEM</p><h2>연속성을 만드는 장치</h2><ol><li><span>🔥</span><div><b>{completionStreak}일 연속 완주</b><p>아침 체중과 그날의 필수 운동을 모두 완료해야 불꽃이 이어집니다.</p></div></li><li><span>🧊</span><div><b>보호권 {freezePasses}개</b><p>딱 하루 놓치면 자동으로 연속 기록을 보호합니다.</p></div></li><li><span>✓</span><div><b>선택 운동은 자유롭게</b><p>선택 운동은 연속 기록 판정에서 제외합니다.</p></div></li></ol></article>
            <article className="record-chart-card card"><div className="card-heading compact"><div><p className="section-label">WEIGHT GRAPH</p><h2>최근 체중 추세</h2></div><span className="stage-pill">최근 {recordChart.length}회</span></div><div className="record-chart-summary"><div><span>현재</span><strong>{currentWeight !== null ? `${currentWeight.toFixed(1)}kg` : "—"}</strong></div><div><span>7회 평균</span><strong>{sevenDayAverage !== null ? `${sevenDayAverage.toFixed(1)}kg` : "—"}</strong></div><div><span>목표 구간</span><strong>68—70kg</strong></div></div><div className={recordChart.length ? "record-chart" : "record-chart empty-record-chart"} aria-label="최근 체중 변화 그래프"><div className="target-band"><span>목표 68—70kg</span></div>{recordChart.length === 0 ? <div className="chart-empty-copy"><b>기록을 기다리고 있어요.</b><span>체중을 입력하면 선 그래프로 보여드려요.</span></div> : recordChart.map((entry, index) => { const bottom = ((entry.weight - recordMin) / (recordMax - recordMin)) * 100; const next = recordChart[index + 1]; const nextBottom = next ? ((next.weight - recordMin) / (recordMax - recordMin)) * 100 : bottom; const dx = 100 / Math.max(1, recordChart.length - 1); const dy = nextBottom - bottom; return <div className="record-point-wrap" key={entry.day} style={{ left: `${index * dx}%`, bottom: `${bottom}%` }}><i className="record-point" /><b>{entry.weight.toFixed(1)}</b><small>D{entry.day}</small>{next && <span className="record-line" style={{ width: `calc(${dx} * 1%)`, transform: `rotate(${-Math.atan2(dy, dx) * 180 / Math.PI}deg)`, transformOrigin: "left center" }} />}</div>; })}</div><p className="chart-footnote">하루 수치보다 같은 조건에서 쌓인 흐름을 보세요.</p></article>
            <article className="load-progress card"><div className="card-heading compact"><div><p className="section-label">STRENGTH PROGRESS</p><h2>들어 올린 무게의 성장</h2></div><span className="stage-pill">{loadHistory.length}세트 기록</span></div>{progressRows.length === 0 ? <div className="empty-progress"><strong>첫 중량을 기다리고 있어요.</strong><span>운동 탭에서 중량을 맞춘 뒤 완료 체크하면 여기에 성장 기록이 쌓입니다.</span></div> : <div className="load-table"><div className="load-head"><span>운동</span><span>첫 기록</span><span>최근</span><span>증가</span></div>{progressRows.map((row) => <div className="load-row" key={row.name}><b>{row.name}</b><span>{row.first}kg</span><strong>{row.latest}kg</strong><em>+{((row.latest ?? 0) - (row.first ?? 0)).toFixed(0)}kg</em></div>)}</div>}</article>
            <article className="body-composition card">
              <div className="card-heading compact"><div><p className="section-label">WEEKLY BODY CHECK</p><h2>주 1회 체성분 기록</h2></div><span className="stage-pill">BMI 자동 계산</span></div>
              <div className="body-layout">
                <form className="body-form" onSubmit={saveBodyStat}>
                  <label><span>체중</span><div><input inputMode="decimal" value={bodyForm.weight} onChange={(e) => setBodyForm((v) => ({ ...v, weight: e.target.value }))} /><b>kg</b></div></label>
                  <label><span>근육량</span><div><input inputMode="decimal" value={bodyForm.muscle} onChange={(e) => setBodyForm((v) => ({ ...v, muscle: e.target.value }))} /><b>kg</b></div></label>
                  <label><span>체지방률</span><div><input inputMode="decimal" value={bodyForm.bodyFat} onChange={(e) => setBodyForm((v) => ({ ...v, bodyFat: e.target.value }))} /><b>%</b></div></label>
                  <div className="bmi-preview"><span>{heightCm ? `${heightCm}cm 기준 BMI` : "키를 입력하면 BMI 계산"}</span><strong>{bodyBmi !== null && Number.isFinite(bodyBmi) ? bodyBmi.toFixed(1) : "—"}</strong><small>{heightCm ? "체중으로 자동 계산" : "초기 설정을 건너뛴 경우 BMI는 표시되지 않아요"}</small></div>
                  <button type="submit">이번 주 기록 저장 <span>→</span></button>
                </form>
                <div className="body-history">
                  <div className="body-head"><span>측정일</span><span>체중</span><span>근육</span><span>체지방</span><span>BMI</span></div>
                  {bodyStats.length === 0 ? <div className="body-empty">아직 주간 기록이 없어요. 같은 요일·비슷한 조건으로 측정해 보세요.</div> : [...bodyStats].reverse().map((entry) => <div className="body-row" key={entry.date}><b>{entry.date.slice(5).replace("-", ".")}</b><span>{entry.weight.toFixed(1)}kg</span><span>{entry.muscle.toFixed(1)}kg</span><span>{entry.bodyFat.toFixed(1)}%</span><strong>{entry.bmi !== null ? entry.bmi.toFixed(1) : "—"}</strong></div>)}
                </div>
              </div>
            </article>
          </div>
        </section>}

        {tab === "food" && <section className="food-page page-panel">
          <div className="page-title-row"><div><p className="kicker">AI CALORIE COACH</p><h1>이거 먹어도 될까?</h1><p>음식과 양을 편하게 물어보세요. 50일 목표에 맞춘 현실적인 한 끼 전략을 바로 드려요.</p></div><div className="food-page-badge"><span>T × F</span><strong>식단 코치</strong></div></div>
          <div className="food-layout">
            <article className="food-chat card">
              <div className="food-chat-head"><div className="food-coach-avatar">AI</div><div><b>칼로리 페이스메이커</b><span>열량 범위 · 적정량 · 함께 줄일 것</span></div><i>ONLINE</i></div>
              <div className="food-messages" aria-live="polite">
                <div className="food-intro"><span>안녕하세요! 이렇게 물어보세요.</span><strong>“오늘 짜장면 먹어도 돼?”</strong><p>무조건 금지하는 대신, 먹을 양과 다음 행동까지 함께 정해드릴게요.</p></div>
                {foodChats.map((chat) => <div className="food-exchange" key={chat.id}>
                  <div className="food-user-bubble">{chat.query}</div>
                  <div className={`food-answer ${chat.advice.tone}`}>
                    <div className="food-answer-top"><div><span>{chat.advice.name}</span><h2>{chat.advice.verdict}</h2></div><div className="calorie-range"><b>{chat.advice.calories}</b><small>{chat.advice.serving}</small></div></div>
                    <div className="tf-advice"><div><b>T · 팩트</b><p>{chat.advice.fact}</p></div><div><b>F · 페이스</b><p>{chat.advice.encouragement}</p></div></div>
                    <ol>{chat.advice.actions.map((action, index) => <li key={action}><span>{index + 1}</span>{action}</li>)}</ol>
                  </div>
                </div>)}
              </div>
              <form className="food-input" onSubmit={askFood}><label htmlFor="food-question">음식 상담 질문</label><div><textarea id="food-question" rows={2} value={foodQuery} onChange={(e) => setFoodQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} placeholder="예: 삶은 달걀 2개 먹어도 될까?" /><button type="submit" disabled={!foodQuery.trim()} aria-label="음식 질문 보내기">→</button></div><small>열량은 조리법·분량·브랜드에 따라 달라지는 참고 범위이며 의료 진단이나 처방이 아닙니다.</small></form>
            </article>
            <aside className="food-sidebar">
              <section className="food-quick card"><p className="section-label">QUICK QUESTIONS</p><h2>바로 물어보기</h2><div>{["짜장면 먹어도 돼?", "삶은 달걀 2개 어때?", "미숫가루 괜찮아?", "삼겹살 회식은 어떻게 먹지?", "라면 먹고 싶어", "아메리카노는 괜찮아?"].map((question) => <button key={question} onClick={() => askQuickFood(question)}>{question}<span>→</span></button>)}</div></section>
              <section className="food-rule-card card"><p className="section-label">TODAY&apos;S RULE</p><h2>금지보다 조절</h2><ul><li><b>70—80%</b><span>평소 먹던 양에서 조금만 덜기</span></li><li><b>1/2—2/3</b><span>밥은 반 공기에서 2/3공기</span></li><li><b>NO 보상</b><span>많이 먹어도 다음 끼니 굶지 않기</span></li></ul></section>
              <section className="food-source-note"><b>영양 데이터 기준</b><span>식품의약품안전처 K-FIND의 1회 분량·100g(또는 100mL) 자료를 참고하며 실제 음식은 차이가 날 수 있어요.</span></section>
            </aside>
          </div>
        </section>}
      </section>

      <nav className="bottom-nav" aria-label="주 메뉴"><button className={tab === "today" ? "active" : ""} onClick={() => setTab("today")}><span className="nav-icon">●</span><b>오늘</b></button><button className={tab === "workout" ? "active" : ""} onClick={() => setTab("workout")}><span className="nav-icon">＋</span><b>운동</b>{completed > 0 && <i>{completed}</i>}</button><button className={tab === "records" ? "active" : ""} onClick={() => setTab("records")}><span className="nav-icon">▥</span><b>기록</b></button></nav>

      {guide && selectedGuide && <div className="guide-backdrop" onMouseDown={() => setSelectedGuide(null)}><section className="guide-modal" role="dialog" aria-modal="true" aria-labelledby="guide-title" onMouseDown={(e) => e.stopPropagation()}><button className="guide-close" onClick={() => setSelectedGuide(null)} aria-label="자세 가이드 닫기">×</button><div className="guide-heading"><div><p>FORM GUIDE · {guide.focus}</p><h2 id="guide-title">{selectedGuide} 올바른 순서</h2></div><span>{guide.program ? selectedGuide === "하체 날 런닝머신 걷기" ? "30 MIN" : "15 MIN" : "4 × 15"}</span></div><div className="guide-tabs" role="tablist"><button className={guideView === "photo" ? "active" : ""} onClick={() => setGuideView("photo")}>단계별 사진</button><button className={guideView === "motion" ? "active" : ""} onClick={() => setGuideView("motion")}>동작 영상</button></div>{guideView === "photo" ? <img className="guide-media" src={guide.image} alt={`${selectedGuide} 시작, 동작, 마무리 자세 순서`} /> : <div className="motion-player"><img src={guide.motion} alt={`${selectedGuide} 동작 영상 미리보기`} /><span>동작 영상 · 자동 반복</span></div>}{guide.program && <div className="guide-program">{guide.program.map((item, index) => <div key={item.time}><b>{String(index + 1).padStart(2, "0")}</b><span>{item.time}</span><strong>{item.target}</strong></div>)}</div>}<ol>{guide.steps.map((step, index) => <li key={step}><b>0{index + 1}</b><span>{step}</span></li>)}</ol><div className="guide-caution"><strong>!</strong><span><b>안전 체크</b>{guide.caution}</span></div><button className="guide-confirm" onClick={() => setSelectedGuide(null)}>자세 확인했어요</button></section></div>}

      {profileSetupOpen && <div className="profile-onboarding-backdrop"><section className="profile-onboarding" role="dialog" aria-modal="true" aria-labelledby="profile-setup-title"><div className="profile-onboarding-mark">01</div><p>FIRST BODY CHECK</p><h2 id="profile-setup-title">첫 키와 몸무게를<br />알려주세요.</h2><span>BMI와 체중 변화는 여기서 입력한 값을 기준으로 계산합니다. 계정마다 한 번만 나타나요.</span><form className="profile-setup-form" onSubmit={(event) => { event.preventDefault(); finishProfileSetup(); }}><div className="profile-setup-fields"><label><span>첫 몸무게</span><div><input autoFocus inputMode="decimal" placeholder="예: 70.5" value={profileForm.weight} onChange={(event) => setProfileForm((value) => ({ ...value, weight: event.target.value }))} /><b>kg</b></div></label><label><span>키</span><div><input inputMode="decimal" placeholder="예: 172" value={profileForm.height} onChange={(event) => setProfileForm((value) => ({ ...value, height: event.target.value }))} /><b>cm</b></div></label></div>{profileError && <p className="profile-error" role="alert">{profileError}</p>}<div className="profile-setup-actions"><button type="submit">저장하고 시작하기 <b>→</b></button><button type="button" className="profile-skip" onClick={() => finishProfileSetup(true)}>지금은 건너뛰기</button></div></form><small>건너뛰어도 체중과 키는 나중에 기록할 수 있어요.</small></section></div>}

      {dailyOpen && !profileSetupOpen && <div className="daily-backdrop"><section className="daily-card" style={{ backgroundImage: `linear-gradient(90deg, rgba(10,17,31,.94), rgba(10,17,31,.18)), url(${daily.image})` }} role="dialog" aria-modal="true" aria-labelledby="daily-title"><div className="daily-top"><div className="daily-streak">🔥 {completionStreak}일 연속 · {dDay > 0 ? `D-${dDay}` : dDay === 0 ? "D-DAY" : `D+${Math.abs(dDay)}`}</div><div className={`daily-mascot ${mascot.state}`} role="img" aria-label={`${mascot.label} 호랑이 코치`} /></div><div className="daily-content"><p>DAY {accessDay} · {mascot.label}의 한 문장</p><h2 id="daily-title">{daily.quote}</h2><span>{todayComplete ? "오늘 체중과 필수 운동 완료. 불꽃을 지켰어요!" : mascot.message}</span><button onClick={closeDaily}>오늘도 이어가기 <b>→</b></button></div></section></div>}

      {celebrationOpen && <div className={`celebration-backdrop${celebrationMilestone ? " milestone" : ""}`}><section className="celebration-card" role="dialog" aria-modal="true" aria-labelledby="celebration-title"><div className="celebration-confetti" aria-hidden="true">{Array.from({ length: celebrationMilestone ? 32 : 18 }, (_, index) => <i key={index} style={{ "--confetti-x": `${(index * 37 + 9) % 100}%`, "--confetti-delay": `${(index % 8) * -.09}s`, "--confetti-drift": `${(index % 2 ? 1 : -1) * (22 + index % 5 * 8)}px` } as CSSProperties} />)}</div><div className="celebration-rings" aria-hidden="true" /><div className="celebration-hero" aria-hidden="true"><div className="celebration-mascot" /><div className="celebration-flame">🔥</div></div><p>{celebrationMilestone ? "MILESTONE UNLOCKED" : "STREAK EXTENDED"}</p><h2 id="celebration-title"><strong>{completionStreak}</strong>일 연속 달성!</h2><blockquote>“{celebrationMessage}”</blockquote><div className="celebration-checks"><span>✓ 아침 체중</span><span>✓ 필수 운동</span>{celebrationMilestone && <b>특별 기록</b>}</div><button onClick={() => setCelebrationOpen(false)}>내일도 이어가기 <b>→</b></button></section></div>}

      {modal && <div className="modal-backdrop" role="presentation" onMouseDown={() => setModal(null)}><section className={`coach-modal modal-${modal.persona.toLowerCase()}`} role="dialog" aria-modal="true" aria-labelledby="coach-title" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setModal(null)} aria-label="코칭 닫기">×</button><div className="modal-persona">{modal.persona}</div><p>{modal.eyebrow}</p><h2 id="coach-title">{modal.title}</h2><blockquote>{modal.body}</blockquote><button className="modal-confirm" onClick={() => setModal(null)}>좋아요, 그렇게 할게요</button></section></div>}
    </main>
  );
}

function ExerciseRow({ index, exercise, checked, kg, onAdjust, onToggle, onGuide, optional = false }: { index: number; exercise: Exercise; checked: boolean; kg: number | null; onAdjust: (delta: number) => void; onToggle: () => void; onGuide?: () => void; optional?: boolean }) {
  return <div className={`${checked ? "exercise-row checked" : "exercise-row"}${optional ? " optional" : ""}`}>
    <span className="exercise-index">{String(index).padStart(2, "0")}</span>
    <span className="exercise-copy"><button className={onGuide ? "exercise-name has-guide" : "exercise-name"} onClick={onGuide} disabled={!onGuide}>{exercise.name}{onGuide && <i>자세 보기 →</i>}</button><small>{exercise.detail}</small>{exercise.intervals && <span className="interval-strip">{exercise.intervals.map((item) => <i key={item.time}><b>{item.time}</b>{item.target}</i>)}</span>}{kg !== null && <em>완료하면 {kg}kg로 기록</em>}</span>
    {kg !== null && <div className="load-stepper" aria-label={`${exercise.name} 중량`}><button onClick={() => onAdjust(-5)} aria-label="5kg 줄이기">−</button><strong>{kg}<small>kg</small></strong><button onClick={() => onAdjust(5)} aria-label="5kg 늘리기">＋</button></div>}
    <button className="check-circle" onClick={onToggle} aria-pressed={checked} aria-label={`${exercise.name} 완료`}>{checked ? "✓" : ""}</button>
  </div>;
}
