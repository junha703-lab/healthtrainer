"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Tab = "today" | "workout" | "records";
type Persona = "T" | "F";
type WeightEntry = { day: number; weight: number };
type LoadEntry = { day: number; name: string; kg: number };
type Exercise = { name: string; detail: string; weighted?: boolean };

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
    { name: "벤치프레스", detail: "4세트 × 8—12회", weighted: true },
    { name: "숄더프레스", detail: "4세트 × 8—12회", weighted: true },
  ],
  pull: [
    { name: "랫풀다운", detail: "4세트 × 10—12회", weighted: true },
    { name: "시티드 로우", detail: "4세트 × 10—12회", weighted: true },
    { name: "코어 슈퍼세트", detail: "크런치 15회 + 플랭크 30초 × 3" },
  ],
  legs: [
    { name: "레그프레스", detail: "4세트 × 10—15회", weighted: true },
    { name: "레그익스텐션", detail: "3세트 × 12—15회", weighted: true },
    { name: "레그컬", detail: "3세트 × 12—15회", weighted: true },
  ],
  pain: [
    { name: "시티드 로우", detail: "등받이에 기대어 4세트", weighted: true },
    { name: "랫풀다운", detail: "반동 없이 4세트", weighted: true },
    { name: "좌식 사이클", detail: "편안한 강도로 20분" },
    { name: "크런치", detail: "15회 × 3세트" },
  ],
};

const DEFAULT_LOADS: Record<string, number> = {
  벤치프레스: 40, 숄더프레스: 20, 랫풀다운: 40, "시티드 로우": 35,
  레그프레스: 80, 레그익스텐션: 25, 레그컬: 25,
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
    setHydrated(true);
  }, [today]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ day, weights, travelMode, checks, nextPersona, loadHistory, loadInputs, streak, freezePasses, activeDates }));
  }, [day, weights, travelMode, checks, nextPersona, loadHistory, loadInputs, streak, freezePasses, activeDates, hydrated]);

  const stageIndex = stageForDay(day);
  const currentWeight = weights.at(-1)?.weight ?? 74;
  const recent = weights.slice(-7);
  const sevenDayAverage = recent.reduce((sum, item) => sum + item.weight, 0) / recent.length;
  const change = currentWeight - 74;
  const cycleDay = ((day - 1) % 6) + 1;
  const routineKind = cycleDay === 1 || cycleDay === 4 ? "push" : cycleDay === 2 || cycleDay === 5 ? "pull" : "legs";
  const routineLabel = routineKind === "push" ? "가슴 / 어깨" : routineKind === "pull" ? "등 / 코어" : "하체";
  const exercises = painMode ? ROUTINES.pain : ROUTINES[routineKind];
  const cardio: Exercise[] = painMode
    ? [{ name: "좌식 사이클", detail: "20분 · 통증 없는 강도" }]
    : [{ name: "천국의 계단", detail: "15분" }, { name: "런닝머신 걷기", detail: "15분" }];
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
            <div className="streak-flame">🔥</div>
            <div className="streak-copy">
              <p>연속 기록</p>
              <h2>{todayComplete ? `오늘도 지켰어요. ${streak}일 연속!` : `오늘 기록하지 않으면 연속 ${streak}일을 잃게 돼요.`}</h2>
              <span>{todayComplete ? "작은 행동 하나가 오늘의 불꽃을 지켰습니다." : "체중 기록이나 운동 한 세트만 완료해도 유지됩니다."}</span>
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
          <div className="routine-list"><p className="list-title"><span>STRENGTH</span><b>{exercises.length}개 동작</b></p>{exercises.map((exercise, index) => { const key = `${day}-${painMode ? "pain" : "normal"}-${exercise.name}`; return <ExerciseRow key={exercise.name} index={index + 1} exercise={exercise} checked={Boolean(checks[key])} kg={exercise.weighted ? currentLoad(exercise.name) : null} onAdjust={(delta) => adjustLoad(exercise.name, delta)} onToggle={() => toggleCheck(exercise)} />; })}<p className="list-title cardio-title"><span>CARDIO</span><b>{painMode ? "저충격" : "30분"}</b></p>{cardio.map((exercise, index) => { const key = `${day}-${painMode ? "pain" : "normal"}-${exercise.name}`; return <ExerciseRow key={exercise.name} index={exercises.length + index + 1} exercise={exercise} checked={Boolean(checks[key])} kg={null} onAdjust={() => {}} onToggle={() => toggleCheck(exercise)} />; })}</div>
          <div className="workout-footer"><div><strong>{completed}</strong><span>/ {allItems.length} 완료</span></div><div className="completion-track"><i style={{ width: `${completed / allItems.length * 100}%` }} /></div><button disabled={completed !== allItems.length} onClick={() => openCoach("운동 완료", "오늘 계획한 근력과 유산소를 모두 수행했습니다.", "오늘 60분을 끝냈어요. 아주 좋은 반복이에요.")}>{completed === allItems.length ? "운동 완료 · 코칭 받기" : `${allItems.length - completed}개 더 체크하세요`}</button></div>
        </section>}

        {tab === "records" && <section className="records-page page-panel">
          <div className="page-title-row"><div><p className="kicker">MY 50-DAY LOG</p><h1>쌓인 기록</h1><p>체중의 방향과 기구 중량의 성장을 함께 확인하세요.</p></div><div className="record-summary"><span>누적 변화</span><strong>{change.toFixed(1)}<small>kg</small></strong></div></div>
          <div className="record-grid"><article className="record-table card"><div className="card-heading compact"><div><p className="section-label">WEIGHT LOG</p><h2>체중 기록</h2></div><span className="stage-pill">{weights.length}회</span></div><div className="table-head"><span>일차</span><span>체중</span><span>시작 대비</span></div>{[...weights].reverse().map((entry) => <div className="table-row" key={entry.day}><span>DAY {entry.day}</span><strong>{entry.weight.toFixed(1)} kg</strong><em>{(entry.weight - 74).toFixed(1)} kg</em></div>)}</article>
            <article className="rules-card card"><p className="section-label">STREAK SYSTEM</p><h2>연속성을 만드는 장치</h2><ol><li><span>🔥</span><div><b>{streak}일 연속 기록</b><p>하루 하나의 행동이면 불꽃이 이어집니다.</p></div></li><li><span>🧊</span><div><b>보호권 {freezePasses}개</b><p>딱 하루 놓치면 자동으로 연속 기록을 보호합니다.</p></div></li><li><span>✓</span><div><b>작게 시작하기</b><p>체중 기록이나 운동 한 세트만 해도 오늘은 성공.</p></div></li></ol></article>
            <article className="load-progress card"><div className="card-heading compact"><div><p className="section-label">STRENGTH PROGRESS</p><h2>들어 올린 무게의 성장</h2></div><span className="stage-pill">{loadHistory.length}세트 기록</span></div>{progressRows.length === 0 ? <div className="empty-progress"><strong>첫 중량을 기다리고 있어요.</strong><span>운동 탭에서 중량을 맞춘 뒤 완료 체크하면 여기에 성장 기록이 쌓입니다.</span></div> : <div className="load-table"><div className="load-head"><span>운동</span><span>첫 기록</span><span>최근</span><span>증가</span></div>{progressRows.map((row) => <div className="load-row" key={row.name}><b>{row.name}</b><span>{row.first}kg</span><strong>{row.latest}kg</strong><em>+{((row.latest ?? 0) - (row.first ?? 0)).toFixed(0)}kg</em></div>)}</div>}</article>
          </div>
        </section>}
      </section>

      <nav className="bottom-nav" aria-label="주 메뉴"><button className={tab === "today" ? "active" : ""} onClick={() => setTab("today")}><span className="nav-icon">●</span><b>오늘</b></button><button className={tab === "workout" ? "active" : ""} onClick={() => setTab("workout")}><span className="nav-icon">＋</span><b>운동</b>{completed > 0 && <i>{completed}</i>}</button><button className={tab === "records" ? "active" : ""} onClick={() => setTab("records")}><span className="nav-icon">▥</span><b>기록</b></button></nav>

      {dailyOpen && <div className="daily-backdrop"><section className="daily-card" style={{ backgroundImage: `linear-gradient(90deg, rgba(10,17,31,.94), rgba(10,17,31,.18)), url(${daily.image})` }} role="dialog" aria-modal="true" aria-labelledby="daily-title"><div className="daily-streak">🔥 {streak}일 연속</div><div className="daily-content"><p>DAY {day} · 오늘의 한 문장</p><h2 id="daily-title">{daily.quote}</h2><span>{daily.cue}</span><button onClick={closeDaily}>오늘도 이어가기 <b>→</b></button><small>오늘 기록하지 않으면 연속 {streak}일을 잃게 돼요.</small></div></section></div>}

      {modal && <div className="modal-backdrop" role="presentation" onMouseDown={() => setModal(null)}><section className={`coach-modal modal-${modal.persona.toLowerCase()}`} role="dialog" aria-modal="true" aria-labelledby="coach-title" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setModal(null)} aria-label="코칭 닫기">×</button><div className="modal-persona">{modal.persona}</div><p>{modal.eyebrow}</p><h2 id="coach-title">{modal.title}</h2><blockquote>{modal.body}</blockquote><button className="modal-confirm" onClick={() => setModal(null)}>좋아요, 그렇게 할게요</button></section></div>}
    </main>
  );
}

function ExerciseRow({ index, exercise, checked, kg, onAdjust, onToggle }: { index: number; exercise: Exercise; checked: boolean; kg: number | null; onAdjust: (delta: number) => void; onToggle: () => void }) {
  return <div className={checked ? "exercise-row checked" : "exercise-row"}>
    <span className="exercise-index">{String(index).padStart(2, "0")}</span>
    <span className="exercise-copy"><b>{exercise.name}</b><small>{exercise.detail}</small>{kg !== null && <em>완료하면 {kg}kg로 기록</em>}</span>
    {kg !== null && <div className="load-stepper" aria-label={`${exercise.name} 중량`}><button onClick={() => onAdjust(-5)} aria-label="5kg 줄이기">−</button><strong>{kg}<small>kg</small></strong><button onClick={() => onAdjust(5)} aria-label="5kg 늘리기">＋</button></div>}
    <button className="check-circle" onClick={onToggle} aria-pressed={checked} aria-label={`${exercise.name} 완료`}>{checked ? "✓" : ""}</button>
  </div>;
}
