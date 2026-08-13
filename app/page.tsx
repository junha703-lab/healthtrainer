"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Tab = "today" | "workout" | "records";
type Persona = "T" | "F";
type WeightEntry = { day: number; weight: number };

const INITIAL_WEIGHTS: WeightEntry[] = [
  { day: 1, weight: 74 },
  { day: 3, weight: 73.7 },
  { day: 5, weight: 73.5 },
  { day: 7, weight: 73.1 },
  { day: 9, weight: 72.9 },
  { day: 11, weight: 72.7 },
  { day: 13, weight: 72.5 },
  { day: 15, weight: 72.2 },
  { day: 17, weight: 72 },
  { day: 18, weight: 71.8 },
];

const MILESTONES = [
  { range: "DAY 1—10", name: "적응기", target: "73kg 전후", mission: "식사량 80% · 야식 줄이기" },
  { range: "DAY 11—30", name: "본격 감량기", target: "71kg 전후", mission: "밥 1/2—2/3공기" },
  { range: "DAY 31—40", name: "정체기 관리", target: "70kg 전후", mission: "저녁 밥 조금 더 줄이기" },
  { range: "DAY 41—50", name: "마무리", target: "68—70kg", mission: "술·야식·간식 최소화" },
];

const ROUTINES = {
  push: [
    ["벤치프레스", "4세트 × 8—12회"],
    ["숄더프레스", "4세트 × 8—12회"],
  ],
  pull: [
    ["랫풀다운", "4세트 × 10—12회"],
    ["시티드 로우", "4세트 × 10—12회"],
    ["코어 슈퍼세트", "크런치 15회 + 플랭크 30초 × 3"],
  ],
  legs: [
    ["레그프레스", "4세트 × 10—15회"],
    ["레그익스텐션", "3세트 × 12—15회"],
    ["레그컬", "3세트 × 12—15회"],
  ],
  pain: [
    ["시티드 로우", "등받이에 기대어 4세트"],
    ["랫풀다운", "반동 없이 4세트"],
    ["좌식 사이클", "편안한 강도로 20분"],
    ["크런치", "15회 × 3세트"],
  ],
};

const STORAGE_KEY = "pace50-state-v1";

function stageForDay(day: number) {
  if (day <= 10) return 0;
  if (day <= 30) return 1;
  if (day <= 40) return 2;
  return 3;
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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDay(parsed.day ?? 18);
        setWeights(parsed.weights?.length ? parsed.weights : INITIAL_WEIGHTS);
        setTravelMode(Boolean(parsed.travelMode));
        setChecks(parsed.checks ?? {});
        setNextPersona(parsed.nextPersona ?? "T");
      } catch {
        // Keep the friendly demo defaults if an old local save is malformed.
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ day, weights, travelMode, checks, nextPersona }));
  }, [day, weights, travelMode, checks, nextPersona, hydrated]);

  const stageIndex = stageForDay(day);
  const currentWeight = weights.at(-1)?.weight ?? 74;
  const recent = weights.slice(-7);
  const sevenDayAverage = recent.reduce((sum, item) => sum + item.weight, 0) / recent.length;
  const change = currentWeight - 74;
  const cycleDay = ((day - 1) % 6) + 1;
  const routineKind = cycleDay === 1 || cycleDay === 4 ? "push" : cycleDay === 2 || cycleDay === 5 ? "pull" : "legs";
  const routineLabel = routineKind === "push" ? "가슴 / 어깨" : routineKind === "pull" ? "등 / 코어" : "하체";
  const exercises = painMode ? ROUTINES.pain : ROUTINES[routineKind];
  const cardio = painMode
    ? [["좌식 사이클", "20분 · 통증 없는 강도"]]
    : [["천국의 계단", "15분"], ["런닝머신 걷기", "15분"]];
  const allItems = [...exercises, ...cardio];
  const completed = allItems.filter(([name]) => checks[`${day}-${painMode ? "pain" : "normal"}-${name}`]).length;
  const chartData = weights.slice(-7);
  const chartMin = Math.min(...chartData.map((d) => d.weight)) - 0.2;
  const chartMax = Math.max(...chartData.map((d) => d.weight)) + 0.2;

  const coach = useMemo(() => {
    if (travelMode) {
      return { persona: "F" as Persona, line: "여행의 목표는 감량이 아니라 유지예요. 한 끼에 즐거움 하나면 충분해요." };
    }
    if (stageIndex === 0) return { persona: "F" as Persona, line: "완벽한 식단보다 평소 양의 80%. 오늘도 오래 갈 수 있는 선택을 해요." };
    if (stageIndex === 1) return { persona: "T" as Persona, line: `현재 7회 평균 ${sevenDayAverage.toFixed(1)}kg. 하루 숫자보다 추세가 정확합니다.` };
    if (stageIndex === 2) return { persona: "T" as Persona, line: "정체는 실패가 아니라 적응 신호입니다. 저녁 밥만 한두 숟갈 줄여보세요." };
    return { persona: "F" as Persona, line: "마지막까지 굶지 않기. 가볍게, 평소처럼, 끝까지 가면 됩니다." };
  }, [stageIndex, sevenDayAverage, travelMode]);

  function openCoach(eyebrow: string, tCopy: string, fCopy: string) {
    const persona = nextPersona;
    setModal({
      persona,
      eyebrow,
      title: persona === "T" ? "팩트로 중심 잡기" : "마음부터 가볍게",
      body: persona === "T" ? tCopy : fCopy,
    });
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

    if (previous && value - previous >= 1) {
      setModal({
        persona: "T",
        eyebrow: "+1kg 감지",
        title: "이건 ‘가짜 몸무게’일 가능성이 커요",
        body: "수분과 염분에 의한 일시적 변화이므로 굶거나 과도한 보상 운동을 하지 마세요.",
      });
    } else {
      openCoach("아침 체중 기록 완료", `기록은 ${value.toFixed(1)}kg, 최근 평균은 ${sevenDayAverage.toFixed(1)}kg입니다. 같은 조건의 기록이 추세를 만듭니다.`, "숫자를 피하지 않고 기록한 것만으로 오늘의 첫 미션은 성공이에요.");
    }
  }

  function toggleCheck(name: string) {
    const key = `${day}-${painMode ? "pain" : "normal"}-${name}`;
    setChecks((items) => ({ ...items, [key]: !items[key] }));
  }

  return (
    <main className={travelMode ? "app travel-on" : "app"}>
      {travelMode && (
        <div className="travel-banner" role="status">
          <span>여행 모드 · 오늘의 목표는 유지</span>
          <strong>한 끼에 즐거움 하나</strong>
        </div>
      )}

      <header className="topbar">
        <a className="brand" href="#top" aria-label="50일 페이스메이커 홈">
          <span className="brand-mark">50</span>
          <span>PACE<br />MAKER</span>
        </a>
        <div className="header-actions">
          <label className="travel-switch">
            <input type="checkbox" checked={travelMode} onChange={(event) => setTravelMode(event.target.checked)} />
            <span aria-hidden="true" />
            여행
          </label>
          <button className="avatar" aria-label="프로필">K</button>
        </div>
      </header>

      <section className="content" id="top">
        {tab === "today" && (
          <>
            <section className="hero-card">
              <div className="hero-copy">
                <p className="kicker">50일 프로젝트 · 시작 74.0kg</p>
                <h1>오늘도 무리 없이,<br /><em>정확히 한 걸음.</em></h1>
                <div className="day-control" aria-label="프로젝트 일차 조정">
                  <button onClick={() => setDay((value) => Math.max(1, value - 1))} aria-label="이전 일차">−</button>
                  <span><b>DAY {day}</b><small> / 50</small></span>
                  <button onClick={() => setDay((value) => Math.min(50, value + 1))} aria-label="다음 일차">＋</button>
                </div>
              </div>
              <div className="progress-orbit" style={{ "--progress": `${Math.round((day / 50) * 100) * 3.6}deg` } as React.CSSProperties}>
                <div><strong>{Math.round((day / 50) * 100)}%</strong><span>완주까지<br />{50 - day}일</span></div>
              </div>
            </section>

            <section className="milestone-strip" aria-label="50일 마일스톤">
              {MILESTONES.map((milestone, index) => (
                <article className={index === stageIndex ? "milestone active" : index < stageIndex ? "milestone done" : "milestone"} key={milestone.name}>
                  <div className="milestone-num">0{index + 1}</div>
                  <div><span>{milestone.range}</span><strong>{milestone.name}</strong><small>{milestone.target}</small></div>
                  {index === stageIndex && <i>NOW</i>}
                </article>
              ))}
            </section>

            <section className="dashboard-grid">
              <article className={`coach-card coach-${coach.persona.toLowerCase()}`}>
                <div className="coach-badge">{coach.persona}</div>
                <div>
                  <p>{coach.persona === "T" ? "오늘의 팩트 코치" : "오늘의 마음 코치"}</p>
                  <h2>{coach.line}</h2>
                </div>
                <span className="quote-mark">”</span>
              </article>

              <article className="weight-card card">
                <div className="card-heading">
                  <div><p className="section-label">WEIGHT TREND</p><h2>숫자보다 <em>7일의 흐름</em></h2></div>
                  <div className="weight-stat"><strong>{currentWeight.toFixed(1)}</strong><span>kg</span><small>{change.toFixed(1)}kg</small></div>
                </div>

                <div className="chart" aria-label="최근 체중 기록 막대 그래프">
                  <div className="average-line" style={{ bottom: `${((sevenDayAverage - chartMin) / (chartMax - chartMin)) * 100}%` }}><span>7회 평균 {sevenDayAverage.toFixed(1)}</span></div>
                  {chartData.map((entry) => {
                    const height = 18 + ((entry.weight - chartMin) / (chartMax - chartMin)) * 68;
                    return (
                      <div className="chart-column" key={entry.day}>
                        <span className="bar-value">{entry.weight.toFixed(1)}</span>
                        <div className={entry.day === day ? "bar active" : "bar"} style={{ height: `${height}%` }} />
                        <small>D{entry.day}</small>
                      </div>
                    );
                  })}
                </div>

                <form className="weight-form" onSubmit={saveWeight}>
                  <label htmlFor="weight">아침 공복 체중</label>
                  <div className="input-shell"><input id="weight" inputMode="decimal" value={weightInput} onChange={(event) => setWeightInput(event.target.value)} aria-label="오늘 체중" /><span>kg</span></div>
                  <button type="submit">오늘 기록하기 <span>→</span></button>
                </form>
                <p className="tiny-note">매일 아침, 식사 전 비슷한 조건에서 기록해요.</p>
              </article>

              <article className="mission-card card">
                <div className="card-heading compact"><div><p className="section-label">THIS STAGE</p><h2>{MILESTONES[stageIndex].name} 미션</h2></div><span className="stage-pill">{stageIndex + 1} / 4</span></div>
                <div className="mission-main"><span>핵심 미션</span><strong>{MILESTONES[stageIndex].mission}</strong></div>
                <ul className="principles">
                  <li><i>01</i><span><b>평소 식사의 70—80%</b>극단적인 다이어트식은 필요 없어요.</span></li>
                  <li><i>02</i><span><b>밥은 1/2—2/3공기</b>반찬은 평소처럼, 탄수화물만 조절해요.</span></li>
                  <li><i>03</i><span><b>마실 것은 가볍게</b>물 · 아메리카노 · 무칼로리 음료.</span></li>
                </ul>
              </article>

              <article className="defense-card card">
                <div><p className="section-label">QUICK DEFENSE</p><h2>위기 전에 한 번만 눌러요</h2></div>
                <div className="defense-actions">
                  <button onClick={() => openCoach("외식 · 회식 방어", "술을 마신다면 밥(탄수화물)을 가장 먼저 치우세요.", "회식 한 번으로 계획은 무너지지 않아요. 술과 밥을 같이 먹지 않는 것만 기억해요.")}><span>酒</span><b>외식 / 회식</b><small>가기 전 체크</small></button>
                  <button onClick={() => openCoach("간식 교체", "미숫가루 같은 고농축 액상 탄수화물은 포만감은 짧고 에너지 밀도는 높습니다. 씹어 먹는 간식으로 바꾸세요.", "마시고 싶었던 마음은 괜찮아요. 삶은 달걀이나 사과처럼 씹는 간식 하나로 방향만 바꿔봐요.")}><span>!</span><b>나쁜 간식</b><small>미숫가루 등</small></button>
                </div>
              </article>
            </section>
          </>
        )}

        {tab === "workout" && (
          <section className="workout-page page-panel">
            <div className="page-title-row">
              <div><p className="kicker">WEEKLY 3-SPLIT · 6 DAYS</p><h1>오늘의 60분</h1><p>근력 30분 + 유산소 30분. 일요일은 회복합니다.</p></div>
              <div className="workout-day"><span>CYCLE</span><strong>{cycleDay}</strong><small>/ 6</small></div>
            </div>

            <div className="routine-head">
              <div><span>{painMode ? "PAIN-SAFE ROUTINE" : `DAY ${cycleDay}`}</span><h2>{painMode ? "무릎 부담 없는 루틴" : routineLabel}</h2></div>
              <button className={painMode ? "pain-button active" : "pain-button"} onClick={() => setPainMode((value) => !value)}><span>＋</span>{painMode ? "통증 모드 끄기" : "무릎 통증"}</button>
            </div>

            {painMode && <div className="pain-notice"><b>체중이 실리는 동작을 뺐어요.</b><span>앉아서 하는 기구와 코어 위주로 편안하게 진행하세요.</span></div>}

            <div className="routine-list">
              <p className="list-title"><span>STRENGTH</span><b>{exercises.length}개 동작</b></p>
              {exercises.map(([name, detail], index) => {
                const key = `${day}-${painMode ? "pain" : "normal"}-${name}`;
                return <ExerciseRow key={name} index={index + 1} name={name} detail={detail} checked={Boolean(checks[key])} onToggle={() => toggleCheck(name)} />;
              })}
              <p className="list-title cardio-title"><span>CARDIO</span><b>{painMode ? "저충격" : "30분"}</b></p>
              {cardio.map(([name, detail], index) => {
                const key = `${day}-${painMode ? "pain" : "normal"}-${name}`;
                return <ExerciseRow key={name} index={exercises.length + index + 1} name={name} detail={detail} checked={Boolean(checks[key])} onToggle={() => toggleCheck(name)} />;
              })}
            </div>

            <div className="workout-footer">
              <div><strong>{completed}</strong><span>/ {allItems.length} 완료</span></div>
              <div className="completion-track"><i style={{ width: `${(completed / allItems.length) * 100}%` }} /></div>
              <button disabled={completed !== allItems.length} onClick={() => openCoach("운동 완료", "오늘 계획한 근력과 유산소를 모두 수행했습니다. 회복을 위해 수분과 수면을 챙기세요.", "오늘 60분을 끝냈어요. 내일의 나를 가볍게 만드는 아주 좋은 반복이에요.")}>{completed === allItems.length ? "운동 완료 · 코칭 받기" : `${allItems.length - completed}개 더 체크하세요`}</button>
            </div>
          </section>
        )}

        {tab === "records" && (
          <section className="records-page page-panel">
            <div className="page-title-row">
              <div><p className="kicker">MY 50-DAY LOG</p><h1>쌓인 기록</h1><p>하루 숫자가 아니라, 꾸준히 내려가는 방향을 확인하세요.</p></div>
              <div className="record-summary"><span>누적 변화</span><strong>{change.toFixed(1)}<small>kg</small></strong></div>
            </div>

            <div className="record-grid">
              <article className="record-table card">
                <div className="card-heading compact"><div><p className="section-label">WEIGHT LOG</p><h2>체중 기록</h2></div><span className="stage-pill">{weights.length}회</span></div>
                <div className="table-head"><span>일차</span><span>체중</span><span>시작 대비</span></div>
                {[...weights].reverse().map((entry) => (
                  <div className="table-row" key={entry.day}><span>DAY {entry.day}</span><strong>{entry.weight.toFixed(1)} kg</strong><em>{(entry.weight - 74).toFixed(1)} kg</em></div>
                ))}
              </article>

              <article className="rules-card card">
                <p className="section-label">NON-NEGOTIABLES</p><h2>끝까지 지킬 네 가지</h2>
                <ol>
                  <li><span>01</span><div><b>굶지 않기</b><p>과도한 보상 대신 다음 끼니부터 평소대로.</p></div></li>
                  <li><span>02</span><div><b>한 끼 70—80%</b><p>먹는 종류보다 전체 양을 먼저 조절.</p></div></li>
                  <li><span>03</span><div><b>주 6일, 매일 60분</b><p>근력 30분과 유산소 30분.</p></div></li>
                  <li><span>04</span><div><b>7일 평균 보기</b><p>수분과 염분으로 흔들리는 하루 숫자 무시.</p></div></li>
                </ol>
              </article>
            </div>
          </section>
        )}
      </section>

      <nav className="bottom-nav" aria-label="주 메뉴">
        <button className={tab === "today" ? "active" : ""} onClick={() => setTab("today")}><span className="nav-icon">●</span><b>오늘</b></button>
        <button className={tab === "workout" ? "active" : ""} onClick={() => setTab("workout")}><span className="nav-icon">＋</span><b>운동</b>{completed > 0 && <i>{completed}</i>}</button>
        <button className={tab === "records" ? "active" : ""} onClick={() => setTab("records")}><span className="nav-icon">▥</span><b>기록</b></button>
      </nav>

      {modal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setModal(null)}>
          <section className={`coach-modal modal-${modal.persona.toLowerCase()}`} role="dialog" aria-modal="true" aria-labelledby="coach-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setModal(null)} aria-label="코칭 닫기">×</button>
            <div className="modal-persona">{modal.persona}</div>
            <p>{modal.eyebrow}</p>
            <h2 id="coach-title">{modal.title}</h2>
            <blockquote>{modal.body}</blockquote>
            <button className="modal-confirm" onClick={() => setModal(null)}>좋아요, 그렇게 할게요</button>
          </section>
        </div>
      )}
    </main>
  );
}

function ExerciseRow({ index, name, detail, checked, onToggle }: { index: number; name: string; detail: string; checked: boolean; onToggle: () => void }) {
  return (
    <button className={checked ? "exercise-row checked" : "exercise-row"} onClick={onToggle} aria-pressed={checked}>
      <span className="exercise-index">{String(index).padStart(2, "0")}</span>
      <span className="exercise-copy"><b>{name}</b><small>{detail}</small></span>
      <span className="check-circle">{checked ? "✓" : ""}</span>
    </button>
  );
}
