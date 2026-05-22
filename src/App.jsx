import { useState, useCallback, useRef } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ReferenceLine } from "recharts";

// ─── Embedded FM3 data extracted from the SENER calculator ───────────────────
const INITIAL_DATA = {
  "FM3 (BB8)": {
    satellite: "FM3", bbName: "BB8",
    QV1: {
      "Flotron 90° Alignment": { "Delta Gain (dB)": { no_cal: 0.173003, cal: 0.079506 }, "Delta AR (dB)": { no_cal: 0.031112, cal: 0.01392 }, "Delta SLL (dB)": { no_cal: 0.232366, cal: 0.196597 }, "Gain Tx band (dBi)": { no_cal: 43.826997, cal: 43.892453 }, "AR (dB)": { no_cal: 1.031112, cal: 1.02375 }, "SLL (dB)": { no_cal: 18.767634, cal: 18.767634 }, rotation_deg: 0.128301, deviations: [{ point: "PA", x: 0, y: 0, z: 0, mag: 0 }, { point: "PB", x: -0.008129, y: 0, z: 0.004614, mag: 0.009347 }, { point: "PC", x: 0.02167, y: -0.015343, z: 0.00646, mag: 0.027326 }, { point: "PD", x: 0.055788, y: -0.030832, z: -0.001842, mag: 0.063768 }, { point: "P1", x: -0.10437, y: 0.199277, z: -0.131815, mag: 0.260729 }, { point: "P2", x: -0.053107, y: 0.250171, z: -0.060237, mag: 0.262744 }, { point: "P4", x: -0.085691, y: 0.151457, z: -0.168417, mag: 0.24217 }] },
      "Flotron 87.5°": { "Delta Gain (dB)": { no_cal: 0.220528, cal: 0.13066 }, "Delta AR (dB)": { no_cal: 0.036452, cal: 0.026229 }, "Delta SLL (dB)": { no_cal: 0.281272, cal: 0.281272 }, "Gain Tx band (dBi)": { no_cal: 43.779472, cal: 43.86934 }, "AR (dB)": { no_cal: 1.036452, cal: 1.026229 }, "SLL (dB)": { no_cal: 18.718728, cal: 18.718728 }, rotation_deg: 0.126192, deviations: [{ point: "PA", x: 0, y: 0, z: 0, mag: 0 }, { point: "PB", x: -0.011527, y: 0, z: 0.009954, mag: 0.015207 }, { point: "PC", x: 0.003228, y: 0.006169, z: 0.013935, mag: 0.015632 }, { point: "PD", x: 0.047286, y: -0.037527, z: -0.00397, mag: 0.060447 }, { point: "P1", x: -0.061487, y: 0.266963, z: -0.058288, mag: 0.278898 }, { point: "P2", x: -0.017432, y: 0.302457, z: 0.005188, mag: 0.302962 }, { point: "P4", x: -0.062153, y: 0.204447, z: -0.096152, mag: 0.233015 }] },
      "Flotron 272.5°": { "Delta Gain (dB)": { no_cal: 0.502652, cal: 0.258099 }, "Delta AR (dB)": { no_cal: 0.0709, cal: 0.041687 }, "Delta SLL (dB)": { no_cal: 0.50701, cal: 0.50701 }, "Gain Tx band (dBi)": { no_cal: 43.497348, cal: 43.741901 }, "AR (dB)": { no_cal: 1.0709, cal: 1.041687 }, "SLL (dB)": { no_cal: 18.49299, cal: 18.49299 }, rotation_deg: 0.13986, deviations: [{ point: "PA", x: 0, y: 0, z: 0, mag: 0 }, { point: "PB", x: -0.015722, y: 0, z: -0.006061, mag: 0.016853 }, { point: "PC", x: 0.018864, y: -0.057071, z: -0.008484, mag: 0.060539 }, { point: "PD", x: 0.063374, y: -0.055031, z: 0.00242, mag: 0.083955 }, { point: "P1", x: -0.123577, y: 0.403041, z: 0.149553, mag: 0.44173 }, { point: "P2", x: -0.046546, y: 0.443183, z: 0.247842, mag: 0.511742 }, { point: "P4", x: -0.068981, y: 0.336844, z: 0.125933, mag: 0.366296 }] },
      "Structure 272.5° No Preload": { "Delta Gain (dB)": { no_cal: 0.285403, cal: 0.168237 }, "Delta AR (dB)": { no_cal: 0.043965, cal: 0.030487 }, "Delta SLL (dB)": { no_cal: 0.356289, cal: 0.356289 }, "Gain Tx band (dBi)": { no_cal: 43.714597, cal: 43.831763 }, "AR (dB)": { no_cal: 1.043965, cal: 1.030487 }, "SLL (dB)": { no_cal: 18.643711, cal: 18.643711 }, rotation_deg: 0.117107, deviations: [{ point: "PA", x: 0, y: 0, z: 0, mag: 0 }, { point: "PB", x: -0.006222, y: 0, z: 0.000791, mag: 0.006272 }, { point: "PC", x: 0.01314, y: -0.073859, z: 0.001107, mag: 0.074977 }, { point: "PD", x: 0.027998, y: -0.08031, z: -0.000316, mag: 0.084975 }, { point: "P1", x: 0.055839, y: 0.408781, z: -0.068622, mag: 0.416696 }, { point: "P2", x: 0.142302, y: 0.376477, z: -0.025868, mag: 0.402906 }, { point: "P4", x: 0.036706, y: 0.341294, z: -0.108221, mag: 0.358756 }] },
      "Structure 87.5° PLM Installed": { "Delta Gain (dB)": { no_cal: 0.245279, cal: 0.145679 }, "Delta AR (dB)": { no_cal: 0.040811, cal: 0.029434 }, "Delta SLL (dB)": { no_cal: 0.309933, cal: 0.309933 }, "Gain Tx band (dBi)": { no_cal: 43.754721, cal: 43.854321 }, "AR (dB)": { no_cal: 1.040811, cal: 1.029434 }, "SLL (dB)": { no_cal: 18.690067, cal: 18.690067 }, rotation_deg: 0.143017, deviations: [{ point: "PA", x: 0, y: 0, z: 0, mag: 0 }, { point: "PB", x: 0.073457, y: 0, z: 0.031718, mag: 0.079984 }] },
    },
    QV2: {
      "Flotron 90° Alignment": { "Delta Gain (dB)": { no_cal: 0.265069, cal: 0.15488 }, "Delta AR (dB)": { no_cal: 0.039093, cal: 0.023706 }, "Delta SLL (dB)": { no_cal: 0.319339, cal: 0.319339 }, "Gain Tx band (dBi)": { no_cal: 43.734931, cal: 43.84512 }, "AR (dB)": { no_cal: 1.039093, cal: 1.023706 }, "SLL (dB)": { no_cal: 18.680661, cal: 18.680661 }, rotation_deg: 0.112584, deviations: [{ point: "PA", x: 0, y: 0, z: 0, mag: 0 }, { point: "PB", x: -0.01211, y: 0, z: 0.010516, mag: 0.016047 }, { point: "PC", x: 0.008124, y: -0.002476, z: 0.009576, mag: 0.012834 }, { point: "PD", x: 0.048, y: -0.047394, z: -0.005019, mag: 0.067454 }] },
      "Flotron 87.5°": { "Delta Gain (dB)": { no_cal: 0.637519, cal: 0.331444 }, "Delta AR (dB)": { no_cal: 0.075826, cal: 0.046137 }, "Delta SLL (dB)": { no_cal: 0.579217, cal: 0.579217 }, "Gain Tx band (dBi)": { no_cal: 43.362481, cal: 43.668556 }, "AR (dB)": { no_cal: 1.075826, cal: 1.046137 }, "SLL (dB)": { no_cal: 18.420783, cal: 18.420783 }, rotation_deg: 0.188344, deviations: [{ point: "PA", x: 0, y: 0, z: 0, mag: 0 }, { point: "PB", x: -0.005264, y: 0, z: 0.02213, mag: 0.022745 }] },
      "Flotron 272.5°": { "Delta Gain (dB)": { no_cal: 0.781642, cal: 0.388564 }, "Delta AR (dB)": { no_cal: 0.089296, cal: 0.053484 }, "Delta SLL (dB)": { no_cal: 0.651459, cal: 0.651459 }, "Gain Tx band (dBi)": { no_cal: 43.218358, cal: 43.611436 }, "AR (dB)": { no_cal: 1.089296, cal: 1.053484 }, "SLL (dB)": { no_cal: 18.348541, cal: 18.348541 }, rotation_deg: 0.194694, deviations: [{ point: "PA", x: 0, y: 0, z: 0, mag: 0 }, { point: "PB", x: 0.008219, y: 0, z: -0.032047, mag: 0.033082 }] },
      "Structure 272.5° No Preload": { "Delta Gain (dB)": { no_cal: 0.691353, cal: 0.362113 }, "Delta AR (dB)": { no_cal: 0.08237, cal: 0.049476 }, "Delta SLL (dB)": { no_cal: 0.613044, cal: 0.613044 }, "Gain Tx band (dBi)": { no_cal: 43.308647, cal: 43.637887 }, "AR (dB)": { no_cal: 1.08237, cal: 1.049476 }, "SLL (dB)": { no_cal: 18.386956, cal: 18.386956 }, rotation_deg: 0.193048, deviations: [{ point: "PA", x: 0, y: 0, z: 0, mag: 0 }, { point: "PB", x: 0.008219, y: 0, z: -0.032047, mag: 0.033082 }] },
    },
    QV3: {
      "Flotron 90° Alignment": { "Delta Gain (dB)": { no_cal: 0.249709, cal: 0.154197 }, "Delta AR (dB)": { no_cal: 0.039434, cal: 0.024645 }, "Delta SLL (dB)": { no_cal: 0.316553, cal: 0.316553 }, "Gain Tx band (dBi)": { no_cal: 43.750291, cal: 43.845803 }, "AR (dB)": { no_cal: 1.039434, cal: 1.024645 }, "SLL (dB)": { no_cal: 18.683447, cal: 18.683447 }, rotation_deg: 0.140038, deviations: [{ point: "PA", x: 0, y: 0, z: 0, mag: 0 }, { point: "PB", x: -0.009427, y: 0, z: 0.003065, mag: 0.009913 }, { point: "PC", x: 0.010734, y: -0.014131, z: 0.004218, mag: 0.017977 }, { point: "PD", x: 0.047127, y: -0.040963, z: -0.005001, mag: 0.062645 }] },
      "Flotron 87.5°": { "Delta Gain (dB)": { no_cal: 0.258257, cal: 0.15835 }, "Delta AR (dB)": { no_cal: 0.039685, cal: 0.02481 }, "Delta SLL (dB)": { no_cal: 0.320695, cal: 0.320695 }, "Gain Tx band (dBi)": { no_cal: 43.741743, cal: 43.84165 }, "AR (dB)": { no_cal: 1.039685, cal: 1.02481 }, "SLL (dB)": { no_cal: 18.679305, cal: 18.679305 }, rotation_deg: 0.12671, deviations: [{ point: "PA", x: 0, y: 0, z: 0, mag: 0 }, { point: "PB", x: -0.021019, y: 0, z: -0.015162, mag: 0.025973 }] },
      "Flotron 272.5°": { "Delta Gain (dB)": { no_cal: 0.313548, cal: 0.176426 }, "Delta AR (dB)": { no_cal: 0.047063, cal: 0.029498 }, "Delta SLL (dB)": { no_cal: 0.374972, cal: 0.374972 }, "Gain Tx band (dBi)": { no_cal: 43.686452, cal: 43.823574 }, "AR (dB)": { no_cal: 1.047063, cal: 1.029498 }, "SLL (dB)": { no_cal: 18.625028, cal: 18.625028 }, rotation_deg: 0.141965, deviations: [{ point: "PA", x: 0, y: 0, z: 0, mag: 0 }, { point: "PB", x: -0.041558, y: 0, z: -0.056929, mag: 0.070509 }] },
      "Structure 272.5° No Preload": { "Delta Gain (dB)": { no_cal: 0.988516, cal: 0.457224 }, "Delta AR (dB)": { no_cal: 0.109148, cal: 0.063789 }, "Delta SLL (dB)": { no_cal: 0.764416, cal: 0.764416 }, "Gain Tx band (dBi)": { no_cal: 43.011484, cal: 43.542776 }, "AR (dB)": { no_cal: 1.109148, cal: 1.063789 }, "SLL (dB)": { no_cal: 18.235584, cal: 18.235584 }, rotation_deg: 0.25014, deviations: [{ point: "PA", x: 0, y: 0, z: 0, mag: 0 }, { point: "PB", x: -0.041558, y: 0, z: -0.056929, mag: 0.070509 }] },
      "Structure 87.5° PLM Installed": { "Delta Gain (dB)": { no_cal: 0.548981, cal: 0.271967 }, "Delta AR (dB)": { no_cal: 0.068052, cal: 0.040947 }, "Delta SLL (dB)": { no_cal: 0.528076, cal: 0.528076 }, "Gain Tx band (dBi)": { no_cal: 43.451019, cal: 43.728033 }, "AR (dB)": { no_cal: 1.068052, cal: 1.040947 }, "SLL (dB)": { no_cal: 18.471924, cal: 18.471924 }, rotation_deg: 0.143855, deviations: [{ point: "PA", x: 0, y: 0, z: 0, mag: 0 }, { point: "PB", x: 0.084984, y: 0, z: 0.021764, mag: 0.087433 }] },
    },
  },
};

// ─── File parser ──────────────────────────────────────────────────────────────
function parseFilename(name) {
  // e.g. FM4_QV1_Post_PLM_Preload_Post_HDRM_Preload_INT_1
  const fm = name.match(/FM(\d+)/i);
  const bb = name.match(/BB(\d+)/i);
  const qv = name.match(/QV(\d)/i);
  const int_ = name.match(/INT[_\s]?(\d+)/i);

  let fmNum = fm ? parseInt(fm[1]) : null;
  let bbNum = bb ? parseInt(bb[1]) : fmNum ? fmNum + 5 : null;
  if (!fmNum && bbNum) fmNum = bbNum - 5;

  const satKey = fmNum ? `FM${fmNum} (BB${bbNum})` : name;
  const qvKey = qv ? `QV${qv[1]}` : null;
  const iteration = int_ ? parseInt(int_[1]) : 1;

  // Parse phase from filename parts
  const lower = name.toLowerCase();
  let phase = "Flotron 90° Alignment";
  if (lower.includes("plm") && lower.includes("hdrm")) phase = "Structure 87.5° PLM Installed";
  else if (lower.includes("plm") && lower.includes("preload")) phase = "Structure 87.5° PLM Installed";
  else if (lower.includes("hdrm")) phase = "Structure 272.5° No Preload";
  else if (lower.includes("272") || lower.includes("272.5")) phase = "Flotron 272.5°";
  else if (lower.includes("87") || lower.includes("87.5")) phase = "Flotron 87.5°";
  else if (lower.includes("preload")) phase = "Structure 87.5° Preload";
  else if (lower.includes("alignment") || lower.includes("90")) phase = "Flotron 90° Alignment";

  return { satKey, fmNum, bbNum, qvKey, phase, iteration };
}

function parseTxtContent(text) {
  const points = {};
  text.split("\n").forEach(line => {
    line = line.trim().replace(/\r/, "");
    if (!line) return;
    const parts = line.split(",").map(s => s.trim());
    if (parts.length < 4) return;
    const label = parts[0].toLowerCase();
    const x = parseFloat(parts[1]);
    const y = parseFloat(parts[2]);
    const z = parseFloat(parts[3]);
    points[label] = { x, y, z };
  });
  return points;
}

// Nominal SMR positions (from SENER calculator)
const NOMINAL = {
  pa: { x: 0, y: 0, z: 0 },
  pb: { x: 225, y: 0, z: 0 },
  pc: { x: 0, y: -112.614, z: 0 },
  pd: { x: 125, y: -112.64, z: 0 },
  p1: { x: 225, y: 530.476, z: -470.739 },
  p2: { x: 247, y: 516.997, z: -488.126 },
  p4: { x: 247, y: 569.794, z: -529.059 },
};

function computeDeviations(measured) {
  return Object.entries(measured).map(([key, val]) => {
    const nom = NOMINAL[key];
    if (!nom) return null;
    const dx = val.x - nom.x;
    const dy = val.y - nom.y;
    const dz = val.z - nom.z;
    const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return { point: key.toUpperCase(), x: +dx.toFixed(6), y: +dy.toFixed(6), z: +dz.toFixed(6), mag: +mag.toFixed(6) };
  }).filter(Boolean);
}

// Color palette
const COLORS = {
  QV1: "#00d4ff",
  QV2: "#ff6b35",
  QV3: "#a8ff3e",
  bg: "#0a0e1a",
  surface: "#111827",
  surfaceHover: "#1a2333",
  border: "#1e2d45",
  text: "#e2e8f0",
  muted: "#64748b",
  accent: "#0ea5e9",
  warn: "#f59e0b",
  danger: "#ef4444",
  good: "#22c55e",
};

const PHASE_SHORT = {
  "Flotron 90° Alignment": "F-90°",
  "Flotron 87.5°": "F-87.5°",
  "Flotron 272.5°": "F-272.5°",
  "Structure 272.5° No Preload": "S-272.5°",
  "Structure 87.5° Preload": "S-87.5°",
  "Structure 87.5° PLM Installed": "S-PLM",
  "Structure 87.5° Preload 2nd": "S-87.5° 2nd",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({ label, value, unit, isGood, isMed }) {
  const color = value === null ? COLORS.muted : isGood ? COLORS.good : isMed ? COLORS.warn : COLORS.danger;
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "12px 16px", minWidth: 120 }}>
      <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>
        {value === null ? "—" : value.toFixed(4)}
        <span style={{ fontSize: 12, color: COLORS.muted, marginLeft: 4 }}>{unit}</span>
      </div>
    </div>
  );
}

function PhaseSelector({ phases, selected, onSelect }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
      {phases.map(p => (
        <button key={p} onClick={() => onSelect(p)}
          style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontWeight: selected === p ? 700 : 400,
            background: selected === p ? COLORS.accent : COLORS.surface,
            color: selected === p ? "#fff" : COLORS.muted,
            border: `1px solid ${selected === p ? COLORS.accent : COLORS.border}`,
            transition: "all 0.15s" }}>
          {PHASE_SHORT[p] || p}
        </button>
      ))}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e2d45", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <div style={{ color: COLORS.muted, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <b>{typeof p.value === "number" ? p.value.toFixed(4) : p.value}</b>
        </div>
      ))}
    </div>
  );
}

// ─── Upload Panel ─────────────────────────────────────────────────────────────
function UploadPanel({ onUpload }) {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const meta = parseFilename(file.name);
      const points = parseTxtContent(e.target.result);
      const devs = computeDeviations(points);
      onUpload({ meta, points, deviations: devs, filename: file.name });
    };
    reader.readAsText(file);
  };

  return (
    <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); [...e.dataTransfer.files].forEach(handleFile); }}
      onClick={() => fileRef.current.click()}
      style={{ border: `2px dashed ${dragging ? COLORS.accent : COLORS.border}`, borderRadius: 12, padding: "28px 20px",
        textAlign: "center", cursor: "pointer", background: dragging ? "#0ea5e912" : "transparent",
        transition: "all 0.2s", userSelect: "none" }}>
      <input ref={fileRef} type="file" accept=".txt" multiple style={{ display: "none" }}
        onChange={(e) => [...e.target.files].forEach(handleFile)} />
      <div style={{ fontSize: 28, marginBottom: 8 }}>📡</div>
      <div style={{ color: COLORS.text, fontWeight: 600, marginBottom: 4 }}>Drop laser tracker TXT files</div>
      <div style={{ color: COLORS.muted, fontSize: 12 }}>e.g. FM4_QV1_Post_PLM_Preload_INT_1.txt</div>
    </div>
  );
}

// ─── Deviation Table ──────────────────────────────────────────────────────────
function DeviationTable({ deviations }) {
  if (!deviations?.length) return <div style={{ color: COLORS.muted, fontSize: 13 }}>No deviation data</div>;
  const tol = 0.3; // mm rough tolerance
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
      <thead>
        <tr style={{ color: COLORS.muted, borderBottom: `1px solid ${COLORS.border}` }}>
          {["Point", "ΔX (mm)", "ΔY (mm)", "ΔZ (mm)", "|Δ| (mm)"].map(h => (
            <th key={h} style={{ padding: "6px 8px", textAlign: "right", fontWeight: 500 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {deviations.map((d, i) => {
          const over = d.mag > tol;
          return (
            <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}22`, background: over ? "#ef444408" : "transparent" }}>
              <td style={{ padding: "5px 8px", color: COLORS.accent, fontWeight: 700 }}>{d.point}</td>
              {[d.x, d.y, d.z, d.mag].map((v, j) => (
                <td key={j} style={{ padding: "5px 8px", textAlign: "right",
                  color: j === 3 ? (over ? COLORS.danger : COLORS.good) : COLORS.text }}>
                  {v !== null ? v.toFixed(4) : "—"}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function QVDashboard() {
  const [allData, setAllData] = useState(INITIAL_DATA);
  const [selectedSat, setSelectedSat] = useState("FM3 (BB8)");
  const [selectedQV, setSelectedQV] = useState("QV1");
  const [selectedPhase, setSelectedPhase] = useState("Flotron 90° Alignment");
  const [compareMode, setCompareMode] = useState(false);
  const [calMode, setCalMode] = useState(false);
  const [uploadLog, setUploadLog] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  const handleUpload = useCallback((parsed) => {
    const { meta, points, deviations, filename } = parsed;
    const { satKey, qvKey, phase, fmNum, bbNum } = meta;
    if (!satKey || !qvKey || !phase) {
      setUploadLog(l => [...l, { filename, status: "error", msg: "Could not parse filename" }]);
      return;
    }
    setAllData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[satKey]) next[satKey] = { satellite: `FM${fmNum}`, bbName: `BB${bbNum}`, QV1: {}, QV2: {}, QV3: {} };
      if (!next[satKey][qvKey]) next[satKey][qvKey] = {};
      next[satKey][qvKey][phase] = {
        "Delta Gain (dB)": { no_cal: null, cal: null },
        "Delta AR (dB)": { no_cal: null, cal: null },
        "Delta SLL (dB)": { no_cal: null, cal: null },
        "Gain Tx band (dBi)": { no_cal: null, cal: null },
        deviations,
        measured_points: points,
      };
      return next;
    });
    setUploadLog(l => [...l, {
      filename, status: "ok",
      msg: `→ ${satKey} / ${qvKey} / ${PHASE_SHORT[phase] || phase}`
    }]);
    setSelectedSat(satKey);
    setSelectedQV(qvKey);
    setSelectedPhase(phase);
  }, []);

  const satellites = Object.keys(allData);
  const satData = allData[selectedSat] || {};
  const qvData = satData[selectedQV] || {};
  const allPhases = Object.keys(qvData);
  const phaseData = qvData[selectedPhase] || {};
  const calKey = calMode ? "cal" : "no_cal";

  // Chart data for RF trends across phases
  const trendData = allPhases.map(ph => ({
    phase: PHASE_SHORT[ph] || ph,
    phaseFull: ph,
    "Delta Gain": phaseData["Delta Gain (dB)"]?.[calKey],
    ...(qvData[ph] ? {
      "Delta Gain": qvData[ph]["Delta Gain (dB)"]?.[calKey],
      "Delta AR": qvData[ph]["Delta AR (dB)"]?.[calKey],
      "Delta SLL": qvData[ph]["Delta SLL (dB)"]?.[calKey],
      Rotation: qvData[ph].rotation_deg,
    } : {}),
  }));

  // Compare all 3 QVs at current phase
  const compareData = ["QV1", "QV2", "QV3"].map(qv => {
    const d = satData[qv]?.[selectedPhase];
    return {
      qv,
      "Delta Gain": d?.["Delta Gain (dB)"]?.[calKey] ?? null,
      "Delta AR": d?.["Delta AR (dB)"]?.[calKey] ?? null,
      "Delta SLL": d?.["Delta SLL (dB)"]?.[calKey] ?? null,
      Rotation: d?.rotation_deg ?? null,
    };
  });

  const gainVal = phaseData["Delta Gain (dB)"]?.[calKey];
  const arVal = phaseData["Delta AR (dB)"]?.[calKey];
  const sllVal = phaseData["Delta SLL (dB)"]?.[calKey];
  const gainTx = phaseData["Gain Tx band (dBi)"]?.[calKey];
  const rot = phaseData.rotation_deg;

  const tabStyle = (t) => ({
    padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: activeTab === t ? 700 : 400,
    color: activeTab === t ? COLORS.accent : COLORS.muted,
    borderBottom: `2px solid ${activeTab === t ? COLORS.accent : "transparent"}`,
    background: "transparent", border: "none", outline: "none",
  });

  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, minHeight: "100vh", fontFamily: "'Inter', 'Segoe UI', sans-serif", fontSize: 14 }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "#070b14", borderBottom: `1px solid ${COLORS.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📡</div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em" }}>QV Antenna Alignment Dashboard</div>
          <div style={{ color: COLORS.muted, fontSize: 11 }}>SENER Calculator · Laser Tracker · CSAT Assembly</div>
        </div>
        <div style={{ flex: 1 }} />
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: COLORS.muted }}>
          <span>With Calibration</span>
          <div onClick={() => setCalMode(c => !c)}
            style={{ width: 38, height: 20, borderRadius: 10, background: calMode ? COLORS.accent : COLORS.border, position: "relative", cursor: "pointer", transition: "background 0.2s" }}>
            <div style={{ position: "absolute", top: 2, left: calMode ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
          </div>
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 0, height: "calc(100vh - 65px)" }}>

        {/* Sidebar */}
        <div style={{ background: "#0d1424", borderRight: `1px solid ${COLORS.border}`, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Satellite selector */}
          <div>
            <div style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Satellite</div>
            {satellites.map(s => (
              <div key={s} onClick={() => { setSelectedSat(s); setSelectedPhase("Flotron 90° Alignment"); }}
                style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 4, fontWeight: selectedSat === s ? 600 : 400,
                  background: selectedSat === s ? "#0ea5e915" : "transparent",
                  border: `1px solid ${selectedSat === s ? COLORS.accent : "transparent"}`,
                  color: selectedSat === s ? COLORS.accent : COLORS.text }}>
                {s}
              </div>
            ))}
          </div>

          {/* QV selector */}
          <div>
            <div style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>QV Antenna</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["QV1", "QV2", "QV3"].map(qv => (
                <button key={qv} onClick={() => setSelectedQV(qv)}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer", fontWeight: selectedQV === qv ? 700 : 400, fontSize: 13,
                    background: selectedQV === qv ? COLORS[qv] + "22" : COLORS.surface,
                    color: selectedQV === qv ? COLORS[qv] : COLORS.muted,
                    border: `1px solid ${selectedQV === qv ? COLORS[qv] : COLORS.border}` }}>
                  {qv}
                </button>
              ))}
            </div>
          </div>

          {/* Phase selector */}
          <div>
            <div style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Measurement Phase</div>
            {allPhases.map(ph => (
              <div key={ph} onClick={() => setSelectedPhase(ph)}
                style={{ padding: "7px 12px", borderRadius: 7, cursor: "pointer", marginBottom: 3, fontSize: 12,
                  background: selectedPhase === ph ? "#0ea5e912" : "transparent",
                  borderLeft: `3px solid ${selectedPhase === ph ? COLORS.accent : "transparent"}`,
                  color: selectedPhase === ph ? COLORS.text : COLORS.muted }}>
                {PHASE_SHORT[ph] || ph}
              </div>
            ))}
          </div>

          {/* Upload */}
          <div>
            <div style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Upload Measurement</div>
            <UploadPanel onUpload={handleUpload} />
          </div>

          {/* Upload log */}
          {uploadLog.length > 0 && (
            <div style={{ maxHeight: 140, overflowY: "auto" }}>
              {uploadLog.slice(-6).map((l, i) => (
                <div key={i} style={{ fontSize: 11, color: l.status === "ok" ? COLORS.good : COLORS.danger, marginBottom: 4, fontFamily: "monospace" }}>
                  {l.status === "ok" ? "✓" : "✗"} {l.msg}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{ overflowY: "auto", padding: 20 }}>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700 }}>
              {selectedSat} · <span style={{ color: COLORS[selectedQV] }}>{selectedQV}</span>
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: "3px 12px" }}>
              {PHASE_SHORT[selectedPhase] || selectedPhase}
            </div>
            <div style={{ fontSize: 11, color: calMode ? COLORS.good : COLORS.warn, background: (calMode ? COLORS.good : COLORS.warn) + "15", border: `1px solid ${calMode ? COLORS.good : COLORS.warn}`, borderRadius: 20, padding: "3px 10px" }}>
              {calMode ? "With Calibration" : "No Calibration"}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${COLORS.border}`, marginBottom: 20 }}>
            {["overview", "trends", "compare", "deviations"].map(t => (
              <button key={t} style={tabStyle(t)} onClick={() => setActiveTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
                <MetricCard label="Delta Gain" value={gainVal} unit="dB" isGood={gainVal < 0.3} isMed={gainVal < 0.5} />
                <MetricCard label="Delta AR" value={arVal} unit="dB" isGood={arVal < 0.05} isMed={arVal < 0.1} />
                <MetricCard label="Delta SLL" value={sllVal} unit="dB" isGood={sllVal < 0.4} isMed={sllVal < 0.6} />
                <MetricCard label="Gain Tx Band" value={gainTx} unit="dBi" isGood={gainTx > 43.5} isMed={gainTx > 43.0} />
                <MetricCard label="Feed Rotation" value={rot} unit="°" isGood={rot < 0.15} isMed={rot < 0.3} />
              </div>

              {/* Radar chart */}
              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>RF Performance Radar — All 3 QVs at {PHASE_SHORT[selectedPhase] || selectedPhase}</div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={[
                    { metric: "ΔGain", ...Object.fromEntries(["QV1","QV2","QV3"].map(qv => [qv, satData[qv]?.[selectedPhase]?.["Delta Gain (dB)"]?.[calKey] ?? 0])) },
                    { metric: "ΔAR", ...Object.fromEntries(["QV1","QV2","QV3"].map(qv => [qv, (satData[qv]?.[selectedPhase]?.["Delta AR (dB)"]?.[calKey] ?? 0) * 5])) },
                    { metric: "ΔSLL", ...Object.fromEntries(["QV1","QV2","QV3"].map(qv => [qv, satData[qv]?.[selectedPhase]?.["Delta SLL (dB)"]?.[calKey] ?? 0])) },
                    { metric: "Rotation", ...Object.fromEntries(["QV1","QV2","QV3"].map(qv => [qv, (satData[qv]?.[selectedPhase]?.rotation_deg ?? 0) * 3])) },
                  ]}>
                    <PolarGrid stroke={COLORS.border} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: COLORS.muted, fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 1.2]} tick={false} axisLine={false} />
                    {["QV1","QV2","QV3"].map(qv => (
                      <Radar key={qv} name={qv} dataKey={qv} stroke={COLORS[qv]} fill={COLORS[qv]} fillOpacity={0.12} strokeWidth={2} />
                    ))}
                    <Legend wrapperStyle={{ color: COLORS.muted, fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Deviation summary */}
              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>SMR Deviations from Nominal</div>
                <DeviationTable deviations={phaseData.deviations} />
              </div>
            </div>
          )}

          {/* TRENDS TAB */}
          {activeTab === "trends" && (
            <div>
              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Delta Gain Across Integration Phases — {selectedQV}</div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trendData} margin={{ left: 0, right: 10 }}>
                    <CartesianGrid stroke={COLORS.border} strokeDasharray="4 4" />
                    <XAxis dataKey="phase" tick={{ fill: COLORS.muted, fontSize: 11 }} />
                    <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} tickFormatter={v => v.toFixed(3)} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0.5} stroke={COLORS.warn} strokeDasharray="5 3" label={{ value: "0.5 dB", fill: COLORS.warn, fontSize: 10 }} />
                    <Line type="monotone" dataKey="Delta Gain" stroke={COLORS[selectedQV]} strokeWidth={2} dot={{ fill: COLORS[selectedQV], r: 4 }} name="ΔGain (dB)" connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Delta AR Trend</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={trendData}>
                      <CartesianGrid stroke={COLORS.border} strokeDasharray="4 4" />
                      <XAxis dataKey="phase" tick={{ fill: COLORS.muted, fontSize: 10 }} />
                      <YAxis tick={{ fill: COLORS.muted, fontSize: 10 }} tickFormatter={v => v.toFixed(3)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="Delta AR" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} name="ΔAR (dB)" connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Feed Rotation Trend</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={trendData}>
                      <CartesianGrid stroke={COLORS.border} strokeDasharray="4 4" />
                      <XAxis dataKey="phase" tick={{ fill: COLORS.muted, fontSize: 10 }} />
                      <YAxis tick={{ fill: COLORS.muted, fontSize: 10 }} tickFormatter={v => v.toFixed(3)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="Rotation" stroke="#fb923c" strokeWidth={2} dot={{ r: 3 }} name="Rotation (°)" connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* COMPARE TAB */}
          {activeTab === "compare" && (
            <div>
              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  QV1 vs QV2 vs QV3 — {PHASE_SHORT[selectedPhase] || selectedPhase}
                </div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 16 }}>Select a phase from the sidebar to compare all antennas at that integration step</div>
                <PhaseSelector phases={allPhases} selected={selectedPhase} onSelect={setSelectedPhase} />
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={compareData} margin={{ left: 0, right: 10 }}>
                    <CartesianGrid stroke={COLORS.border} strokeDasharray="4 4" />
                    <XAxis dataKey="qv" tick={{ fill: COLORS.muted, fontSize: 12 }} />
                    <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} tickFormatter={v => v.toFixed(3)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: COLORS.muted, fontSize: 12 }} />
                    <ReferenceLine y={0.5} stroke={COLORS.warn} strokeDasharray="5 3" />
                    <Bar dataKey="Delta Gain" fill={COLORS.accent} name="ΔGain (dB)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Delta AR" fill="#a78bfa" name="ΔAR (dB)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Delta SLL" fill="#fb923c" name="ΔSLL (dB)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Side-by-side metric cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {["QV1", "QV2", "QV3"].map(qv => {
                  const d = satData[qv]?.[selectedPhase];
                  const g = d?.["Delta Gain (dB)"]?.[calKey];
                  const r = d?.rotation_deg;
                  return (
                    <div key={qv} style={{ background: COLORS.surface, border: `1px solid ${COLORS[qv]}44`, borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: COLORS[qv], marginBottom: 12, fontFamily: "'Space Grotesk', sans-serif" }}>{qv}</div>
                      {[["Delta Gain", d?.["Delta Gain (dB)"]?.[calKey], "dB", 0.5],
                        ["Delta AR", d?.["Delta AR (dB)"]?.[calKey], "dB", 0.1],
                        ["Delta SLL", d?.["Delta SLL (dB)"]?.[calKey], "dB", 0.6],
                        ["Gain Tx", d?.["Gain Tx band (dBi)"]?.[calKey], "dBi", null],
                        ["Rotation", r, "°", 0.3],
                      ].map(([label, val, unit, tol]) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontSize: 11, color: COLORS.muted }}>{label}</span>
                          <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600,
                            color: val === null ? COLORS.muted : tol ? (val > tol ? COLORS.danger : COLORS.good) : COLORS.text }}>
                            {val !== null ? val.toFixed(4) : "—"} <span style={{ fontSize: 10, color: COLORS.muted }}>{unit}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DEVIATIONS TAB */}
          {activeTab === "deviations" && (
            <div>
              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  SMR Point Deviations from Nominal — {selectedQV} / {PHASE_SHORT[selectedPhase] || selectedPhase}
                </div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 16 }}>
                  Measured positions of 7 SMRs (PA–PD on azimuth bracket, P1/P2/P4 on feed) relative to nominal. Magnitude &gt;0.3mm flagged.
                </div>
                <PhaseSelector phases={allPhases} selected={selectedPhase} onSelect={setSelectedPhase} />
                <DeviationTable deviations={phaseData.deviations} />
              </div>

              {/* Bar chart of magnitudes */}
              {phaseData.deviations?.length > 0 && (
                <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Deviation Magnitudes</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={phaseData.deviations.map(d => ({ point: d.point, mag: d.mag }))}>
                      <CartesianGrid stroke={COLORS.border} strokeDasharray="4 4" />
                      <XAxis dataKey="point" tick={{ fill: COLORS.muted, fontSize: 12 }} />
                      <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} tickFormatter={v => v.toFixed(3)} unit=" mm" />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={0.3} stroke={COLORS.warn} strokeDasharray="5 3" label={{ value: "0.3 mm", fill: COLORS.warn, fontSize: 10 }} />
                      <Bar dataKey="mag" name="Magnitude (mm)" radius={[4,4,0,0]}
                        fill={COLORS.accent}
                        label={{ position: "top", formatter: v => v.toFixed(3), fill: COLORS.muted, fontSize: 10 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
