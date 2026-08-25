import { useState, useEffect, useMemo } from "react";

/* ============ THEME — clean & airy: Apple Health vernacular ============ */
const C = {
  bg: "#F2F2F7",
  card: "#FFFFFF",
  ink: "#1C1C1E",
  sub: "#8E8E93",
  line: "#E5E5EA",
  green: "#34C759",
  greenDark: "#248A3D",
  blue: "#007AFF",
  fill: "#F7F7FA",
  red: "#FF3B30",
};
const font = {
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};
const shadow = "0 1px 3px rgba(0,0,0,0.06)";

/* ============ EXERCISE DATABASE — variants per movement slot, gated by equipment ============ */
const VARIANTS = {
  hpush: [
    { id: "db_bench", name: "Dumbbell Bench Press", eq: ["dumbbells", "bench"] },
    { id: "machine_chest", name: "Machine Chest Press", eq: ["machines"] },
    { id: "w_pushup", name: "Weighted Push-Up", eq: [] },
    { id: "def_pushup", name: "Deficit Push-Up (hands on DBs)", eq: ["dumbbells"] },
    { id: "pushup", name: "Push-Up", eq: [] },
  ],
  vpush: [
    { id: "db_ohp", name: "Seated DB Shoulder Press", eq: ["dumbbells"] },
    { id: "machine_sh", name: "Machine Shoulder Press", eq: ["machines"] },
    { id: "pike_pushup", name: "Pike Push-Up", eq: [] },
  ],
  vpull: [
    { id: "pullup", name: "Pull-Up", eq: ["pullup"] },
    { id: "w_pullup", name: "Weighted Pull-Up", eq: ["pullup"] },
    { id: "lat_pd", name: "Lat Pulldown", eq: ["machines"] },
    { id: "assist_pu", name: "Assisted Pull-Up Machine", eq: ["machines"] },
    { id: "db_pullover", name: "DB Pullover", eq: ["dumbbells", "bench"] },
  ],
  hpull: [
    { id: "cable_row", name: "Seated Cable Row", eq: ["cables"] },
    { id: "machine_row", name: "Machine Row", eq: ["machines"] },
    { id: "db_row", name: "One-Arm DB Row", eq: ["dumbbells"] },
    { id: "inv_row", name: "Inverted Row (smith bar / table)", eq: [] },
  ],
  squat: [
    { id: "leg_press", name: "Leg Press", eq: ["machines"] },
    { id: "goblet", name: "Goblet Squat", eq: ["dumbbells"] },
    { id: "tempo_squat", name: "Tempo Squat (3s down)", eq: [] },
  ],
  singleleg: [
    { id: "bss", name: "Bulgarian Split Squat", eq: ["dumbbells"] },
    { id: "walk_lunge", name: "DB Walking Lunge", eq: ["dumbbells"] },
    { id: "split_squat", name: "Split Squat", eq: [] },
  ],
  hinge: [
    { id: "leg_curl", name: "Leg Curl Machine", eq: ["machines"] },
    { id: "db_rdl", name: "DB Romanian Deadlift", eq: ["dumbbells"] },
    { id: "slide_curl", name: "Sliding Leg Curl", eq: [] },
  ],
  sidedelt: [
    { id: "lat_raise", name: "DB Lateral Raise", eq: ["dumbbells"] },
    { id: "cable_lat", name: "Cable Lateral Raise", eq: ["cables"] },
  ],
  reardelt: [
    { id: "face_pull", name: "Face Pull", eq: ["cables"] },
    { id: "rev_fly", name: "DB Reverse Fly", eq: ["dumbbells"] },
    { id: "prone_y", name: "Prone Y Raise", eq: [] },
  ],
  biceps: [
    { id: "chinup", name: "Chin-Up", eq: ["pullup"] },
    { id: "db_curl", name: "DB Curl", eq: ["dumbbells"] },
    { id: "cable_curl", name: "Cable Curl", eq: ["cables"] },
  ],
  triceps: [
    { id: "pushdown", name: "Cable Pushdown", eq: ["cables"] },
    { id: "skull", name: "DB Skullcrusher", eq: ["dumbbells", "bench"] },
    { id: "dips", name: "Dips", eq: ["dip"] },
    { id: "diamond_pu", name: "Diamond Push-Up", eq: [] },
  ],
  core: [
    { id: "hang_raise", name: "Hanging Leg Raise", eq: ["pullup"] },
    { id: "hollow", name: "Hollow Hold (secs)", eq: [] },
    { id: "leg_raise", name: "Lying Leg Raise", eq: [] },
    { id: "cable_crunch", name: "Cable Crunch", eq: ["cables"] },
  ],
};

const SLOT_LABEL = {
  hpush: "Horizontal push", vpush: "Vertical push", vpull: "Vertical pull",
  hpull: "Horizontal pull", squat: "Squat", singleleg: "Single leg",
  hinge: "Hamstrings", sidedelt: "Side delts", reardelt: "Rear delts",
  biceps: "Biceps", triceps: "Triceps", core: "Core",
};
const MAIN_SLOTS = ["hpush", "vpush", "vpull", "hpull", "squat", "singleleg", "hinge"];
const schemeFor = (slot, reentry) =>
  reentry ? "2 × 8–12, easy" : MAIN_SLOTS.includes(slot) ? "4 × 6–10" : "3 × 10–15";
const plannedSets = (slot, reentry) => (reentry ? 2 : MAIN_SLOTS.includes(slot) ? 4 : 3);
const topReps = (slot) => (MAIN_SLOTS.includes(slot) ? 10 : 15);

/* ============ EFFORT (reps in reserve) ============
   Optional per set. Absent on every set logged before this existed, so every
   reader must treat null as "not recorded" and fall back to rep-only logic. */
const RIR_OPTS = [
  { v: 3, label: "3+", hint: "easy" },
  { v: 2, label: "2", hint: "solid" },
  { v: 1, label: "1", hint: "hard" },
  { v: 0, label: "0", hint: "to failure" },
];
const setEffort = (s) => (s.e === 0 || s.e ? Number(s.e) : null);
/* Hardest set carries the signal: the closest any set got to failure. */
const hardestEffort = (sets) => {
  const v = sets.map(setEffort).filter((x) => x !== null);
  return v.length ? Math.min(...v) : null;
};
const effortSummary = (sets) => {
  const m = hardestEffort(sets);
  return m === null ? "" : m === 0 ? " · to failure" : ` · ${m} left`;
};

/* Progressive overload autopilot */
function suggestTarget(perf, slot, units) {
  if (!perf) return null;
  const sets = perf.sets.filter((s) => s.r);
  if (!sets.length) return null;
  const w = parseFloat(sets[0].w);
  const allTop = sets.every((s) => (parseInt(s.r, 10) || 0) >= topReps(slot));
  const rir = hardestEffort(sets); // null when effort wasn't logged
  if (allTop) {
    if (isNaN(w) || !w) return "Maxed at bodyweight — add load or a harder variation";
    /* Hit every rep but had nothing left: bank the weight before adding to it. */
    if (rir === 0) return `Repeat ${w} ${units} — you hit the reps but went to failure. Own it first.`;
    const inc = units === "kg" ? (w >= 40 ? 2.5 : 1) : (w >= 80 ? 5 : 2.5);
    /* Hit every rep with 3+ still in reserve: the load, not the effort, is limiting. */
    const easy = rir !== null && rir >= 3;
    return `Go up: ${+(w + (easy ? inc * 2 : inc)).toFixed(1)} ${units} today${easy ? " — last time was too easy" : ""}`;
  }
  const minR = Math.min(...sets.map((s) => parseInt(s.r, 10) || 0));
  /* Short of target but stopping early: that's an effort problem, not a load one. */
  if (rir !== null && rir >= 3) return `Same weight — you left 3+ in the tank. Push to ${minR + 2}+ this time.`;
  return `Today: ${sets[0].w ? sets[0].w + " " + units : "same"} × ${minR + 1}+ every set`;
}

/* ============ SESSION TEMPLATES ============ */
const TEMPLATES = {
  FULL_A: { label: "Full Body A", slots: ["hpush", "hpull", "squat", "hinge", "core"] },
  FULL_B: { label: "Full Body B", slots: ["vpush", "vpull", "singleleg", "hinge", "core"] },
  REENTRY: { label: "Re-Entry Full Body", slots: ["hpush", "hpull", "squat", "core"] },
  UPPER: { label: "Upper Body", slots: ["hpush", "vpull", "vpush", "hpull", "biceps", "triceps"] },
  LOWER: { label: "Lower Body", slots: ["squat", "hinge", "singleleg", "core"] },
  PUSH: { label: "Push", slots: ["hpush", "vpush", "sidedelt", "triceps", "core"] },
  PULL: { label: "Pull", slots: ["vpull", "hpull", "reardelt", "biceps"] },
  LEGS: { label: "Legs", slots: ["squat", "hinge", "singleleg", "core"] },
  CARDIO_DAY: { label: "Recovery / Cardio", slots: [] },
};

/* Session-matched warm-ups: movement, not static stretching */
const RAMP_RULE = "Ramp into your first exercise: ~50% weight × 8, then ~75% × 4, then work sets. Later exercises need at most one light set.";
const COOLDOWN = "Wind-down (optional): 2–3 min easy walk. Stretch only what feels tight, 30s holds. Skipping this costs almost nothing — skipping the warm-up doesn't.";
const WARMUPS = {
  FULL: ["3 min easy bike or incline walk", "Leg swings × 10 each leg", "Arm circles × 10 each way", "10 bodyweight squats", "5 slow push-ups"],
  UPPER: ["3 min easy cardio", "Arm circles × 10 each way", "Wall slides × 8", "8 slow push-ups", "Light row or scap squeezes × 10"],
  PUSH: ["3 min easy cardio", "Arm circles × 10 each way", "Wall slides × 8", "10 slow push-ups"],
  PULL: ["3 min easy cardio", "Dead hang 20s (if bar) or scap squeezes × 10", "Cat-cow × 8", "One very light row set × 12"],
  LOWER: ["3 min easy bike or walk", "Leg swings × 10 each leg", "Hip circles × 8 each way", "10 bodyweight squats", "6 walking lunges per leg"],
  CARDIO_DAY: ["Just start your cardio at an easy pace — the first 3 minutes are the warm-up"],
};
const warmupFor = (type) =>
  WARMUPS[{ FULL_A: "FULL", FULL_B: "FULL", REENTRY: "FULL", UPPER: "UPPER", LOWER: "LOWER", PUSH: "PUSH", PULL: "PULL", LEGS: "LOWER", CARDIO_DAY: "CARDIO_DAY" }[type]] || WARMUPS.FULL;

/* ============ DATE HELPERS ============ */
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const diffDays = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const prettyDate = () =>
  new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

/* ============ THE ADAPTIVE BRAIN ============ */
function planToday(sessions) {
  const today = todayStr();
  /* cardio never influences lifting programming */
  const past = sessions.filter((s) => s.date < today && s.type !== "CARDIO").sort((a, b) => a.date.localeCompare(b.date));
  const last = past[past.length - 1];

  if (!last)
    return { type: "FULL_A", reason: "First logged session — full-body baseline so every muscle gets a data point." };

  const gap = diffDays(last.date, today);
  const freq = past.filter((s) => diffDays(s.date, today) <= 7).length;

  if (gap >= 7)
    return {
      type: "REENTRY", reentry: true,
      reason: `First session in ${gap} days. Lighter full body — 2 sets per lift, leave 2–3 reps in the tank. Normal programming resumes next session.`,
    };

  if (freq >= 5)
    return {
      type: "CARDIO_DAY",
      reason: `${freq} lifting sessions in the last 7 days — impressive, and exactly why today should be easy cardio or rest. Muscle is built between sessions, not during them. Override below if you disagree, but the smart money is on 20–30 easy minutes.`,
    };

  if (freq >= 3) {
    const next = { PUSH: "PULL", PULL: "LEGS", LEGS: "PUSH", UPPER: "LEGS", LOWER: "PUSH" }[last.type] || "PUSH";
    return {
      type: next,
      reason: `${freq} sessions this week — you've earned a split. ${TEMPLATES[next].label} today, so recent muscles recover.`,
    };
  }
  if (freq === 2) {
    const next = last.type === "UPPER" ? "LOWER" : last.type === "LOWER" ? "UPPER" : "UPPER";
    return {
      type: next,
      reason: `2 sessions this week — splitting upper/lower. ${TEMPLATES[next].label} today${gap === 1 ? " while yesterday's work recovers" : ""}.`,
    };
  }
  const next = last.type === "FULL_A" ? "FULL_B" : "FULL_A";
  let reason = `${freq} session this week — full body keeps everything covered.`;
  if (gap === 1) reason += " Back-to-back days: different exercises today, go easy on anything sore.";
  return { type: next, reason };
}

/* ============ SMALL PIECES ============ */
function Ring({ done, total }) {
  const pct = total ? Math.min(1, done / total) : 0;
  const r = 20, cx = 24, cy = 24, circ = 2 * Math.PI * r;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.line} strokeWidth="5" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.green} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dashoffset .4s ease" }} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="12" fontWeight="600" fill={C.ink}>
        {done}
      </text>
    </svg>
  );
}

/* ============ COMPONENT ============ */
export default function AdaptTrainer() {
  const [loaded, setLoaded] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [equipment, setEquipment] = useState({ machines: true, cables: true, dumbbells: true, bench: true, dip: false, pullup: false });
  const [units, setUnits] = useState("lb");
  const [bw, setBw] = useState("");
  const [view, setView] = useState("today");
  const [entries, setEntries] = useState(null);
  const [overrideType, setOverrideType] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [expanded, setExpanded] = useState(0);
  const [savedFlash, setSavedFlash] = useState(false);
  const [restEnd, setRestEnd] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [draft, setDraft] = useState(null);
  const [storageOk, setStorageOk] = useState(null);
  const [saveError, setSaveError] = useState(false);
  const [backupText, setBackupText] = useState("");
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState("");

  /* rest timer */
  useEffect(() => {
    if (!restEnd) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [restEnd]);
  const restLeft = restEnd ? Math.max(0, Math.ceil((restEnd - now) / 1000)) : 0;
  useEffect(() => { if (restEnd && restLeft === 0) setRestEnd(null); }, [restLeft, restEnd]);
  const fmtRest = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  /* persistence */
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("adapt:v1");
        let savedSessions = [];
        if (r && r.value) {
          const d = JSON.parse(r.value);
          savedSessions = d.sessions || [];
          setSessions(savedSessions);
          if (d.equipment) setEquipment(d.equipment);
          if (d.units) setUnits(d.units);
          if (d.bw) setBw(d.bw);
        }
        try {
          const dr = await window.storage.get("adapt:draft");
          if (dr && dr.value) {
            const d2 = JSON.parse(dr.value);
            if (d2.date === todayStr() && d2.entries && d2.entries.length) {
              setDraft(d2);
              const planned = planToday(savedSessions);
              if (d2.type && d2.type !== planned.type) setOverrideType(d2.type);
            }
          }
        } catch (e) { /* no draft */ }
      } catch (e) { /* first run */ }
      /* self-test: prove storage actually persists in this view */
      try {
        const stamp = String(Date.now());
        await window.storage.set("adapt:ping", stamp);
        const back = await window.storage.get("adapt:ping");
        setStorageOk(!!(back && back.value === stamp));
      } catch (e) { setStorageOk(false); }
      setLoaded(true);
    })();
  }, []);
  const persist = async (s, eq, u, b) => {
    try {
      const res = await window.storage.set("adapt:v1", JSON.stringify({ sessions: s, equipment: eq, units: u, bw: b }));
      setSaveError(!res);
    } catch (e) { setSaveError(true); }
  };

  /* plan + working session */
  const plan = useMemo(() => planToday(sessions), [sessions]);
  const activeType = overrideType || plan.type;
  const reentry = !overrideType && plan.reentry;
  const activeEq = Object.keys(equipment).filter((k) => equipment[k]);
  const avail = (v) => v.eq.every((t) => activeEq.includes(t));

  useEffect(() => {
    if (!loaded) return;
    if (draft && draft.date === todayStr() && draft.type === activeType) {
      setEntries(draft.entries);
      setDraft(null);
      setExpanded(0);
      return;
    }
    const tpl = TEMPLATES[activeType];
    setEntries(
      tpl.slots.map((slot) => {
        const v = VARIANTS[slot].find(avail) || VARIANTS[slot].find((x) => x.eq.length === 0);
        return v ? { slot, exId: v.id, name: v.name, scheme: schemeFor(slot, reentry), planned: plannedSets(slot, reentry), sets: [] } : null;
      }).filter(Boolean)
    );
    setExpanded(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, activeType, JSON.stringify(equipment), sessions.length]);

  /* autosave in-progress sets so a mid-workout reload loses nothing */
  useEffect(() => {
    if (!loaded || !entries || !entries.some((e) => e.sets.length)) return;
    const t = setTimeout(() => {
      window.storage
        .set("adapt:draft", JSON.stringify({ date: todayStr(), type: activeType, entries }))
        .catch(() => {});
    }, 1200);
    return () => clearTimeout(t);
  }, [entries, loaded, activeType]);

  const lastPerf = (exId) => {
    for (let i = sessions.length - 1; i >= 0; i--) {
      const e = (sessions[i].entries || []).find((x) => x.exId === exId && x.sets.length);
      if (e) return { date: sessions[i].date, sets: e.sets };
    }
    return null;
  };

  const swapVariant = (idx) =>
    setEntries((prev) => {
      const cur = prev[idx];
      const opts = VARIANTS[cur.slot].filter(avail);
      if (opts.length < 2) return prev;
      const i = opts.findIndex((v) => v.id === cur.exId);
      const nxt = opts[(i + 1) % opts.length];
      const cp = [...prev];
      cp[idx] = { ...cur, exId: nxt.id, name: nxt.name, sets: [] };
      return cp;
    });
  const addSet = (idx) =>
    setEntries((p) => {
      const c = [...p];
      const e = c[idx];
      const prev = e.sets[e.sets.length - 1];
      const perf = lastPerf(e.exId);
      const seedW = prev && prev.w ? prev.w
        : perf && perf.sets[e.sets.length] ? perf.sets[e.sets.length].w
        : perf && perf.sets[0] ? perf.sets[0].w : "";
      c[idx] = { ...e, sets: [...e.sets, { w: seedW, r: "" }] };
      return c;
    });
  const setVal = (idx, si, f, val) =>
    setEntries((p) => { const c = [...p]; const sets = [...c[idx].sets]; sets[si] = { ...sets[si], [f]: val }; c[idx] = { ...c[idx], sets }; return c; });
  const delSet = (idx, si) =>
    setEntries((p) => { const c = [...p]; c[idx] = { ...c[idx], sets: c[idx].sets.filter((_, j) => j !== si) }; return c; });

  const loggedSets = entries ? entries.reduce((n, e) => n + e.sets.filter((s) => s.r).length, 0) : 0;
  const totalPlanned = entries ? entries.reduce((n, e) => n + e.planned, 0) : 0;
  const doneToday = sessions.some((s) => s.date === todayStr() && s.type !== "CARDIO");

  /* cardio quick-log */
  const [cardioOpen, setCardioOpen] = useState(false);
  const [warmOpen, setWarmOpen] = useState(false);
  const [cardioType, setCardioType] = useState("Incline walk");
  const [cardioMin, setCardioMin] = useState("");
  const [cardioMsg, setCardioMsg] = useState(false);
  const logCardio = async () => {
    const m = parseInt(cardioMin, 10);
    if (!m) return;
    const rec = { id: Date.now(), date: todayStr(), type: "CARDIO", entries: [{ exId: "cardio", name: cardioType, minutes: m, sets: [] }] };
    const next = [...sessions, rec].sort((a, b) => a.date.localeCompare(b.date));
    setSessions(next);
    await persist(next, equipment, units, bw);
    setCardioMin("");
    setCardioOpen(false);
    setCardioMsg(true);
    setTimeout(() => setCardioMsg(false), 2500);
  };

  const finish = async () => {
    const clean = entries.map((e) => ({ slot: e.slot, exId: e.exId, name: e.name, sets: e.sets.filter((s) => s.r) })).filter((e) => e.sets.length);
    if (!clean.length) return;
    const rec = { id: Date.now(), date: todayStr(), type: activeType, entries: clean };
    const next = [...sessions, rec].sort((a, b) => a.date.localeCompare(b.date));
    setSessions(next);
    setOverrideType(null);
    await persist(next, equipment, units, bw);
    try { await window.storage.delete("adapt:draft"); } catch (e) { /* nothing to clear */ }
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2500);
  };
  const deleteSession = async (id) => {
    const next = sessions.filter((s) => s.id !== id);
    setSessions(next);
    await persist(next, equipment, units, bw);
  };
  const toggleEq = async (k) => {
    const eq = { ...equipment, [k]: !equipment[k] };
    setEquipment(eq);
    await persist(sessions, eq, units, bw);
  };
  const toggleUnits = async () => {
    const u = units === "lb" ? "kg" : "lb";
    setUnits(u);
    await persist(sessions, equipment, u, bw);
  };
  const changeBw = async (v) => {
    setBw(v);
    await persist(sessions, equipment, units, v);
  };

  const bwNum = parseFloat(bw);
  const proteinG = bwNum ? Math.round(units === "lb" ? bwNum * 0.8 : bwNum * 1.8) : null;
  const calsMaint = bwNum ? Math.round(units === "lb" ? bwNum * 15 : bwNum * 33) : null;
  const freq7 = sessions.filter((s) => diffDays(s.date, todayStr()) <= 7 && s.date <= todayStr() && s.type !== "CARDIO").length;
  useEffect(() => {
    if (loaded && activeType === "CARDIO_DAY") setCardioOpen(true);
  }, [activeType, loaded]);

  const eqSummary = [["machines", "Machines"], ["cables", "Cables"], ["dumbbells", "DBs"], ["bench", "Bench"], ["dip", "Dips"], ["pullup", "Bar"]]
    .filter(([k]) => equipment[k]).map(([, l]) => l).join(" · ") || "Bodyweight only";

  const exportData = () =>
    setBackupText(JSON.stringify({ sessions, equipment, units, bw }));
  const importData = async () => {
    try {
      const d = JSON.parse(importText);
      if (!Array.isArray(d.sessions)) throw new Error("no sessions array");
      setSessions(d.sessions);
      if (d.equipment) setEquipment(d.equipment);
      if (d.units) setUnits(d.units);
      if (d.bw) setBw(d.bw);
      await persist(d.sessions, d.equipment || equipment, d.units || units, d.bw || bw);
      setImportMsg(`Restored ${d.sessions.length} session${d.sessions.length === 1 ? "" : "s"} ✓`);
      setImportText("");
    } catch (e) { setImportMsg("Couldn't read that — paste the exact exported text."); }
  };

  if (!loaded)
    return <div style={{ ...font, background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.sub }}>Loading…</div>;

  const inputStyle = { padding: "9px 10px", borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 16, background: C.fill, width: 76, textAlign: "center", ...font };

  return (
    <div style={{ ...font, background: C.bg, minHeight: "100vh", color: C.ink, WebkitFontSmoothing: "antialiased" }}>
      <style>{`
        input:focus { outline: 2px solid ${C.green}; outline-offset: 1px; border-color: transparent; }
        button { cursor: pointer; font-family: inherit; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px 110px" }}>

        {/* header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>{prettyDate()}</div>
            <h1 style={{ fontSize: 30, fontWeight: 700, margin: "2px 0 0", letterSpacing: "-0.02em" }}>
              {view === "today" ? "Today" : "History"}
            </h1>
          </div>
          {view === "today" && <Ring done={loggedSets} total={totalPlanned} />}
        </header>

        {/* tabs */}
        <div style={{ display: "flex", background: C.line, borderRadius: 10, padding: 2, marginBottom: 16 }}>
          {["today", "history"].map((t) => (
            <button key={t} onClick={() => setView(t)}
              style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600, background: view === t ? C.card : "transparent", color: view === t ? C.ink : C.sub, boxShadow: view === t ? shadow : "none", transition: "all .15s" }}>
              {t === "today" ? "Today" : "History"}
            </button>
          ))}
        </div>

        {(storageOk === false || saveError) && (
          <div style={{ background: "#FFF3F2", border: "1px solid #FFC7C2", color: "#C0362C", borderRadius: 12, padding: "10px 14px", fontSize: 13, lineHeight: 1.4, marginBottom: 14 }}>
            <strong>Saving isn't working in this view.</strong> Your log won't survive closing the app from here. Open Edit → Backup and copy your data out before leaving.
          </div>
        )}

        {view === "today" && entries && (
          <>
            {/* session card */}
            <section style={{ background: C.card, borderRadius: 16, boxShadow: shadow, padding: "16px 18px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" }}>
                  {TEMPLATES[activeType].label}
                </div>
                <button onClick={() => setShowPicker(!showPicker)}
                  style={{ background: "transparent", border: "none", color: C.blue, fontSize: 14, fontWeight: 500, padding: 0 }}>
                  {showPicker ? "Done" : "Change"}
                </button>
              </div>
              <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.45, margin: "6px 0 0" }}>
                {overrideType ? "Manual override — adaptive planning resumes next session." : plan.reason}
              </p>
              {showPicker && (
                <>
                  <select value={activeType}
                    onChange={(e) => { setOverrideType(e.target.value === plan.type ? null : e.target.value); setShowPicker(false); }}
                    style={{ ...font, marginTop: 10, width: "100%", padding: "9px 10px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.fill, fontSize: 15 }}>
                    {Object.keys(TEMPLATES).map((k) => (
                      <option key={k} value={k}>{k === plan.type ? `${TEMPLATES[k].label} (recommended)` : TEMPLATES[k].label}</option>
                    ))}
                  </select>
                  <div style={{ marginTop: 10, fontSize: 12.5, color: C.sub, lineHeight: 1.55, background: C.fill, borderRadius: 10, padding: "10px 12px" }}>
                    <strong style={{ color: C.ink }}>What these mean:</strong> they're the same training, sliced by how often you show up.
                    {" "}<strong style={{ color: C.ink }}>Full Body</strong> = everything each visit (best 1–3 days/wk).
                    {" "}<strong style={{ color: C.ink }}>Upper/Lower</strong> = halves, so each half recovers (4 days/wk).
                    {" "}<strong style={{ color: C.ink }}>Push</strong> = chest, shoulders, triceps · <strong style={{ color: C.ink }}>Pull</strong> = back, biceps · <strong style={{ color: C.ink }}>Legs</strong> = legs — thirds for 5–6 days/wk.
                    {" "}The app picks based on your last 7 days, so the recommendation is usually right.
                  </div>
                </>
              )}
              {doneToday && (
                <p style={{ fontSize: 13, color: C.greenDark, margin: "8px 0 0" }}>
                  ✓ Already logged today — anything below counts as a second session.
                </p>
              )}
            </section>

            {/* setup: gym + body, collapsed by default */}
            <section style={{ background: C.card, borderRadius: 16, boxShadow: shadow, marginBottom: 16, overflow: "hidden" }}>
              <button onClick={() => setSetupOpen(!setupOpen)}
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px", background: "transparent", border: "none", fontSize: 14 }}>
                <span style={{ color: C.sub }}>
                  {eqSummary}{proteinG ? ` · ${proteinG}g protein` : ""}
                </span>
                <span style={{ color: C.blue, fontWeight: 500 }}>{setupOpen ? "Done" : "Edit"}</span>
              </button>
              {setupOpen && (
                <div style={{ padding: "0 18px 16px", borderTop: `1px solid ${C.line}` }}>
                  <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, margin: "12px 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>This gym has</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {[["machines", "Machines"], ["cables", "Cables"], ["dumbbells", "Dumbbells"], ["bench", "Bench"], ["dip", "Dip station"], ["pullup", "Pull-up bar"]].map(([k, label]) => (
                      <button key={k} onClick={() => toggleEq(k)}
                        style={{ padding: "7px 14px", borderRadius: 999, fontSize: 14, fontWeight: 500, border: "none", background: equipment[k] ? C.green : C.fill, color: equipment[k] ? "#fff" : C.sub, transition: "all .15s" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, margin: "16px 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Body & fuel</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <input inputMode="decimal" placeholder="weight" value={bw} onChange={(e) => changeBw(e.target.value)} style={inputStyle} />
                    <button onClick={toggleUnits} style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.fill, fontSize: 14, fontWeight: 600 }}>
                      {units}
                    </button>
                    {proteinG && (
                      <span style={{ fontSize: 13, color: C.sub }}>
                        ≥ <strong style={{ color: C.ink }}>{proteinG}g</strong> protein · ~{calsMaint} kcal (+200 to build)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, margin: "16px 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Backup</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={exportData}
                      style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", background: C.fill, color: C.blue, fontWeight: 600, fontSize: 14 }}>
                      Export data
                    </button>
                  </div>
                  {backupText && (
                    <>
                      <textarea readOnly value={backupText} onFocus={(e) => e.target.select()}
                        style={{ ...font, width: "100%", height: 72, marginTop: 8, fontSize: 11, borderRadius: 10, border: `1px solid ${C.line}`, background: C.fill, padding: 8, boxSizing: "border-box" }} />
                      <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>Tap the box, copy all, paste somewhere safe (Notes, a message to yourself).</div>
                    </>
                  )}
                  <textarea placeholder="Paste exported data here to restore…" value={importText} onChange={(e) => setImportText(e.target.value)}
                    style={{ ...font, width: "100%", height: 48, marginTop: 10, fontSize: 11, borderRadius: 10, border: `1px solid ${C.line}`, background: C.fill, padding: 8, boxSizing: "border-box" }} />
                  {importText && (
                    <button onClick={importData}
                      style={{ marginTop: 6, width: "100%", padding: "9px 0", borderRadius: 10, border: "none", background: C.green, color: "#fff", fontWeight: 600, fontSize: 14 }}>
                      Restore from backup
                    </button>
                  )}
                  {importMsg && <div style={{ fontSize: 12, color: importMsg.includes("✓") ? C.greenDark : "#C0362C", marginTop: 6 }}>{importMsg}</div>}
                </div>
              )}
            </section>

            {/* warm-up card */}
            <section style={{ background: C.card, borderRadius: 16, boxShadow: shadow, marginBottom: 10, overflow: "hidden" }}>
              <button onClick={() => setWarmOpen(!warmOpen)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "transparent", border: "none", textAlign: "left" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>~5 min before you lift</div>
                  <div style={{ fontSize: 17, fontWeight: 600 }}>Warm-up</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.sub }}>{warmOpen ? "▾" : "▸"}</div>
              </button>
              {warmOpen && (
                <div style={{ padding: "0 18px 16px" }}>
                  {warmupFor(activeType).map((w, i) => (
                    <div key={i} style={{ fontSize: 14, lineHeight: 1.4, padding: "5px 0", borderBottom: i < warmupFor(activeType).length - 1 ? `1px solid ${C.line}` : "none" }}>
                      {w}
                    </div>
                  ))}
                  {activeType !== "CARDIO_DAY" && (
                    <>
                      <p style={{ fontSize: 13, color: C.greenDark, background: "#E8F8EC", borderRadius: 8, padding: "8px 10px", margin: "10px 0 0", lineHeight: 1.45 }}>{RAMP_RULE}</p>
                      <p style={{ fontSize: 12, color: C.sub, margin: "8px 0 0", lineHeight: 1.45 }}>{COOLDOWN}</p>
                    </>
                  )}
                </div>
              )}
            </section>

            {/* exercise list — accordion */}
            {activeType === "CARDIO_DAY" && (
              <section style={{ background: C.card, borderRadius: 16, boxShadow: shadow, padding: "16px 18px", marginBottom: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No lifting planned today</div>
                <p style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.5, margin: 0 }}>
                  Log some easy cardio below, or just take the day — recovery is where the last five sessions turn into muscle. Want to lift anyway? Tap Change above.
                </p>
              </section>
            )}
            {entries.map((e, idx) => {
              const perf = lastPerf(e.exId);
              const target = suggestTarget(perf, e.slot, units);
              const open = expanded === idx;
              const doneSets = e.sets.filter((s) => s.r).length;
              const swappable = VARIANTS[e.slot].filter(avail).length > 1;
              return (
                <section key={e.slot + e.exId}
                  style={{ background: C.card, borderRadius: 16, boxShadow: shadow, marginBottom: 10, overflow: "hidden" }}>
                  <button onClick={() => setExpanded(open ? null : idx)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "transparent", border: "none", textAlign: "left" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>{SLOT_LABEL[e.slot]} · {e.scheme}</div>
                      <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: doneSets ? C.greenDark : C.sub, flexShrink: 0 }}>
                      {doneSets ? `${doneSets} ✓` : open ? "▾" : "▸"}
                    </div>
                  </button>

                  {open && (
                    <div style={{ padding: "0 18px 16px" }}>
                      {perf ? (
                        <div style={{ fontSize: 13, color: C.sub, marginBottom: 4 }}>
                          Last ({perf.date.slice(5)}): <strong style={{ color: C.ink }}>{perf.sets.map((s) => `${s.w || "bw"}×${s.r}`).join(", ")}</strong>{effortSummary(perf.sets)}
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, color: C.sub, marginBottom: 4 }}>No history — today sets the baseline.</div>
                      )}
                      {target && (
                        <div style={{ display: "inline-block", background: "#E8F8EC", color: C.greenDark, fontSize: 13, fontWeight: 600, borderRadius: 8, padding: "4px 10px", marginBottom: 8 }}>
                          {target}
                        </div>
                      )}

                      {e.sets.map((s, si) => (
                        <div key={si} style={{ marginTop: 8 }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <span style={{ fontSize: 13, color: C.sub, width: 40 }}>Set {si + 1}</span>
                            <input inputMode="decimal" placeholder={units} value={s.w} onChange={(ev) => setVal(idx, si, "w", ev.target.value)} style={inputStyle} />
                            <span style={{ color: C.sub }}>×</span>
                            <input inputMode="numeric" placeholder="reps" value={s.r} onChange={(ev) => setVal(idx, si, "r", ev.target.value)} style={{ ...inputStyle, width: 66 }} />
                            <button onClick={() => delSet(idx, si)} aria-label="remove set"
                              style={{ marginLeft: "auto", background: "transparent", border: "none", color: C.sub, fontSize: 15 }}>✕</button>
                          </div>
                          {/* Effort — only asked once the set is actually logged, and always skippable */}
                          {s.r ? (
                            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6, paddingLeft: 40, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 12, color: C.sub, marginRight: 2 }}>reps left</span>
                              {RIR_OPTS.map((o) => {
                                const on = setEffort(s) === o.v;
                                return (
                                  <button key={o.v} onClick={() => setVal(idx, si, "e", on ? "" : o.v)}
                                    aria-label={`${o.label} reps left — ${o.hint}`} aria-pressed={on}
                                    style={{ padding: "5px 11px", borderRadius: 999, fontSize: 13, fontWeight: 600, border: "none",
                                      background: on ? (o.v === 0 ? C.red : C.green) : C.fill, color: on ? "#fff" : C.sub }}>
                                    {o.label}
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      ))}
                      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                        <button onClick={() => addSet(idx)}
                          style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: C.fill, color: C.blue, fontWeight: 600, fontSize: 14 }}>
                          + Add set
                        </button>
                        {swappable && (
                          <button onClick={() => swapVariant(idx)}
                            style={{ padding: "10px 14px", borderRadius: 12, border: "none", background: C.fill, color: C.sub, fontWeight: 500, fontSize: 14 }}>
                            Swap
                          </button>
                        )}
                        <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(e.name + " form")}`} target="_blank" rel="noreferrer"
                          style={{ padding: "10px 14px", borderRadius: 12, background: C.fill, color: C.sub, fontWeight: 500, fontSize: 14, textDecoration: "none" }}>
                          Form
                        </a>
                      </div>
                    </div>
                  )}
                </section>
              );
            })}

            {/* cardio quick-log — separate from lifting, never affects programming */}
            <section style={{ background: C.card, borderRadius: 16, boxShadow: shadow, marginBottom: 10, overflow: "hidden" }}>
              <button onClick={() => setCardioOpen(!cardioOpen)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "transparent", border: "none", textAlign: "left" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>Optional · doesn't affect your split</div>
                  <div style={{ fontSize: 17, fontWeight: 600 }}>Cardio</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: cardioMsg ? C.greenDark : C.sub }}>
                  {cardioMsg ? "Logged ✓" : cardioOpen ? "▾" : "▸"}
                </div>
              </button>
              {cardioOpen && (
                <div style={{ padding: "0 18px 16px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    {["Incline walk", "Run", "Bike", "Row", "Jump rope"].map((t) => (
                      <button key={t} onClick={() => setCardioType(t)}
                        style={{ padding: "7px 14px", borderRadius: 999, fontSize: 14, fontWeight: 500, border: "none", background: cardioType === t ? C.green : C.fill, color: cardioType === t ? "#fff" : C.sub }}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input inputMode="numeric" placeholder="min" value={cardioMin} onChange={(e) => setCardioMin(e.target.value)} style={inputStyle} />
                    <button onClick={logCardio} disabled={!parseInt(cardioMin, 10)}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: parseInt(cardioMin, 10) ? C.green : C.line, color: parseInt(cardioMin, 10) ? "#fff" : C.sub, fontWeight: 600, fontSize: 14 }}>
                      Log cardio
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: C.sub, margin: "8px 0 0", lineHeight: 1.4 }}>
                    2–3 easy 20–30 min sessions/week supports the physique goal. Keep hard cardio away from leg days.
                  </p>
                </div>
              )}
            </section>

            {/* bottom bar */}
            <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", borderTop: `1px solid ${C.line}`, padding: "12px 16px", display: "flex", justifyContent: "center", zIndex: 30 }}>
              <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 528 }}>
                <button onClick={() => {
                  /* Stamp `now` from the same instant: it only ticks while a timer
                     runs, so a stale value would render one frame of 120s + idle time. */
                  const t = Date.now();
                  setNow(t);
                  setRestEnd(restLeft > 0 ? null : t + 120000);
                }}
                  style={{ fontWeight: 600, fontSize: 15, padding: "13px 16px", borderRadius: 14, border: "none", background: restLeft > 0 ? "#E8F8EC" : C.fill, color: restLeft > 0 ? C.greenDark : C.sub, minWidth: 100 }}>
                  {restLeft > 0 ? `${fmtRest(restLeft)} ✕` : "Rest 2:00"}
                </button>
                <button onClick={finish} disabled={!loggedSets}
                  style={{ flex: 1, fontWeight: 600, fontSize: 16, padding: "13px 0", borderRadius: 14, border: "none", background: loggedSets ? C.green : C.line, color: loggedSets ? "#fff" : C.sub, transition: "background .15s" }}>
                  {savedFlash ? "Saved ✓" : `Finish · ${loggedSets} set${loggedSets === 1 ? "" : "s"}`}
                </button>
              </div>
            </div>
          </>
        )}

        {view === "history" && (
          <>
            <p style={{ fontSize: 13, color: C.sub, margin: "0 0 12px" }}>
              {freq7} session{freq7 === 1 ? "" : "s"} in the last 7 days — this is what drives your programming.
            </p>
            {!sessions.length && (
              <p style={{ color: C.sub, fontSize: 14, textAlign: "center", marginTop: 40 }}>
                Nothing logged yet. Your first session becomes the baseline everything adapts around.
              </p>
            )}
            {[...sessions].reverse().map((s) => (
              <section key={s.id} style={{ background: C.card, borderRadius: 16, boxShadow: shadow, padding: "14px 18px", marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>
                    {s.type === "CARDIO" ? "Cardio" : TEMPLATES[s.type] ? TEMPLATES[s.type].label : s.type}
                    <span style={{ color: C.sub, fontWeight: 400, fontSize: 13, marginLeft: 8 }}>{s.date}</span>
                  </div>
                  <button onClick={() => deleteSession(s.id)} style={{ background: "transparent", border: "none", color: C.sub, fontSize: 12 }}>Delete</button>
                </div>
                <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.7, color: C.sub }}>
                  {s.type === "CARDIO"
                    ? s.entries.map((e) => <div key={e.exId}><span style={{ color: C.ink, fontWeight: 500 }}>{e.name}</span> · {e.minutes} min</div>)
                    : s.entries.map((e) => (
                        <div key={e.exId}>
                          <span style={{ color: C.ink, fontWeight: 500 }}>{e.name}</span>: {e.sets.map((x) => `${x.w || "bw"}×${x.r}`).join(", ")}{effortSummary(e.sets)}
                        </div>
                      ))}
                </div>
              </section>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
