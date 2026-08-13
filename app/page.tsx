"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Tab = "today" | "workout" | "records";
type Persona = "T" | "F";
type WeightEntry = { day: number; weight: number };
type LoadEntry = { day: number; name: string; kg: number };
type Interval = { time: string; target: string };
type Exercise = { name: string; detail: string; weighted?: boolean; intervals?: Interval[] };
type BodyStat = { date: string; day: number; weight: number; muscle: number; bodyFat: number; bmi: number };
type ExerciseGuide = { image: string; motion: string; focus: string; steps: string[]; caution: string; program?: Interval[] };

const INITIAL_WEIGHTS: WeightEntry[] = [
  { day: 1, weight: 74 }, { day: 3, weight: 73.7 }, { day: 5, weight: 73.5 },
  { day: 7, weight: 73.1 }, { day: 9, weight: 72.9 }, { day: 11, weight: 72.7 },
  { day: 13, weight: 72.5 }, { day: 15, weight: 72.2 }, { day: 17, weight: 72 },
  { day: 18, weight: 71.8 },
];

const MILESTONES = [
  { range: "DAY 1—10", name: "적응기", target: "73kg 전후", mission: "식사량 80% · 야식 줄이기" },
  { range: "DAY 11—30", name: "본격 감량기", target: "71kg 전후", mission: "밥 1/2—2/3공기" },
  { range: "DAY 31—40", name: "정체기 관리", target: "70kg 전후", mission: "저녁 밥 조금 더 줄이기" },
  { range: "DAY 41—50", name: "마무리", target: "68—70kg", mission: "술·야식·간식 최소화" },
];

const ROUTINES: Record<string, Exercise[]> = {
  push: [
    { name: "벤치프레스", detail: "4세트 × 15회", weighted: true },
    { name: "숄더프레스", detail: "4세트 × 15회", weighted: true },
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
    { name: "체스트 플라이", detail: "가볍게 4세트 × 15회", weighted: true },
    { name: "사이드 레터럴 레이즈", detail: "반동 없이 4세트 × 15회", weighted: true },
  ],
  pull: [
    { name: "페이스 풀", detail: "어깨 뒤쪽 4세트 × 15회", weighted: true },
    { name: "백 익스텐션", detail: "허리 중립 4세트 × 15회" },
  ],
  legs: [
    { name: "힙 어브덕션", detail: "둔근 집중 4세트 × 15회", weighted: true },
    { name: "카프 레이즈", detail: "정점 정지 4세트 × 15회", weighted: true },
  ],
  pain: [
    { name: "페이스 풀", detail: "앉아서 4세트 × 15회", weighted: true },
    { name: "데드버그", detail: "천천히 좌우 4세트 × 15회" },
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
  "천국의 계단": { image: "/cardio-stair.png", motion: "/cardio-stair-motion.webp", focus: "15분 인터벌 · RPE 4—6", steps: ["몸을 세우고 손잡이는 균형을 잡을 만큼만 가볍게 잡아요.", "발바닥 전체를 계단에 올리고 짧고 일정한 보폭을 유지해요.", "마지막 3분은 강도를 낮춰 호흡을 천천히 회복해요."], caution: "말은 가능하지만 노래는 어려운 정도로 조절하고, 무릎 통증·어지럼이 있으면 즉시 강도를 낮추세요.", program: [{ time: "0—3분", target: "레벨 3 · 준비" }, { time: "3—6분", target: "레벨 4 · 안정" }, { time: "6—9분", target: "레벨 5 · 집중" }, { time: "9—12분", target: "레벨 6 · 도전" }, { time: "12—15분", target: "레벨 3 · 회복" }] },
  "런닝머신 걷기": { image: "/cardio-treadmill.png", motion: "/cardio-treadmill-motion.webp", focus: "15분 경사 걷기 · RPE 4—6", steps: ["1% 경사에서 몸을 세우고 자연스럽게 걸으며 준비해요.", "손잡이를 잡지 말고 짧고 빠른 보폭으로 경사를 걸어요.", "마지막 3분은 속도와 경사를 낮춰 호흡을 회복해요."], caution: "속도는 참고값입니다. 말은 가능하지만 노래는 어려운 정도로 맞추고 통증·어지럼이 있으면 중단하세요.", program: [{ time: "0—3분", target: "4.5km/h · 1%" }, { time: "3—6분", target: "5.0km/h · 3%" }, { time: "6—9분", target: "5.5km/h · 5%" }, { time: "9—12분", target: "5.0km/h · 3%" }, { time: "12—15분", target: "4.5km/h · 1%" }] },
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

const STORAGE_KEY = "pace50-state-v2";

function stageForDay(day: number) {
  if (day <= 10) return 0;
  if (day <= 30) return 1;
  if (day <= 40) return 2;
  return 3;
}

function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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

export default function Home() {
  const [tab, setTab] = useState<Tab>("today");
  const [day, setDay] = useState(18);
  const [weights, setWeights] = useState<WeightEntry[]>(INITIAL_WEIGHTS);
  const [weightInput, setWeightInput] = useState("71.8");
  const [travelMode, setTravelMode] = useState(false);
  const [painMode, setPainMode] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [nextPersona, setNextPersona] = useState<Persona>("T");
  const [modal, setModal] = useState<{ persona: Persona; eyebrow: string; title: string; body: string } | null>(null);
  const [loadHistory, setLoadHistory] = useState<LoadEntry[]>([]);
  const [loadInputs, setLoadInputs] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState(3);
  const [freezePasses, setFreezePasses] = useState(1);
  const [activeDates, setActiveDates] = useState<string[]>([daysAgo(3), daysAgo(2), daysAgo(1)]);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  const [guideView, setGuideView] = useState<"photo" | "motion">("photo");
  const [hour, setHour] = useState(9);
  const [bodyStats, setBodyStats] = useState<BodyStat[]>([]);
  const [bodyForm, setBodyForm] = useState({ weight: "71.8", muscle: "30.0", bodyFat: "22.0" });
  const [hydrated, setHydrated] = useState(false);

  const today = dateKey();
  const daily = DAILY[(new Date().getDay() + day) % DAILY.length];
  const todayComplete = activeDates.includes(today);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("pace50-state-v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDay(parsed.day ?? 18);
        setWeights(parsed.weights?.length ? parsed.weights : INITIAL_WEIGHTS);
        setTravelMode(Boolean(parsed.travelMode));
        setChecks(parsed.checks ?? {});
        setNextPersona(parsed.nextPersona ?? "T");
        setLoadHistory(parsed.loadHistory ?? []);
        setLoadInputs(parsed.loadInputs ?? {});
        setStreak(parsed.streak ?? 3);
        setFreezePasses(parsed.freezePasses ?? 1);
        setActiveDates(parsed.activeDates?.length ? parsed.activeDates : [daysAgo(3), daysAgo(2), daysAgo(1)]);
        setBodyStats(parsed.bodyStats ?? []);

        const dates: string[] = parsed.activeDates ?? [];
        const last = [...dates].sort().at(-1);
        if (last && dayGap(last, today) > 1) {
          if ((parsed.freezePasses ?? 1) > 0 && dayGap(last, today) === 2) {
            setFreezePasses((parsed.freezePasses ?? 1) - 1);
          } else {
            setStreak(0);
          }
        }
      } catch { /* Keep safe defaults. */ }
    }
    if (localStorage.getItem("pace50-inspiration-date") !== today) setDailyOpen(true);
    setHour(new Date().getHours());
    setHydrated(true);
  }, [today]);

  useEffect(() => {
    const timer = window.setInterval(() => setHour(new Date().getHours()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ day, weights, travelMode, checks, nextPersona, loadHistory, loadInputs, streak, freezePasses, activeDates, bodyStats }));
  }, [day, weights, travelMode, checks, nextPersona, loadHistory, loadInputs, streak, freezePasses, activeDates, bodyStats, hydrated]);

  const stageIndex = stageForDay(day);
  const currentWeight = weights.at(-1)?.weight ?? 74;
  const recent = weights.slice(-7);
  const sevenDayAverage = recent.reduce((sum, item) => sum + item.weight, 0) / recent.length;
  const change = currentWeight - 74;
  const cycleDay = ((day - 1) % 6) + 1;
  const routineKind = cycleDay === 1 || cycleDay === 4 ? "push" : cycleDay === 2 || cycleDay === 5 ? "pull" : "legs";
  const routineLabel = routineKind === "push" ? "가슴 / 어깨" : routineKind === "pull" ? "등 / 코어" : "하체";
  const exercises = painMode ? ROUTINES.pain : ROUTINES[routineKind];
  const optionalExercises = painMode ? OPTIONAL.pain : OPTIONAL[routineKind];
  const stairProgram = EXERCISE_GUIDES["천국의 계단"].program ?? [];
  const treadmillProgram = EXERCISE_GUIDES["런닝머신 걷기"].program ?? [];
  const cardio: Exercise[] = painMode
    ? [{ name: "좌식 사이클", detail: "20분 · 통증 없는 강도" }]
    : [
      { name: "천국의 계단", detail: "15분 · 3분 단위 레벨 인터벌", intervals: stairProgram },
      { name: "런닝머신 걷기", detail: "15분 · 3분 단위 속도·경사 인터벌", intervals: treadmillProgram },
    ];
  const allItems = [...exercises, ...cardio];
  const completed = allItems.filter(({ name }) => checks[`${day}-${painMode ? "pain" : "normal"}-${name}`]).length;
  const chartData = weights.slice(-7);
  const chartMin = Math.min(...chartData.map((d) => d.weight)) - 0.2;
  const chartMax = Math.max(...chartData.map((d) => d.weight)) + 0.2;

  const coach = useMemo(() => {
    if (travelMode) return { persona: "F" as Persona, line: "여행의 목표는 감량이 아니라 유지예요. 한 끼에 즐거움 하나면 충분해요." };
    if (stageIndex === 0) return { persona: "F" as Persona, line: "완벽한 식단보다 평소 양의 80%. 오늘도 오래 갈 수 있는 선택을 해요." };
    if (stageIndex === 1) return { persona: "T" as Persona, line: `현재 7회 평균 ${sevenDayAverage.toFixed(1)}kg. 하루 숫자보다 추세가 정확합니다.` };
    if (stageIndex === 2) return { persona: "T" as Persona, line: "정체는 실패가 아니라 적응 신호입니다. 저녁 밥만 한두 숟갈 줄여보세요." };
    return { persona: "F" as Persona, line: "마지막까지 굶지 않기. 가볍게, 평소처럼, 끝까지 가면 됩니다." };
  }, [stageIndex, sevenDayAverage, travelMode]);

  const weekly = Array.from({ length: 7 }, (_, index) => {
    const key = daysAgo(6 - index);
    return { key, label: new Date(`${key}T12:00:00`).toLocaleDateString("ko-KR", { weekday: "short" }).replace("요일", ""), done: activeDates.includes(key) };
  });

  const progressRows = Object.keys(DEFAULT_LOADS).map((name) => {
    const history = loadHistory.filter((item) => item.name === name).sort((a, b) => a.day - b.day);
    return { name, first: history.at(0)?.kg, latest: history.at(-1)?.kg, count: history.length };
  }).filter((item) => item.count > 0);

  const mascot = hour < 12
    ? { state: "morning", label: "오전 코치", message: "좋은 아침! 체중만 먼저 기록하면 오늘 불꽃은 금방 지킬 수 있어요." }
    : hour < 19
      ? { state: "afternoon", label: "오후 코치", message: "아직 충분해요. 운동 한 세트만 시작하면 흐름이 다시 붙어요!" }
      : hour < 22
        ? { state: "night", label: "저녁 코치", message: "오늘이 얼마 안 남았어요. 딱 하나만 체크하고 편하게 쉬어요." }
        : { state: "night urgent", label: "자정 임박", message: `제발… 자정 전에 하나만 기록해 주세요. 연속 ${streak}일을 잃을 순 없어요!` };
  const guide = selectedGuide ? EXERCISE_GUIDES[selectedGuide] : null;
  const recordChart = weights.slice(-14);
  const recordMin = Math.min(...recordChart.map((entry) => entry.weight), 68) - 0.3;
  const recordMax = Math.max(...recordChart.map((entry) => entry.weight), 74) + 0.3;
  const bodyBmi = Number(bodyForm.weight) > 0 ? Number(bodyForm.weight) / (1.72 * 1.72) : 0;

  function markToday() {
    if (todayComplete) return;
    const last = [...activeDates].sort().at(-1);
    setActiveDates((dates) => [...new Set([...dates, today])]);
    setStreak((value) => last && dayGap(last, today) === 1 ? value + 1 : Math.max(1, value));
  }

  function closeDaily() {
    localStorage.setItem("pace50-inspiration-date", today);
    setDailyOpen(false);
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
    markToday();
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
    const key = `${day}-${painMode ? "pain" : "normal"}-${exercise.name}`;
    const willComplete = !checks[key];
    setChecks((items) => ({ ...items, [key]: willComplete }));
    if (willComplete) {
      markToday();
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
    const entry: BodyStat = { date: today, day, weight, muscle, bodyFat, bmi: weight / (1.72 * 1.72) };
    setBodyStats((items) => [...items.filter((item) => item.date !== today), entry].sort((a, b) => a.date.localeCompare(b.date)));
    markToday();
    openCoach("주간 체성분 기록 완료", `BMI ${entry.bmi.toFixed(1)}, 근육량 ${muscle.toFixed(1)}kg, 체지방률 ${bodyFat.toFixed(1)}%를 저장했습니다. 주간 간격의 같은 조건 측정이 변화 확인에 유리합니다.`, "이번 주의 몸을 있는 그대로 기록했어요. 숫자는 평가가 아니라 다음 선택을 위한 지도예요.");
  }

  return (
    <main className={travelMode ? "app travel-on" : "app"}>
      {travelMode && <div className="travel-banner"><span>여행 모드 · 오늘의 목표는 유지</span><strong>한 끼에 즐거움 하나</strong></div>}

      <header className="topbar">
        <a className="brand" href="#top" aria-label="50일 페이스메이커 홈"><span className="brand-mark">50</span><span>PACE<br />MAKER</span></a>
        <div className="header-actions">
          <button className={todayComplete ? "streak-chip safe" : "streak-chip"} onClick={() => document.getElementById("streak")?.scrollIntoView()}><span>🔥</span><b>{streak}일 연속</b></button>
          <label className="travel-switch"><input type="checkbox" checked={travelMode} onChange={(event) => setTravelMode(event.target.checked)} /><span aria-hidden="true" />여행</label>
          <button className="avatar" aria-label="프로필">K</button>
        </div>
      </header>

      <section className="content" id="top">
        {tab === "today" && <>
          <section className="photo-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(11,18,32,.93) 0%, rgba(11,18,32,.65) 48%, rgba(11,18,32,.08) 100%), url(${daily.image})` }}>
            <div className="hero-copy">
              <p className="kicker">TODAY&apos;S PACE · DAY {day}</p>
              <h1>{daily.quote}</h1>
              <p className="hero-cue">{daily.cue}</p>
              <div className="day-control"><button onClick={() => setDay((v) => Math.max(1, v - 1))} aria-label="이전 일차">−</button><span><b>DAY {day}</b><small> / 50</small></span><button onClick={() => setDay((v) => Math.min(50, v + 1))} aria-label="다음 일차">＋</button></div>
            </div>
            <div className="hero-progress"><strong>{Math.round(day / 50 * 100)}%</strong><span>완주까지 {50 - day}일</span></div>
          </section>

          <section className={todayComplete ? "streak-panel safe" : "streak-panel"} id="streak">
            <div className={`mascot-art ${mascot.state}`} role="img" aria-label={`${mascot.label} 호랑이 헬스 코치`} />
            <div className="streak-copy">
              <p>🔥 {mascot.label} · 연속 기록</p>
              <h2>{todayComplete ? `오늘도 지켰어요. ${streak}일 연속!` : `오늘 기록하지 않으면 연속 ${streak}일을 잃게 돼요.`}</h2>
              <span className="mascot-message">“{todayComplete ? "역시 해낼 줄 알았어요. 내일도 이 불꽃 그대로 만나요!" : mascot.message}”</span>
              <small>{todayComplete ? "작은 행동 하나가 오늘의 불꽃을 지켰습니다." : "체중 기록이나 운동 한 세트만 완료해도 유지됩니다."}</small>
            </div>
            <div className="week-dots">{weekly.map((item) => <div key={item.key} className={item.done ? "done" : item.key === today ? "today" : ""}><i>{item.done ? "✓" : ""}</i><span>{item.label}</span></div>)}</div>
            <div className="streak-side"><span>🧊 보호권 {freezePasses}개</span><button onClick={() => { setTab("today"); document.getElementById("weight")?.focus(); }}>{todayComplete ? "연속 기록 안전" : "체중 기록으로 지키기"}</button></div>
          </section>

          <section className="milestone-strip">{MILESTONES.map((m, index) => <article className={index === stageIndex ? "milestone active" : index < stageIndex ? "milestone done" : "milestone"} key={m.name}><div className="milestone-num">0{index + 1}</div><div><span>{m.range}</span><strong>{m.name}</strong><small>{m.target}</small></div>{index === stageIndex && <i>NOW</i>}</article>)}</section>

          <section className="dashboard-grid">
            <article className={`coach-card coach-${coach.persona.toLowerCase()}`}><div className="coach-badge">{coach.persona}</div><div><p>{coach.persona === "T" ? "오늘의 팩트 코치" : "오늘의 마음 코치"}</p><h2>{coach.line}</h2></div><span className="quote-mark">”</span></article>

            <article className="weight-card card">
              <div className="card-heading"><div><p className="section-label">WEIGHT TREND</p><h2>숫자보다 <em>7일의 흐름</em></h2></div><div className="weight-stat"><strong>{currentWeight.toFixed(1)}</strong><span>kg</span><small>{change.toFixed(1)}kg</small></div></div>
              <div className="chart"><div className="average-line" style={{ bottom: `${((sevenDayAverage - chartMin) / (chartMax - chartMin)) * 100}%` }}><span>7회 평균 {sevenDayAverage.toFixed(1)}</span></div>{chartData.map((entry) => { const height = 18 + ((entry.weight - chartMin) / (chartMax - chartMin)) * 68; return <div className="chart-column" key={entry.day}><span className="bar-value">{entry.weight.toFixed(1)}</span><div className={entry.day === day ? "bar active" : "bar"} style={{ height: `${height}%` }} /><small>D{entry.day}</small></div>; })}</div>
              <form className="weight-form" onSubmit={saveWeight}><label htmlFor="weight">아침 공복 체중</label><div className="input-shell"><input id="weight" inputMode="decimal" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} /><span>kg</span></div><button type="submit">오늘 기록하기 <span>→</span></button></form>
              <p className="tiny-note">기록하는 순간 오늘의 연속 기록도 지켜집니다.</p>
            </article>

            <article className="mission-card card"><div className="card-heading compact"><div><p className="section-label">THIS STAGE</p><h2>{MILESTONES[stageIndex].name} 미션</h2></div><span className="stage-pill">{stageIndex + 1} / 4</span></div><div className="mission-main"><span>핵심 미션</span><strong>{MILESTONES[stageIndex].mission}</strong></div><ul className="principles"><li><i>01</i><span><b>평소 식사의 70—80%</b>극단적인 다이어트식은 필요 없어요.</span></li><li><i>02</i><span><b>밥은 1/2—2/3공기</b>반찬은 평소처럼, 탄수화물만 조절해요.</span></li><li><i>03</i><span><b>마실 것은 가볍게</b>물 · 아메리카노 · 무칼로리 음료.</span></li></ul></article>

            <article className="defense-card card"><div><p className="section-label">QUICK DEFENSE</p><h2>위기 전에 한 번만 눌러요</h2></div><div className="defense-actions"><button onClick={() => openCoach("외식 · 회식 방어", "술을 마신다면 밥(탄수화물)을 가장 먼저 치우세요.", "회식 한 번으로 계획은 무너지지 않아요. 술과 밥을 같이 먹지 않는 것만 기억해요.")}><span>酒</span><b>외식 / 회식</b><small>가기 전 체크</small></button><button onClick={() => openCoach("간식 교체", "미숫가루 같은 고농축 액상 탄수화물은 포만감은 짧고 에너지 밀도는 높습니다.", "삶은 달걀이나 사과처럼 씹는 간식 하나로 방향만 바꿔봐요.")}><span>!</span><b>나쁜 간식</b><small>미숫가루 등</small></button></div></article>
          </section>
        </>}

        {tab === "workout" && <section className="workout-page page-panel">
          <div className="page-title-row"><div><p className="kicker">WEEKLY 3-SPLIT · 6 DAYS</p><h1>오늘의 60분</h1><p>이전 중량을 그대로 불러옵니다. ±5kg로 조절하고 완료하면 자동 저장돼요.</p></div><div className="workout-day"><span>CYCLE</span><strong>{cycleDay}</strong><small>/ 6</small></div></div>
          <div className="routine-head"><div><span>{painMode ? "PAIN-SAFE ROUTINE" : `DAY ${cycleDay}`}</span><h2>{painMode ? "무릎 부담 없는 루틴" : routineLabel}</h2></div><button className={painMode ? "pain-button active" : "pain-button"} onClick={() => setPainMode((v) => !v)}><span>＋</span>{painMode ? "통증 모드 끄기" : "무릎 통증"}</button></div>
          {painMode && <div className="pain-notice"><b>체중이 실리는 동작을 뺐어요.</b><span>앉아서 하는 기구와 코어 위주로 편안하게 진행하세요.</span></div>}
          <div className="routine-list">
            <p className="list-title"><span>STRENGTH</span><b>{exercises.length}개 필수 동작 · 동작명을 누르면 자세 보기</b></p>
            {exercises.map((exercise, index) => { const key = `${day}-${painMode ? "pain" : "normal"}-${exercise.name}`; return <ExerciseRow key={exercise.name} index={index + 1} exercise={exercise} checked={Boolean(checks[key])} kg={exercise.weighted ? currentLoad(exercise.name) : null} onAdjust={(delta) => adjustLoad(exercise.name, delta)} onToggle={() => toggleCheck(exercise)} onGuide={EXERCISE_GUIDES[exercise.name] ? () => { setGuideView("photo"); setSelectedGuide(exercise.name); } : undefined} />; })}
            <p className="list-title cardio-title"><span>CARDIO</span><b>{painMode ? "저충격" : "30분"}</b></p>
            {cardio.map((exercise, index) => { const key = `${day}-${painMode ? "pain" : "normal"}-${exercise.name}`; return <ExerciseRow key={exercise.name} index={exercises.length + index + 1} exercise={exercise} checked={Boolean(checks[key])} kg={null} onAdjust={() => {}} onToggle={() => toggleCheck(exercise)} onGuide={EXERCISE_GUIDES[exercise.name] ? () => { setGuideView("photo"); setSelectedGuide(exercise.name); } : undefined} />; })}
            <p className="list-title optional-title"><span>OPTIONAL · 선택 운동</span><b>여유가 있는 날만 추가</b></p>
            <div className="optional-note">필수 운동을 끝낸 뒤 1—2개만 골라 가볍게 수행하세요.</div>
            {optionalExercises.map((exercise, index) => { const key = `${day}-${painMode ? "pain" : "normal"}-${exercise.name}`; return <ExerciseRow key={exercise.name} index={index + 1} exercise={exercise} checked={Boolean(checks[key])} kg={exercise.weighted ? currentLoad(exercise.name) : null} onAdjust={(delta) => adjustLoad(exercise.name, delta)} onToggle={() => toggleCheck(exercise)} onGuide={EXERCISE_GUIDES[exercise.name] ? () => { setGuideView("photo"); setSelectedGuide(exercise.name); } : undefined} optional />; })}
          </div>
          <div className="workout-footer"><div><strong>{completed}</strong><span>/ {allItems.length} 완료</span></div><div className="completion-track"><i style={{ width: `${completed / allItems.length * 100}%` }} /></div><button disabled={completed !== allItems.length} onClick={() => openCoach("운동 완료", "오늘 계획한 근력과 유산소를 모두 수행했습니다.", "오늘 60분을 끝냈어요. 아주 좋은 반복이에요.")}>{completed === allItems.length ? "운동 완료 · 코칭 받기" : `${allItems.length - completed}개 더 체크하세요`}</button></div>
        </section>}

        {tab === "records" && <section className="records-page page-panel">
          <div className="page-title-row"><div><p className="kicker">MY 50-DAY LOG</p><h1>쌓인 기록</h1><p>체중의 방향과 기구 중량의 성장을 함께 확인하세요.</p></div><div className="record-summary"><span>누적 변화</span><strong>{change.toFixed(1)}<small>kg</small></strong></div></div>
          <div className="record-grid"><article className="record-table card"><div className="card-heading compact"><div><p className="section-label">WEIGHT LOG</p><h2>체중 기록</h2></div><span className="stage-pill">{weights.length}회</span></div><div className="table-head"><span>일차</span><span>체중</span><span>시작 대비</span></div>{[...weights].reverse().map((entry) => <div className="table-row" key={entry.day}><span>DAY {entry.day}</span><strong>{entry.weight.toFixed(1)} kg</strong><em>{(entry.weight - 74).toFixed(1)} kg</em></div>)}</article>
            <article className="rules-card card"><p className="section-label">STREAK SYSTEM</p><h2>연속성을 만드는 장치</h2><ol><li><span>🔥</span><div><b>{streak}일 연속 기록</b><p>하루 하나의 행동이면 불꽃이 이어집니다.</p></div></li><li><span>🧊</span><div><b>보호권 {freezePasses}개</b><p>딱 하루 놓치면 자동으로 연속 기록을 보호합니다.</p></div></li><li><span>✓</span><div><b>작게 시작하기</b><p>체중 기록이나 운동 한 세트만 해도 오늘은 성공.</p></div></li></ol></article>
            <article className="record-chart-card card"><div className="card-heading compact"><div><p className="section-label">WEIGHT GRAPH</p><h2>최근 체중 추세</h2></div><span className="stage-pill">최근 {recordChart.length}회</span></div><div className="record-chart-summary"><div><span>현재</span><strong>{currentWeight.toFixed(1)}kg</strong></div><div><span>7회 평균</span><strong>{sevenDayAverage.toFixed(1)}kg</strong></div><div><span>목표 구간</span><strong>68—70kg</strong></div></div><div className="record-chart" aria-label="최근 체중 변화 그래프"><div className="target-band"><span>목표 68—70kg</span></div>{recordChart.map((entry, index) => { const bottom = ((entry.weight - recordMin) / (recordMax - recordMin)) * 100; const next = recordChart[index + 1]; const nextBottom = next ? ((next.weight - recordMin) / (recordMax - recordMin)) * 100 : bottom; const dx = 100 / Math.max(1, recordChart.length - 1); const dy = nextBottom - bottom; return <div className="record-point-wrap" key={entry.day} style={{ left: `${index * dx}%`, bottom: `${bottom}%` }}><i className="record-point" /><b>{entry.weight.toFixed(1)}</b><small>D{entry.day}</small>{next && <span className="record-line" style={{ width: `calc(${dx} * 1%)`, transform: `rotate(${-Math.atan2(dy, dx) * 180 / Math.PI}deg)`, transformOrigin: "left center" }} />}</div>; })}</div><p className="chart-footnote">하루 수치보다 같은 조건에서 쌓인 흐름을 보세요.</p></article>
            <article className="load-progress card"><div className="card-heading compact"><div><p className="section-label">STRENGTH PROGRESS</p><h2>들어 올린 무게의 성장</h2></div><span className="stage-pill">{loadHistory.length}세트 기록</span></div>{progressRows.length === 0 ? <div className="empty-progress"><strong>첫 중량을 기다리고 있어요.</strong><span>운동 탭에서 중량을 맞춘 뒤 완료 체크하면 여기에 성장 기록이 쌓입니다.</span></div> : <div className="load-table"><div className="load-head"><span>운동</span><span>첫 기록</span><span>최근</span><span>증가</span></div>{progressRows.map((row) => <div className="load-row" key={row.name}><b>{row.name}</b><span>{row.first}kg</span><strong>{row.latest}kg</strong><em>+{((row.latest ?? 0) - (row.first ?? 0)).toFixed(0)}kg</em></div>)}</div>}</article>
            <article className="body-composition card">
              <div className="card-heading compact"><div><p className="section-label">WEEKLY BODY CHECK</p><h2>주 1회 체성분 기록</h2></div><span className="stage-pill">BMI 자동 계산</span></div>
              <div className="body-layout">
                <form className="body-form" onSubmit={saveBodyStat}>
                  <label><span>체중</span><div><input inputMode="decimal" value={bodyForm.weight} onChange={(e) => setBodyForm((v) => ({ ...v, weight: e.target.value }))} /><b>kg</b></div></label>
                  <label><span>근육량</span><div><input inputMode="decimal" value={bodyForm.muscle} onChange={(e) => setBodyForm((v) => ({ ...v, muscle: e.target.value }))} /><b>kg</b></div></label>
                  <label><span>체지방률</span><div><input inputMode="decimal" value={bodyForm.bodyFat} onChange={(e) => setBodyForm((v) => ({ ...v, bodyFat: e.target.value }))} /><b>%</b></div></label>
                  <div className="bmi-preview"><span>172cm 기준 BMI</span><strong>{Number.isFinite(bodyBmi) ? bodyBmi.toFixed(1) : "—"}</strong><small>체중으로 자동 계산</small></div>
                  <button type="submit">이번 주 기록 저장 <span>→</span></button>
                </form>
                <div className="body-history">
                  <div className="body-head"><span>측정일</span><span>체중</span><span>근육</span><span>체지방</span><span>BMI</span></div>
                  {bodyStats.length === 0 ? <div className="body-empty">아직 주간 기록이 없어요. 같은 요일·비슷한 조건으로 측정해 보세요.</div> : [...bodyStats].reverse().map((entry) => <div className="body-row" key={entry.date}><b>{entry.date.slice(5).replace("-", ".")}</b><span>{entry.weight.toFixed(1)}kg</span><span>{entry.muscle.toFixed(1)}kg</span><span>{entry.bodyFat.toFixed(1)}%</span><strong>{entry.bmi.toFixed(1)}</strong></div>)}
                </div>
              </div>
            </article>
          </div>
        </section>}
      </section>

      <nav className="bottom-nav" aria-label="주 메뉴"><button className={tab === "today" ? "active" : ""} onClick={() => setTab("today")}><span className="nav-icon">●</span><b>오늘</b></button><button className={tab === "workout" ? "active" : ""} onClick={() => setTab("workout")}><span className="nav-icon">＋</span><b>운동</b>{completed > 0 && <i>{completed}</i>}</button><button className={tab === "records" ? "active" : ""} onClick={() => setTab("records")}><span className="nav-icon">▥</span><b>기록</b></button></nav>

      {guide && selectedGuide && <div className="guide-backdrop" onMouseDown={() => setSelectedGuide(null)}><section className="guide-modal" role="dialog" aria-modal="true" aria-labelledby="guide-title" onMouseDown={(e) => e.stopPropagation()}><button className="guide-close" onClick={() => setSelectedGuide(null)} aria-label="자세 가이드 닫기">×</button><div className="guide-heading"><div><p>FORM GUIDE · {guide.focus}</p><h2 id="guide-title">{selectedGuide} 올바른 순서</h2></div><span>{guide.program ? "15 MIN" : "4 × 15"}</span></div><div className="guide-tabs" role="tablist"><button className={guideView === "photo" ? "active" : ""} onClick={() => setGuideView("photo")}>단계별 사진</button><button className={guideView === "motion" ? "active" : ""} onClick={() => setGuideView("motion")}>동작 영상</button></div>{guideView === "photo" ? <img className="guide-media" src={guide.image} alt={`${selectedGuide} 시작, 동작, 마무리 자세 순서`} /> : <div className="motion-player"><img src={guide.motion} alt={`${selectedGuide} 동작 영상 미리보기`} /><span>동작 영상 · 자동 반복</span></div>}{guide.program && <div className="guide-program">{guide.program.map((item, index) => <div key={item.time}><b>{String(index + 1).padStart(2, "0")}</b><span>{item.time}</span><strong>{item.target}</strong></div>)}</div>}<ol>{guide.steps.map((step, index) => <li key={step}><b>0{index + 1}</b><span>{step}</span></li>)}</ol><div className="guide-caution"><strong>!</strong><span><b>안전 체크</b>{guide.caution}</span></div><button className="guide-confirm" onClick={() => setSelectedGuide(null)}>자세 확인했어요</button></section></div>}

      {dailyOpen && <div className="daily-backdrop"><section className="daily-card" style={{ backgroundImage: `linear-gradient(90deg, rgba(10,17,31,.94), rgba(10,17,31,.18)), url(${daily.image})` }} role="dialog" aria-modal="true" aria-labelledby="daily-title"><div className="daily-top"><div className="daily-streak">🔥 {streak}일 연속</div><div className={`daily-mascot ${mascot.state}`} role="img" aria-label={`${mascot.label} 호랑이 코치`} /></div><div className="daily-content"><p>DAY {day} · {mascot.label}의 한 문장</p><h2 id="daily-title">{daily.quote}</h2><span>{todayComplete ? "오늘의 불꽃은 안전해요. 내일도 다시 만나요!" : mascot.message}</span><button onClick={closeDaily}>오늘도 이어가기 <b>→</b></button><small>오늘 기록하지 않으면 연속 {streak}일을 잃게 돼요.</small></div></section></div>}

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
