import { useState, useCallback, useRef, useEffect } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ReferenceLine } from "recharts";


// ─── Data loading: fetch BB data from /public/data instead of a hardcoded blob ──
// Each BB gets its own JSON file at public/data/<BB>.json, listed in public/data/manifest.json.
// This lets you add/edit BB data by dropping files into the repo — no code changes needed.
const DATA_BASE = `${import.meta.env.BASE_URL}data/`;

async function loadAllData() {
  const manifestRes = await fetch(`${DATA_BASE}manifest.json`, {cache:"no-store"});
  if(!manifestRes.ok) throw new Error(`Could not load manifest.json (${manifestRes.status})`);
  const manifest = await manifestRes.json();
  const entries = await Promise.all(manifest.map(async ({bbName, file}) => {
    const res = await fetch(`${DATA_BASE}${file}`, {cache:"no-store"});
    if(!res.ok) throw new Error(`Could not load ${file} (${res.status})`);
    return [bbName, await res.json()];
  }));
  return Object.fromEntries(entries);
}

// ─── Local draft persistence ────────────────────────────────────────────────────
// Uploaded-but-not-yet-exported data lives here so a refresh doesn't lose it before
// you've had a chance to save it to the repo. This is just a safety net — the repo
// JSON files (via Export below) are the real source of truth.
const DRAFT_KEY = "qv-dashboard-draft-v1";
function loadDraft(){ try{ const raw=localStorage.getItem(DRAFT_KEY); return raw?JSON.parse(raw):{}; }catch{ return {}; } }
function saveDraft(data){ try{ localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); }catch{} }
function clearDraft(){ try{ localStorage.removeItem(DRAFT_KEY); }catch{} }

// ─── Export helper: downloads a BB's data as a JSON file ready to drop into
// public/data/<BB>.json in the repo ─────────────────────────────────────────────
function downloadJSON(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const CANONICAL_PHASES = [
  "Flotron 90° — Alignment",
  "Flotron 87.5° — Baseline",
  "Flotron 272.5° — Baseline",
  "Structure 272.5° — Initial Install",
  "Structure 87.5° — PLM Installed",
  "Structure 87.5° — PLM Preload",
  "Structure 87.5° — HDRM Preload (Pre-Vibe)",
  "Structure 87.5° — Post Vibe",
];
const BLANK_PHASE_DATA = {dx:null,dy:null,dz:null,rot_deg:null,mag:null,rf:{},deviations:[]};
function getCanonicalPhaseData(qvData) {
  const result = {};
  for(const ph of CANONICAL_PHASES) result[ph] = qvData[ph] || BLANK_PHASE_DATA;
  for(const ph of Object.keys(qvData)) if(!result[ph]) result[ph]=qvData[ph];
  return result;
}


// ─── Nominal SMR positions ────────────────────────────────────────────────────
const NOMINAL = {
  pa:{x:0,y:0,z:0}, pb:{x:225,y:0,z:0}, pc:{x:0,y:-112.614,z:0}, pd:{x:125,y:-112.64,z:0},
  p1:{x:225,y:530.476,z:-470.739}, p2:{x:247,y:516.997,z:-488.126}, p4:{x:247,y:569.794,z:-529.059},
};

// ─── Alignment maths (matches SENER Feed_Alignment MATLAB script) ─────────────
function tr3(M){return[[M[0][0],M[1][0],M[2][0]],[M[0][1],M[1][1],M[2][1]],[M[0][2],M[1][2],M[2][2]]];}
function mm3(A,B){return A.map((r,i)=>B[0].map((_,j)=>r.reduce((s,_,k)=>s+A[i][k]*B[k][j],0)));}
function mv3(M,v){return M.map(r=>r.reduce((s,mij,j)=>s+mij*v[j],0));}
function dot3(a,b){return a.reduce((s,v,i)=>s+v*b[i],0);}

function inv6(A) {
  const n=6;
  const aug=A.map((r,i)=>[...r,...Array(n).fill(0).map((_,j)=>j===i?1:0)]);
  for(let col=0;col<n;col++){
    let maxRow=col;
    for(let row=col+1;row<n;row++) if(Math.abs(aug[row][col])>Math.abs(aug[maxRow][col])) maxRow=row;
    [aug[col],aug[maxRow]]=[aug[maxRow],aug[col]];
    const piv=aug[col][col];
    for(let j=0;j<2*n;j++) aug[col][j]/=piv;
    for(let row=0;row<n;row++) if(row!==col){const f=aug[row][col];for(let j=0;j<2*n;j++) aug[row][j]-=f*aug[col][j];}
  }
  return aug.map(r=>r.slice(n));
}

function computeAlignment(pts, linearGain=1.0) {
  // Exact port of SENER Feed_Alignment MATLAB script.
  // pts: {pa,pb,pc,pd,p1,p2,p4} each [x,y,z] in laser tracker frame.

  const {pa,pb,pc,pd,p1,p2,p4} = pts;

  // Nominal positions (from SENER script)
  const nom_bk = [[0,0,0],[225,0,0],[0,-112.614,0],[125,-112.64,0]];
  const nom1=[225,530.476,-470.739], nom2=[247,516.997,-488.126], nom4=[247,569.794,-529.059];

  // ── smallAngleFit helper ──────────────────────────────────────────────────
  // Solves: meas_i ≈ nom_i + t + theta × nom_i  (least squares)
  // Returns {t:[3], theta:[3]}
  function smallAngleFit(meas, noms) {
    // Build (n*3) x 6 matrix A and rhs b
    // Row for each dim d of point i: [I_d | (nom x ·)_d]
    // i.e. A[3i+0] = [1,0,0,  0,       nom[2], -nom[1]]
    //      A[3i+1] = [0,1,0, -nom[2],  0,       nom[0]]
    //      A[3i+2] = [0,0,1,  nom[1], -nom[0],  0     ]
    const n = meas.length;
    const A = [], b = [];
    for(let i=0;i<n;i++){
      const m=meas[i], o=noms[i];
      A.push([1,0,0,  0,     o[2], -o[1]]); b.push(m[0]-o[0]);
      A.push([0,1,0, -o[2],  0,    o[0]]); b.push(m[1]-o[1]);
      A.push([0,0,1,  o[1], -o[0], 0   ]); b.push(m[2]-o[2]);
    }
    // Normal equations: (A^T A) x = A^T b
    const AT = A[0].map((_,c)=>A.map(r=>r[c]));  // 6×(n*3)
    const ATA = AT.map(r1=>Array.from({length:6},(_,j)=>r1.reduce((s,v,k)=>s+v*AT[j][k],0)));
    const ATb = AT.map(r=>r.reduce((s,v,k)=>s+v*b[k],0));
    const x = solveLinear6(ATA, ATb);
    return {t:x.slice(0,3), theta:x.slice(3,6)};
  }

  // ── Step 1: Bracket fit ───────────────────────────────────────────────────
  const {t:t_bk, theta:th_bk} = smallAngleFit([pa,pb,pc,pd], nom_bk);
  const [rx,ry,rz] = th_bk;
  // Small-angle rotation matrix
  const R_bk = [[1,-rz,ry],[rz,1,-rx],[-ry,rx,1]];

  const mv = (R,v) => R.map(row=>row.reduce((s,r,j)=>s+r*v[j],0));

  // ── Step 2: Transform nominal feed positions through bracket transform ────
  // (not used directly for actuators but defines what "correct" looks like)
  // const p1_obj = mv(R_bk, nom1).map((v,i)=>v+t_bk[i]);  // available if needed

  // ── Step 3: Feed motion fit ───────────────────────────────────────────────
  // Fit measured feed [p1,p2,p4] against their nominals
  // t_mot = required translation, theta_mot = required rotation
  const {t:t_mot, theta:theta_mot} = smallAngleFit([p1,p2,p4], [nom1,nom2,nom4]);
  const [Th_X, Th_Y, Th_Z] = theta_mot;

  // ── Step 4: Transform to actuator local frame via R_LT ───────────────────
  // R_LT: hardcoded from SENER script (LT frame → actuator local frame)
  const R_LT = [
    [ 0.9659, -0.2044,  0.1587],
    [ 0.2588,  0.7634, -0.5919],
    [-0.00018, 0.6128,  0.7903]
  ];
  const aux1 = mv(R_LT, t_mot);
  const aux2 = mv(R_LT, theta_mot);
  const DOF = [...aux1.map(v=>v*linearGain), ...aux2];

  // ── Step 5: Map through actuator matrix ──────────────────────────────────
  const Arm_X=111.6, Arm_Y=126.7, Arm_Z=92.3;
  const act2DOF = [
    [-1, 0, 0, 0,            Arm_Z/87.25,  Arm_Y/91.41],
    [ 0, 1, 0, Arm_Z/87.25, 0,            -Arm_X/91.41],
    [ 0, 0, 1, Arm_Y/87.25,-Arm_X/87.25,  0           ],
    [ 0, 0, 0,-1/91.41,     0,             0           ],
    [ 0, 0, 0, 0,            1/87.25,      0           ],
    [ 0, 0, 0, 0,            0,            1/87.25     ],
  ];
  const DOF2act = inv6(act2DOF);
  const act = DOF2act.map(row=>row.reduce((s,v,j)=>s+v*DOF[j],0));

  // ── Step 6: Sign conventions (from SENER MATLAB) ─────────────────────────
  const A1 = -act[0], A2 = act[1], A3 = -act[2];
  const A4 =  act[3], A5 = act[5], A6 = -act[4];

  // ── Pure-translation fallback if rotations converged (|A4,5,6| < 0.05) ──
  const rotConverged = Math.abs(A4)<0.05 && Math.abs(A5)<0.05 && Math.abs(A6)<0.05;
  const linearConverged = Math.abs(A1)<0.1 && Math.abs(A2)<0.1 && Math.abs(A3)<0.1;

  // ── Delta X/Y/Z display values ────────────────────────────────────────────
  // Deviations of each measured feed point from nominal, rotated to local feed
  // frame (Rx = -52.2139° about X). Display the max absolute value per axis.
  const angle_f = -52.2139 * Math.PI / 180;
  const cosF = Math.cos(angle_f), sinF = Math.sin(angle_f);
  const Rf = [[1,0,0],[0,cosF,-sinF],[0,sinF,cosF]];

  function feedDevLocal(meas, nom) {
    const dev = meas.map((v,i)=>v-nom[i]);
    return mv(Rf, dev);
  }
  const d1 = feedDevLocal(p1, nom1);
  const d2 = feedDevLocal(p2, nom2);
  const d4 = feedDevLocal(p4, nom4);

  const dX = Math.max(Math.abs(d1[0]), Math.abs(d2[0]), Math.abs(d4[0]));
  const dY = Math.max(Math.abs(d1[1]), Math.abs(d2[1]), Math.abs(d4[1]));
  const dZ = Math.max(Math.abs(d1[2]), Math.abs(d2[2]), Math.abs(d4[2]));
  const dRot = Math.sqrt(Th_X*Th_X+Th_Y*Th_Y+Th_Z*Th_Z) * 180/Math.PI;

  const coordErrors = [
    {pt:'P1', ex:+d1[0].toFixed(4), ey:+d1[1].toFixed(4), ez:+d1[2].toFixed(4)},
    {pt:'P2', ex:+d2[0].toFixed(4), ey:+d2[1].toFixed(4), ez:+d2[2].toFixed(4)},
    {pt:'P4', ex:+d4[0].toFixed(4), ey:+d4[1].toFixed(4), ez:+d4[2].toFixed(4)},
  ];
  const deltaXYZ = {
    dX: +dX.toFixed(4), dY: +dY.toFixed(4),
    dZ: +dZ.toFixed(4), dRot: +dRot.toFixed(4)
  };

  const fmt = v => v>=0 ? `+${Math.abs(v).toFixed(3)}` : `-${Math.abs(v).toFixed(3)}`;
  const rotTxt = `1PR${fmt(A4)}\n1WS\n2PR${fmt(A5)}\n2WS\n3PR${fmt(A6)}`;
  const linTxt = `1PR${fmt(A1)}\n1WS\n2PR${fmt(A2)}\n2WS\n3PR${fmt(A3)}`;

  return {
    rotations: {A4:+A4.toFixed(4), A5:+A5.toFixed(4), A6:+A6.toFixed(4)},
    linear:    {A1:+A1.toFixed(4), A2:+A2.toFixed(4), A3:+A3.toFixed(4)},
    coordErrors, deltaXYZ, rotConverged, linearConverged,
    rotTxt, linTxt, linearGain,
  };
}

// 6×6 linear system solver (Gaussian elimination with partial pivoting)
function solveLinear6(A, b) {
  const n = 6;
  const aug = A.map((r,i)=>[...r, b[i]]);
  for(let col=0;col<n;col++) {
    let maxRow=col;
    for(let row=col+1;row<n;row++) if(Math.abs(aug[row][col])>Math.abs(aug[maxRow][col])) maxRow=row;
    [aug[col],aug[maxRow]]=[aug[maxRow],aug[col]];
    const piv=aug[col][col];
    if(Math.abs(piv)<1e-14) continue;
    for(let j=col;j<=n;j++) aug[col][j]/=piv;
    for(let row=0;row<n;row++) if(row!==col){const f=aug[row][col];for(let j=col;j<=n;j++) aug[row][j]-=f*aug[col][j];}
  }
  return aug.map(r=>r[n]);
}

// ─── File parsers ─────────────────────────────────────────────────────────────
function parseTxt(text) {
  const pts={};
  text.split("\n").forEach(line=>{
    line=line.trim().replace(/\r/,"");
    if(!line) return;
    const p=line.split(",").map(s=>s.trim());
    if(p.length<4) return;
    pts[p[0].toLowerCase()]=[parseFloat(p[1]),parseFloat(p[2]),parseFloat(p[3])];
  });
  return pts;
}
function ptsToObj(pts){
  const m={};
  for(const [k,v] of Object.entries(pts)) m[k]={x:v[0],y:v[1],z:v[2]};
  return m;
}
function computeDeviations(pts){
  return Object.entries(pts).map(([key,val])=>{
    const nom=NOMINAL[key]; if(!nom) return null;
    const dx=val.x-nom.x,dy=val.y-nom.y,dz=val.z-nom.z;
    return {point:key.toUpperCase(),x:+dx.toFixed(4),y:+dy.toFixed(4),z:+dz.toFixed(4),mag:+Math.sqrt(dx*dx+dy*dy+dz*dz).toFixed(4)};
  }).filter(Boolean);
}
function parseFilename(name){
  const fm=name.match(/FM(\d+)/i), bb=name.match(/BB(\d+)/i), qv=name.match(/QV(\d)/i);
  let fmNum=fm?parseInt(fm[1]):null, bbNum=bb?parseInt(bb[1]):fmNum?fmNum+5:null;
  if(!fmNum&&bbNum) fmNum=bbNum-5;
  const satKey=bbNum?`BB${bbNum}`:name, qvKey=qv?`QV${qv[1]}`:null;
  const lower=name.toLowerCase();
  let phase="Flotron 90° — Alignment";
  if(lower.includes("postvibe")||(lower.includes("vibe")&&!lower.includes("pre"))) phase="Structure 87.5° — Post Vibe";
  else if(lower.includes("hdrm")) phase="Structure 87.5° — HDRM Preload (Pre-Vibe)";
  else if(lower.includes("plm")&&lower.includes("preload")) phase="Structure 87.5° — PLM Preload";
  else if(lower.includes("plm")) phase="Structure 87.5° — PLM Installed";
  else if(lower.includes("272")) phase="Structure 272.5° — Initial Install";
  else if(lower.includes("87")) phase="Flotron 87.5° — Baseline";
  return {satKey,fmNum,bbNum,qvKey,phase};
}
function copyText(text){
  try{navigator.clipboard.writeText(text);}catch(e){
    const el=document.createElement("textarea");el.value=text;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);
  }
}

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C={QV1:"#00d4ff",QV2:"#ff6b35",QV3:"#a8ff3e",bg:"#0a0e1a",surface:"#111827",border:"#1e2d45",text:"#e2e8f0",muted:"#64748b",accent:"#0ea5e9",warn:"#f59e0b",danger:"#ef4444",good:"#22c55e",info:"#a78bfa"};
const PHASE_SHORT={
  "Flotron 90° — Alignment":"F-90°",
  "Flotron 87.5° — Baseline":"F-87.5°",
  "Flotron 272.5° — Baseline":"F-272.5°",
  "Structure 272.5° — Initial Install":"S-272.5°",
  "Structure 87.5° — PLM Installed":"S-PLM",
  "Structure 87.5° — PLM Preload":"S-PLM PL",
  "Structure 87.5° — HDRM Preload (Pre-Vibe)":"S-HDRM",
  "Structure 87.5° — Post Vibe":"S-PostVibe",
};
const PHASE_FULL_LABELS = {
  "Flotron 90° — Alignment":                     "Flotron 90° — Alignment",
  "Flotron 87.5° — Baseline":                    "Flotron 87.5° — Baseline",
  "Flotron 272.5° — Baseline":                   "Flotron 272.5° — Baseline",
  "Structure 272.5° — Initial Install":           "Structure 272.5° — Initial Install",
  "Structure 87.5° — PLM Installed":             "Structure 87.5° — PLM Installed",
  "Structure 87.5° — PLM Preload":               "Structure 87.5° — PLM Preload",
  "Structure 87.5° — HDRM Preload (Pre-Vibe)":  "Structure 87.5° — HDRM Preload (Pre-Vibe)",
  "Structure 87.5° — Post Vibe":                 "Structure 87.5° — Post Vibe",
};
const NOM={"Gain Tx band (dBi)":44,"Gain Rx band (dBi)":45,"AR (dB)":1,"SLL (dB)":19};

// ─── Shared micro-components ──────────────────────────────────────────────────
function Tok({active,onClick,children,color}){
  return <button onClick={onClick} style={{padding:"4px 12px",borderRadius:20,fontSize:11,cursor:"pointer",background:active?(color||C.accent):C.surface,color:active?"#fff":C.muted,border:`1px solid ${active?(color||C.accent):C.border}`,transition:"all .15s"}}>{children}</button>;
}
function CT({active,payload,label}){
  if(!active||!payload?.length) return null;
  return <div style={{background:"#1e2d45",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:12}}>
    <div style={{color:C.muted,marginBottom:6}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color,marginBottom:2}}>{p.name}: <b>{typeof p.value==="number"?p.value.toFixed(4):p.value}</b></div>)}
  </div>;
}
function MetricCard({label,value,unit,nominal,higherIsBetter}){
  const diff=value!=null&&nominal!=null?value-nominal:null;
  const good=diff!=null?(higherIsBetter?diff>=-0.2:diff<=0.05):null;
  const med=diff!=null?(higherIsBetter?diff>=-0.5:diff<=0.15):null;
  const col=value==null?C.muted:good?C.good:med?C.warn:C.danger;
  return <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",minWidth:110,flex:"1 1 110px",maxWidth:160}}>
    <div style={{fontSize:10,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</div>
    <div style={{fontSize:20,fontWeight:700,color:col,fontFamily:"monospace"}}>{value==null?"—":value.toFixed(3)}<span style={{fontSize:11,color:C.muted,marginLeft:4}}>{unit}</span></div>
    {nominal&&value!=null&&<div style={{fontSize:10,color:C.muted,marginTop:3}}>Nom: {nominal} | Δ <span style={{color:col}}>{diff>=0?"+":""}{diff.toFixed(3)}</span></div>}
  </div>;
}
function DevTable({devs}){
  if(!devs?.length) return <div style={{color:C.muted,fontSize:13}}>No deviation data</div>;
  return <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,fontFamily:"monospace"}}>
    <thead><tr style={{color:C.muted,borderBottom:`1px solid ${C.border}`}}>
      {["Point","ΔX (mm)","ΔY (mm)","ΔZ (mm)","|Δ| (mm)"].map(h=><th key={h} style={{padding:"6px 8px",textAlign:"right",fontWeight:500}}>{h}</th>)}
    </tr></thead>
    <tbody>{devs.map((d,i)=>{const ov=d.mag>0.5;return(
      <tr key={i} style={{borderBottom:`1px solid ${C.border}22`,background:ov?"#ef444408":"transparent"}}>
        <td style={{padding:"5px 8px",color:C.accent,fontWeight:700}}>{d.point}</td>
        {[d.x,d.y,d.z,d.mag].map((v,j)=><td key={j} style={{padding:"5px 8px",textAlign:"right",color:j===3?(ov?C.danger:C.good):C.text}}>{v!=null?v.toFixed(4):"—"}</td>)}
      </tr>);})}
    </tbody>
  </table>;
}

// ─── Upload panel ──────────────────────────────────────────────────────────────
function UploadPanel({onUpload, label, icon}){
  const [drag,setDrag]=useState(false);
  const ref=useRef();
  const handle=(file)=>{
    const r=new FileReader();
    r.onload=(e)=>{
      const raw=parseTxt(e.target.result);
      const pObj=ptsToObj(raw);
      const meta=parseFilename(file.name);
      onUpload({meta,deviations:computeDeviations(pObj),rawPts:raw,filename:file.name});
    };
    r.readAsText(file);
  };
  return <div onDragOver={(e)=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
    onDrop={(e)=>{e.preventDefault();setDrag(false);[...e.dataTransfer.files].forEach(handle);}}
    onClick={()=>ref.current.click()}
    style={{border:`2px dashed ${drag?C.accent:C.border}`,borderRadius:12,padding:"20px 16px",textAlign:"center",cursor:"pointer",background:drag?"#0ea5e912":"transparent",transition:"all .2s"}}>
    <input ref={ref} type="file" accept=".txt" multiple style={{display:"none"}} onChange={(e)=>[...e.target.files].forEach(handle)}/>
    <div style={{fontSize:22,marginBottom:4}}>{icon||"📡"}</div>
    <div style={{color:C.text,fontWeight:600,marginBottom:2,fontSize:13}}>{label||"Drop laser tracker TXT files"}</div>
    <div style={{color:C.muted,fontSize:11}}>e.g. FM4_QV1_Post_PLM_Preload_INT_1</div>
  </div>;
}

// ─── Alignment Tool ────────────────────────────────────────────────────────────
function AlignmentPanel(){
  const [result,setResult]=useState(null);
  const [history,setHistory]=useState([]);
  const [gain,setGain]=useState(1.0);
  const [copied,setCopied]=useState("");

  const handleFile=({rawPts,filename})=>{
    const required=["pa","pb","pc","pd","p1","p2","p4"];
    if(!required.every(k=>rawPts[k])){alert("File missing SMR labels: "+required.filter(k=>!rawPts[k]).join(", "));return;}
    const ptsArr={pa:rawPts.pa,pb:rawPts.pb,pc:rawPts.pc,pd:rawPts.pd,p1:rawPts.p1,p2:rawPts.p2,p4:rawPts.p4};
    const res=computeAlignment(ptsArr, gain);
    setResult(res);
    setHistory(prev=>[...prev,{iter:prev.length+1,filename,...res}]);
  };

  const copy=(text,key)=>{copyText(text);setCopied(key);setTimeout(()=>setCopied(""),2000);};

  const AxisBlock=({label,axes,txt,copyKey,converged,color})=>(
    <div style={{background:C.surface,border:`2px solid ${converged?C.good:color}`,borderRadius:12,padding:16,flex:1}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontWeight:700,fontSize:13,color,fontFamily:"'Space Grotesk',sans-serif"}}>{label}</div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {converged&&<span style={{fontSize:10,color:C.good,background:C.good+"22",padding:"2px 8px",borderRadius:10}}>✓ In tolerance</span>}
          <button onClick={()=>copy(txt,copyKey)} style={{fontSize:11,padding:"3px 10px",borderRadius:6,cursor:"pointer",background:copied===copyKey?C.good:C.accent,color:"#fff",border:"none"}}>
            {copied===copyKey?"Copied!":"Copy"}
          </button>
        </div>
      </div>
      <div style={{fontFamily:"monospace",fontSize:12,background:"#070b14",borderRadius:8,padding:10,whiteSpace:"pre",color:C.text,lineHeight:1.8}}>{txt}</div>
      <div style={{display:"flex",gap:6,marginTop:10}}>
        {Object.entries(axes).map(([k,v])=>{
          const c=Math.abs(v)>0.5?C.danger:Math.abs(v)>0.1?C.warn:C.good;
          return <div key={k} style={{flex:1,background:"#070b14",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
            <div style={{fontSize:9,color:C.muted,marginBottom:2}}>{k}</div>
            <div style={{fontSize:16,fontWeight:700,fontFamily:"monospace",color:c}}>{v>=0?"+":""}{v.toFixed(3)}</div>
            <div style={{fontSize:9,color:C.muted}}>mm</div>
          </div>;
        })}
      </div>
    </div>
  );

  return <div>
    <div style={{marginBottom:16}}>
      <div style={{fontSize:11,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>Upload measurement — alignment commands computed automatically</div>
      <UploadPanel onUpload={handleFile} label="Drop SMR measurement (.txt)" icon="📐"/>
      <div style={{display:"flex",alignItems:"center",gap:10,marginTop:10}}>
        <span style={{fontSize:12,color:C.muted}}>Linear gain:</span>
        <input type="number" value={gain} step={0.05} min={0.7} max={1.3}
          onChange={e=>setGain(parseFloat(e.target.value)||1.0)}
          style={{width:65,padding:"3px 8px",borderRadius:6,background:C.surface,border:`1px solid ${C.border}`,color:C.text,fontSize:12}}/>
        <span style={{fontSize:10,color:C.muted}}>Tune 0.85–1.15 from historical residuals</span>
        {history.length>0&&<button onClick={()=>{setHistory([]);setResult(null);}} style={{marginLeft:"auto",fontSize:10,padding:"3px 8px",borderRadius:6,cursor:"pointer",background:C.surface,color:C.danger,border:`1px solid ${C.danger}`}}>Clear</button>}
      </div>
    </div>

    {result&&<>
      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
        {[["① Rotations first","#6366f1"],["→ Re-measure","#475569"],["② Linear moves","#0ea5e9"],["→ Re-measure","#475569"],["③ Repeat until converged","#22c55e"]].map(([l,col],i)=>(
          <div key={i} style={{padding:"5px 12px",borderRadius:20,background:col+"22",border:`1px solid ${col}`,fontSize:11,color:col,fontWeight:i%2===0?600:400}}>{l}</div>
        ))}
      </div>
      <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap"}}>
        <AxisBlock label="ROTATION PLATFORM (apply first)" axes={result.rotations} txt={result.rotTxt} copyKey="rot" converged={result.rotConverged} color="#6366f1"/>
        <AxisBlock label="LINEAR STAGE (after re-measurement)" axes={result.linear} txt={result.linTxt} copyKey="lin" converged={result.linearConverged} color={C.accent}/>
      </div>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Feed position errors in Az Bracket frame (nominal − measured)</div>
        {result.deltaXYZ&&<div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>
          {[["ΔX",result.deltaXYZ.dX,"mm"],["ΔY",result.deltaXYZ.dY,"mm"],["ΔZ",result.deltaXYZ.dZ,"mm"],["ΔRot",result.deltaXYZ.dRot,"°"]].map(([lbl,val,unit])=>{
            const thresh = unit==="°" ? 0.3 : 0.2;
            const col = Math.abs(val)<thresh ? C.good : Math.abs(val)<thresh*2 ? C.warn : C.danger;
            return <div key={lbl} style={{background:"#070b14",borderRadius:8,padding:"8px 14px",textAlign:"center"}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:3}}>{lbl}</div>
              <div style={{fontSize:16,fontWeight:700,fontFamily:"monospace",color:col}}>{val>=0?"+":""}{val.toFixed(4)}<span style={{fontSize:10,color:C.muted,marginLeft:3}}>{unit}</span></div>
            </div>;
          })}
        </div>}
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,fontFamily:"monospace"}}>
          <thead><tr style={{color:C.muted,borderBottom:`1px solid ${C.border}`}}>
            {["Point","Err X (mm)","Err Y (mm)","Err Z (mm)"].map(h=><th key={h} style={{padding:"5px 8px",textAlign:"right"}}>{h}</th>)}
          </tr></thead>
          <tbody>{result.coordErrors.map((row,i)=>(
            <tr key={i} style={{borderBottom:`1px solid ${C.border}22`}}>
              <td style={{padding:"5px 8px",color:C.accent,fontWeight:700}}>{row.pt}</td>
              {[row.ex,row.ey,row.ez].map((v,j)=><td key={j} style={{padding:"5px 8px",textAlign:"right",color:Math.abs(v)>0.5?C.danger:Math.abs(v)>0.2?C.warn:C.good}}>{v>=0?"+":""}{v.toFixed(4)}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>}

    {history.length>0&&<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:14}}>
      <div style={{fontSize:11,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>
        Alignment history — {history.length} iteration{history.length>1?"s":""}
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,fontFamily:"monospace",minWidth:650}}>
          <thead><tr style={{color:C.muted,borderBottom:`1px solid ${C.border}`}}>
            {["INT","File","A4 rot","A5 rot","A6 rot","A1 lin","A2 lin","A3 lin","Rot✓","Lin✓"].map(h=><th key={h} style={{padding:"5px 8px",textAlign:"right",whiteSpace:"nowrap"}}>{h}</th>)}
          </tr></thead>
          <tbody>{history.map((h,i)=>(
            <tr key={i} style={{borderBottom:`1px solid ${C.border}22`,background:i===history.length-1?"#0ea5e908":"transparent"}}>
              <td style={{padding:"4px 8px",color:C.accent,fontWeight:700}}>INT {h.iter}</td>
              <td style={{padding:"4px 8px",color:C.muted,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.filename}</td>
              {[h.rotations.A4,h.rotations.A5,h.rotations.A6].map((v,j)=><td key={j} style={{padding:"4px 8px",textAlign:"right",color:Math.abs(v)<0.05?C.good:Math.abs(v)<0.2?C.warn:C.danger}}>{v>=0?"+":""}{v.toFixed(3)}</td>)}
              {[h.linear.A1,h.linear.A2,h.linear.A3].map((v,j)=><td key={j} style={{padding:"4px 8px",textAlign:"right",color:Math.abs(v)<0.1?C.good:Math.abs(v)<0.3?C.warn:C.danger}}>{v>=0?"+":""}{v.toFixed(3)}</td>)}
              <td style={{padding:"4px 8px",textAlign:"right"}}>{h.rotConverged?<span style={{color:C.good}}>✓</span>:<span style={{color:C.danger}}>✗</span>}</td>
              <td style={{padding:"4px 8px",textAlign:"right"}}>{h.linearConverged?<span style={{color:C.good}}>✓</span>:<span style={{color:C.danger}}>✗</span>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {history.length>1&&<div style={{marginTop:14}}>
        <div style={{fontSize:10,color:C.muted,marginBottom:6}}>Convergence per iteration</div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={history.map(h=>({iter:`INT ${h.iter}`,"|A1|":Math.abs(h.linear.A1),"|A2|":Math.abs(h.linear.A2),"|A3|":Math.abs(h.linear.A3),"|A4|":Math.abs(h.rotations.A4),"|A5|":Math.abs(h.rotations.A5),"|A6|":Math.abs(h.rotations.A6)}))}>
            <CartesianGrid stroke={C.border} strokeDasharray="4 4"/>
            <XAxis dataKey="iter" tick={{fill:C.muted,fontSize:9}}/>
            <YAxis tick={{fill:C.muted,fontSize:9}} unit="mm"/>
            <Tooltip content={<CT/>}/>
            <ReferenceLine y={0.1} stroke={C.warn} strokeDasharray="4 3" label={{value:"0.1",fill:C.warn,fontSize:8}}/>
            {["|A1|","|A2|","|A3|"].map((k,i)=><Line key={k} type="monotone" dataKey={k} stroke={[C.QV1,C.QV2,C.QV3][i]} strokeWidth={2} dot={{r:3}} connectNulls/>)}
            {["|A4|","|A5|","|A6|"].map((k,i)=><Line key={k} type="monotone" dataKey={k} stroke={["#6366f1","#a78bfa","#c4b5fd"][i]} strokeWidth={1} strokeDasharray="4 2" dot={{r:2}} connectNulls/>)}
            <Legend wrapperStyle={{color:C.muted,fontSize:10}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>}
    </div>}
  </div>;
}

// ─── Position History Tab ──────────────────────────────────────────────────────
function PositionHistoryTab({satData, selQV, phases, selPhase, setSelPhase}){
  const [selAxis, setSelAxis] = useState("mag");
  const qvFull = getCanonicalPhaseData(satData[selQV]||{});

  const trendData = phases.map(ph=>{
    const d = qvFull[ph];
    return {
      phase: PHASE_SHORT[ph]||ph, phaseFull:ph,
      dx: d?.dx ?? null, dy: d?.dy ?? null, dz: d?.dz ?? null,
      mag: d?.mag ?? null, rot: d?.rot_deg ?? null,
    };
  });

  const phaseD = qvFull[selPhase] || {};

  // Tolerance lines
  const TOL = 1.5; // mm — visual reference, adjust as needed

  return <div>
    {/* Phase selector */}
    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:16}}>
      {phases.map(p=><Tok key={p} active={selPhase===p} onClick={()=>setSelPhase(p)}>{PHASE_SHORT[p]||p}</Tok>)}
    </div>

    {/* Current phase summary cards */}
    <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:16}}>
      {[["ΔX\'",phaseD.dx,"mm"],["\'ΔY\'",phaseD.dy,"mm"],["ΔZ\'",phaseD.dz,"mm"],["Magnitude",phaseD.mag,"mm"],["Rotation",phaseD.rot_deg,"°"]].map(([lbl,val,unit])=>{
        const tol_v = unit==="°"?0.3:TOL;
        const col = val==null?C.muted:Math.abs(val)<tol_v*0.5?C.good:Math.abs(val)<tol_v?C.warn:C.danger;
        return <div key={lbl} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",minWidth:110}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.06em"}}>{lbl}</div>
          <div style={{fontSize:18,fontWeight:700,color:col,fontFamily:"monospace"}}>{val!=null?val.toFixed(3):"—"}<span style={{fontSize:10,color:C.muted,marginLeft:3}}>{unit}</span></div>
        </div>;
      })}
    </div>

    {/* Trend chart */}
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>
          Feed displacement across integration — {selQV}
        </div>
        <div style={{display:"flex",gap:5}}>
          {[["mag","Magnitude",C.accent],["dx","ΔX\'",C.QV1],["dy","ΔY\'",C.QV2],["dz","ΔZ\'",C.QV3],["rot","Rotation",C.info]].map(([k,l,col])=>(
            <Tok key={k} active={selAxis===k} onClick={()=>setSelAxis(k)} color={col}>{l}</Tok>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={trendData} margin={{left:10,right:10}}>
          <CartesianGrid stroke={C.border} strokeDasharray="4 4"/>
          <XAxis dataKey="phase" tick={{fill:C.muted,fontSize:10}}/>
          <YAxis tick={{fill:C.muted,fontSize:10}} unit="mm" tickFormatter={v=>v.toFixed(2)} domain={["auto","auto"]}/>
          <Tooltip content={<CT/>}/>
          <ReferenceLine y={0} stroke={C.muted} strokeDasharray="3 3"/>
          {selAxis==="mag"&&<>
            <Line type="monotone" dataKey="mag" stroke={C.accent} strokeWidth={2} dot={{fill:C.accent,r:5}} name="Magnitude (mm)" connectNulls/>
            <ReferenceLine y={TOL} stroke={C.warn} strokeDasharray="5 3" label={{value:`${TOL}mm ref`,fill:C.warn,fontSize:9}}/>
          </>}
          {selAxis==="dx"&&<Line type="monotone" dataKey="dx" stroke={C.QV1} strokeWidth={2} dot={{fill:C.QV1,r:5}} name="ΔX' (mm)" connectNulls/>}
          {selAxis==="dy"&&<Line type="monotone" dataKey="dy" stroke={C.QV2} strokeWidth={2} dot={{fill:C.QV2,r:5}} name="ΔY' (mm)" connectNulls/>}
          {selAxis==="dz"&&<Line type="monotone" dataKey="dz" stroke={C.QV3} strokeWidth={2} dot={{fill:C.QV3,r:5}} name="ΔZ' (mm)" connectNulls/>}
          {selAxis==="rot"&&<Line type="monotone" dataKey="rot" stroke={C.info} strokeWidth={2} dot={{fill:C.info,r:5}} name="Rotation (°)" connectNulls/>}
        </LineChart>
      </ResponsiveContainer>
    </div>

    {/* All-axes overlay chart */}
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:14}}>
      <div style={{fontSize:12,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>All axes — {selQV} across integration</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={trendData} margin={{left:10,right:10}}>
          <CartesianGrid stroke={C.border} strokeDasharray="4 4"/>
          <XAxis dataKey="phase" tick={{fill:C.muted,fontSize:10}}/>
          <YAxis tick={{fill:C.muted,fontSize:10}} unit="mm" tickFormatter={v=>v.toFixed(2)}/>
          <Tooltip content={<CT/>}/>
          <ReferenceLine y={TOL} stroke={C.warn} strokeDasharray="5 3" label={{value:`${TOL}mm`,fill:C.warn,fontSize:9}}/>
          <Line type="monotone" dataKey="dx" stroke={C.QV1} strokeWidth={1.5} dot={{r:3}} name="ΔX'" connectNulls/>
          <Line type="monotone" dataKey="dy" stroke={C.QV2} strokeWidth={1.5} dot={{r:3}} name="ΔY'" connectNulls/>
          <Line type="monotone" dataKey="dz" stroke={C.QV3} strokeWidth={1.5} dot={{r:3}} name="ΔZ'" connectNulls/>
          <Line type="monotone" dataKey="mag" stroke={C.accent} strokeWidth={2} strokeDasharray="5 2" dot={{r:4}} name="|Δ|" connectNulls/>
          <Legend wrapperStyle={{color:C.muted,fontSize:11}}/>
        </LineChart>
      </ResponsiveContainer>
    </div>

    {/* Compare QV1/2/3 at selected phase */}
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
      <div style={{fontSize:12,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>
        QV1 vs QV2 vs QV3 displacement — {PHASE_SHORT[selPhase]||selPhase}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={["QV1","QV2","QV3"].map(qv=>{
          const d=satData[qv]?.[selPhase]||{};
          return {qv, "ΔX\'":d.dx,"ΔY\'":d.dy,"ΔZ\'":d.dz,"Magnitude":d.mag};
        })}>
          <CartesianGrid stroke={C.border} strokeDasharray="4 4"/>
          <XAxis dataKey="qv" tick={{fill:C.muted,fontSize:12}}/>
          <YAxis tick={{fill:C.muted,fontSize:10}} unit="mm"/>
          <Tooltip content={<CT/>}/>
          <ReferenceLine y={TOL} stroke={C.warn} strokeDasharray="5 3" label={{value:`${TOL}mm`,fill:C.warn,fontSize:9}}/>
          <Legend wrapperStyle={{color:C.muted,fontSize:11}}/>
          <Bar dataKey="ΔX\'" fill={C.QV1} radius={[4,4,0,0]}/>
          <Bar dataKey="ΔY\'" fill={C.QV2} radius={[4,4,0,0]}/>
          <Bar dataKey="ΔZ\'" fill={C.QV3} radius={[4,4,0,0]}/>
          <Bar dataKey="Magnitude" fill={C.accent} radius={[4,4,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>;
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
// ─── Helper: next FM number ────────────────────────────────────────────────────
function nextFMNum(allData) {
  const nums = Object.keys(allData)
    .map(k=>{ const d=allData[k]; return d.fmName?parseInt(d.fmName.replace('FM',''))||0:0; })
    .filter(n=>n>0);
  return nums.length ? Math.max(...nums)+1 : 7;
}

// ─── ANALYSIS SECTION ─────────────────────────────────────────────────────────
function AnalysisSection({allData, selSat, setSelSat, selQV, setSelQV, selPhase, setSelPhase, calMode, setCalMode, extraData, setExtraData, setLog, log}) {
  const [tab, setTab] = useState("overview");

  const satInfo = allData[selSat] || {};
  const qvData  = satInfo[selQV]  || {};
  const qvDataFull = getCanonicalPhaseData(qvData);
  const phases  = CANONICAL_PHASES;
  const phaseD  = qvDataFull[selPhase] || {};
  const calKey  = calMode ? "cal" : "no_cal";
  const rf      = phaseD.rf || {};

  const sats = Object.keys(allData).sort((a,b)=>Number(a.replace('BB',''))-Number(b.replace('BB',''))||a.localeCompare(b));
  // BB first, FM in parens
  const satLabel = s => { const d=allData[s]; return d?`${s}${d.fmName?` (${d.fmName})`:''}`:s; };

  const handleUpload = useCallback(({meta,deviations,filename})=>{
    const {satKey,qvKey,phase,fmNum,bbNum}=meta;
    if(!satKey||!qvKey||!phase){setLog(l=>[...l,{filename,status:"error",msg:"Could not parse filename"}]);return;}
    setExtraData(prev=>{
      const next=JSON.parse(JSON.stringify(prev));
      if(!next[satKey]) next[satKey]={fmName:`FM${fmNum}`,bbName:satKey,QV1:{},QV2:{},QV3:{}};
      if(!next[satKey][qvKey]) next[satKey][qvKey]={};
      next[satKey][qvKey][phase]={dx:null,dy:null,dz:null,rot_deg:null,mag:null,rf:{},deviations};
      return next;
    });
    setLog(l=>[...l,{filename,status:"ok",msg:`→ ${satKey}/${qvKey}/${PHASE_SHORT[phase]||phase}`}]);
    setSelSat(satKey); setSelQV(qvKey); setSelPhase(phase);
  },[]);

  const radarData=["Gain Tx band (dBi)","Gain Rx band (dBi)","AR (dB)","SLL (dB)"].map(m=>{
    const nom=NOM[m];
    const entry={metric:m.replace(" band (dBi)","").replace(" (dB)","")};
    ["QV1","QV2","QV3"].forEach(qv=>{
      const v=satInfo[qv]?.[selPhase]?.rf?.[m]?.[calKey];
      entry[qv]=v!=null?+(v/nom*100).toFixed(3):null;
    });
    return entry;
  });

  const trendRF=phases.map(ph=>({
    phase:PHASE_SHORT[ph]||ph,
    "Gain Tx":qvDataFull[ph]?.rf?.["Gain Tx band (dBi)"]?.[calKey],
    "Gain Rx":qvDataFull[ph]?.rf?.["Gain Rx band (dBi)"]?.[calKey],
    "AR":qvDataFull[ph]?.rf?.["AR (dB)"]?.[calKey],
    "SLL":qvDataFull[ph]?.rf?.["SLL (dB)"]?.[calKey],
  }));

  const tabBtn=(t,l)=><button onClick={()=>setTab(t)} style={{padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:tab===t?700:400,color:tab===t?C.accent:C.muted,borderBottom:`2px solid ${tab===t?C.accent:"transparent"}`,background:"transparent",border:"none",outline:"none"}}>{l}</button>;

  return <div style={{display:"grid",gridTemplateColumns:"220px 1fr",height:"100%"}}>
    {/* Analysis Sidebar */}
    <div style={{background:"#0d1424",borderRight:`1px solid ${C.border}`,padding:14,overflowY:"auto",display:"flex",flexDirection:"column",gap:12}}>
      <div>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Satellite</div>
        {sats.map(s=><div key={s} onClick={()=>{setSelSat(s);setSelPhase("Flotron 90° — Alignment");}}
          style={{padding:"6px 10px",borderRadius:7,cursor:"pointer",marginBottom:2,fontWeight:selSat===s?600:400,fontSize:12,background:selSat===s?"#0ea5e915":"transparent",border:`1px solid ${selSat===s?C.accent:"transparent"}`,color:selSat===s?C.accent:C.text}}>
          {satLabel(s)}
        </div>)}
      </div>
      <div>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>QV Antenna</div>
        <div style={{display:"flex",gap:5}}>
          {["QV1","QV2","QV3"].map(qv=><button key={qv} onClick={()=>setSelQV(qv)}
            style={{flex:1,padding:"6px 0",borderRadius:7,cursor:"pointer",fontWeight:selQV===qv?700:400,fontSize:12,background:selQV===qv?C[qv]+"22":C.surface,color:selQV===qv?C[qv]:C.muted,border:`1px solid ${selQV===qv?C[qv]:C.border}`}}>
            {qv}
          </button>)}
        </div>
      </div>
      <div>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Phase</div>
        {phases.map(ph=><div key={ph} onClick={()=>setSelPhase(ph)}
          style={{padding:"5px 8px",borderRadius:5,cursor:"pointer",marginBottom:2,fontSize:10,background:selPhase===ph?"#0ea5e912":"transparent",borderLeft:`3px solid ${selPhase===ph?C.accent:"transparent"}`,color:selPhase===ph?C.text:C.muted}}>
          {PHASE_FULL_LABELS[ph]||ph}
        </div>)}
      </div>
      <div>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Upload Measurement</div>
        <UploadPanel onUpload={handleUpload}/>
      </div>
      {log.length>0&&<div style={{maxHeight:80,overflowY:"auto"}}>
        {log.slice(-5).map((l,i)=><div key={i} style={{fontSize:10,color:l.status==="ok"?C.good:C.danger,marginBottom:2,fontFamily:"monospace"}}>
          {l.status==="ok"?"✓":"✗"} {l.msg}
        </div>)}
      </div>}
      {extraData[selSat]&&<>
        <button onClick={()=>downloadJSON(`${selSat}.json`, allData[selSat])}
          style={{padding:"9px 12px",borderRadius:8,background:C.accent,border:"none",color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",width:"100%"}}>
          ⬇ Export {selSat}.json
        </button>
        <div style={{fontSize:9,color:C.muted,lineHeight:1.5}}>
          This satellite has unsaved uploads. Export, then drop the file into <code style={{color:C.accent}}>public/data/</code>, update <code style={{color:C.accent}}>manifest.json</code>, and commit &amp; push to make it permanent.
        </div>
        <button onClick={()=>{ if(confirm("Discard this session's unsaved uploads? This can't be undone.")){ setExtraData(prev=>{const next={...prev}; delete next[selSat]; return next;}); } }}
          style={{padding:"6px 12px",borderRadius:8,background:"transparent",border:`1px solid ${C.danger}`,color:C.danger,fontSize:10,cursor:"pointer",width:"100%"}}>
          Discard unsaved {selSat} data
        </button>
      </>}
    </div>

    {/* Analysis Main */}
    <div style={{overflowY:"auto",padding:18}}>
      <div style={{marginBottom:12,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:18,fontWeight:700}}>{satLabel(selSat)} · <span style={{color:C[selQV]}}>{selQV}</span></div>
        <div style={{fontSize:11,color:C.muted,background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:"2px 10px"}}>{PHASE_FULL_LABELS[selPhase]||selPhase}</div>
        <div style={{fontSize:10,color:calMode?C.good:C.warn,background:(calMode?C.good:C.warn)+"15",border:`1px solid ${calMode?C.good:C.warn}`,borderRadius:20,padding:"2px 8px"}}>{calMode?"Calibrated":"No Calibration"}</div>
        <div style={{flex:1}}/>
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,color:C.muted}}>
          <span>Calibrated</span>
          <div onClick={()=>setCalMode(c=>!c)} style={{width:36,height:18,borderRadius:9,background:calMode?C.accent:C.border,position:"relative",cursor:"pointer",transition:"background .2s"}}>
            <div style={{position:"absolute",top:2,left:calMode?18:2,width:14,height:14,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
          </div>
        </label>
      </div>

      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:18}}>
        {tabBtn("overview","Overview")}
        {tabBtn("trends","RF Trends")}
        {tabBtn("compare","Compare")}
        {tabBtn("positions","Position History")}
      </div>

      {tab==="overview"&&<div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:18}}>
          <MetricCard label="Gain Tx" value={rf["Gain Tx band (dBi)"]?.[calKey]??null} unit="dBi" nominal={44} higherIsBetter={true}/>
          <MetricCard label="Gain Rx" value={rf["Gain Rx band (dBi)"]?.[calKey]??null} unit="dBi" nominal={45} higherIsBetter={true}/>
          <MetricCard label="AR" value={rf["AR (dB)"]?.[calKey]??null} unit="dB" nominal={1} higherIsBetter={false}/>
          <MetricCard label="SLL" value={rf["SLL (dB)"]?.[calKey]??null} unit="dB" nominal={19} higherIsBetter={false}/>
          <MetricCard label="Displacement" value={phaseD.mag??null} unit="mm" nominal={null}/>
          <MetricCard label="Rotation" value={phaseD.rot_deg??null} unit="°" nominal={null}/>
        </div>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:18,marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:600,marginBottom:4,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>RF Performance Radar — QV1 vs QV2 vs QV3 at {PHASE_SHORT[selPhase]||selPhase}</div>
          <div style={{fontSize:10,color:C.muted,marginBottom:10}}>% of nominal. Closer to 100% = better.</div>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={C.border}/><PolarAngleAxis dataKey="metric" tick={{fill:C.muted,fontSize:12}}/>
              <PolarRadiusAxis angle={30} domain={[96,102]} tick={{fill:C.muted,fontSize:9}} tickCount={4} tickFormatter={v=>`${v}%`}/>
              {["QV1","QV2","QV3"].map(qv=><Radar key={qv} name={qv} dataKey={qv} stroke={C[qv]} fill={C[qv]} fillOpacity={0.12} strokeWidth={2} connectNulls/>)}
              <Legend wrapperStyle={{color:C.muted,fontSize:12}}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:18}}>
          <div style={{fontSize:11,fontWeight:600,marginBottom:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>SMR Deviations from Nominal</div>
          <DevTable devs={phaseD.deviations}/>
        </div>
      </div>}

      {tab==="trends"&&<div>
        {[{key:"Gain Tx",label:"Gain Tx Band (dBi)",nom:44,col:C.QV1},{key:"Gain Rx",label:"Gain Rx Band (dBi)",nom:45,col:C.QV2},{key:"AR",label:"AR (dB)",nom:1,col:C.QV3},{key:"SLL",label:"SLL (dB)",nom:19,col:"#38bdf8"}].map(({key,label,nom,col})=>(
          <div key={key} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:600,marginBottom:12,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label} — {selQV}</div>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={trendRF} margin={{left:10,right:10}}>
                <CartesianGrid stroke={C.border} strokeDasharray="4 4"/>
                <XAxis dataKey="phase" tick={{fill:C.muted,fontSize:10}}/>
                <YAxis tick={{fill:C.muted,fontSize:10}} tickFormatter={v=>v.toFixed(2)} domain={["auto","auto"]}/>
                <Tooltip content={<CT/>}/>
                <ReferenceLine y={nom} stroke={C.warn} strokeDasharray="5 3" label={{value:`Nom:${nom}`,fill:C.warn,fontSize:9,position:"right"}}/>
                <Line type="monotone" dataKey={key} stroke={col} strokeWidth={2} dot={{fill:col,r:4}} name={label} connectNulls/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>}

      {tab==="compare"&&<div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:14}}>
          {phases.map(p=><Tok key={p} active={selPhase===p} onClick={()=>setSelPhase(p)}>{PHASE_SHORT[p]||p}</Tok>)}
        </div>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:600,marginBottom:4,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>Feed Displacement — Change Across Integration Phases</div>
          <div style={{fontSize:10,color:C.muted,marginBottom:10}}>Flotron = perfect-frame baseline. Structure = real-world integration. Blank bars = no data yet.</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={CANONICAL_PHASES.map(ph=>({phase:PHASE_SHORT[ph]||ph,QV1:getCanonicalPhaseData(satInfo["QV1"]||{})[ph]?.mag??null,QV2:getCanonicalPhaseData(satInfo["QV2"]||{})[ph]?.mag??null,QV3:getCanonicalPhaseData(satInfo["QV3"]||{})[ph]?.mag??null}))} margin={{left:5,right:10,bottom:55}}>
              <CartesianGrid stroke={C.border} strokeDasharray="4 4"/>
              <XAxis dataKey="phase" tick={{fill:C.muted,fontSize:9}} angle={-40} textAnchor="end" interval={0}/>
              <YAxis tick={{fill:C.muted,fontSize:10}} unit="mm"/>
              <Tooltip content={<CT/>}/>
              <ReferenceLine y={0.5} stroke={C.warn} strokeDasharray="4 3" label={{value:"0.5mm",fill:C.warn,fontSize:8,position:"right"}}/>
              <Legend wrapperStyle={{color:C.muted,fontSize:11}}/>
              <Bar dataKey="QV1" fill={C.QV1} radius={[3,3,0,0]} name="QV1" maxBarSize={28}/>
              <Bar dataKey="QV2" fill={C.QV2} radius={[3,3,0,0]} name="QV2" maxBarSize={28}/>
              <Bar dataKey="QV3" fill={C.QV3} radius={[3,3,0,0]} name="QV3" maxBarSize={28}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {["QV1","QV2","QV3"].map(qv=>{const d=satInfo[qv]?.[selPhase]||{};const r=d.rf||{};return(
            <div key={qv} style={{background:C.surface,border:`1px solid ${C[qv]}44`,borderRadius:12,padding:14}}>
              <div style={{fontSize:14,fontWeight:700,color:C[qv],marginBottom:10,fontFamily:"'Space Grotesk',sans-serif"}}>{qv}</div>
              {[["Gain Tx",r["Gain Tx band (dBi)"]?.[calKey],"dBi",44,true],["Gain Rx",r["Gain Rx band (dBi)"]?.[calKey],"dBi",45,true],["AR",r["AR (dB)"]?.[calKey],"dB",1,false],["SLL",r["SLL (dB)"]?.[calKey],"dB",19,false],["Displacement",d.mag,"mm",null,null],["Rotation",d.rot_deg,"°",null,null]].map(([lbl,val,unit,nom,hib])=>{
                const diff=val!=null&&nom!=null?val-nom:null;
                const ok=diff!=null?(hib?diff>=-0.2:diff<=0.05):null;
                const med=diff!=null?(hib?diff>=-0.5:diff<=0.15):null;
                const col=val==null?C.muted:ok!=null?(ok?C.good:med?C.warn:C.danger):C.text;
                return <div key={lbl} style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:10,color:C.muted}}>{lbl}</span>
                  <span style={{fontFamily:"monospace",fontSize:12,fontWeight:600,color:col}}>{val!=null?val.toFixed(3):"—"}<span style={{fontSize:9,color:C.muted,marginLeft:2}}>{unit}</span></span>
                </div>;
              })}
            </div>);})}
        </div>
      </div>}

      {tab==="positions"&&<PositionHistoryTab satData={satInfo} selQV={selQV} phases={phases} selPhase={selPhase} setSelPhase={setSelPhase}/>}
    </div>
  </div>;
}

// ─── ALIGNMENT SECTION ────────────────────────────────────────────────────────
function AlignmentSection({allData, setExtraData}) {
  // Which satellite + QV we're aligning
  const sats = Object.keys(allData).sort((a,b)=>Number(a.replace('BB',''))-Number(b.replace('BB',''))||a.localeCompare(b));
  const satLabel = s => { const d=allData[s]; return d?`${s}${d.fmName?` (${d.fmName})`:''}`:s; };

  // Default to first satellite without alignment data, or BB11
  const defaultSat = sats.find(s=>{
    const d=allData[s];
    return !d?.QV1?.["Flotron 90° — Alignment"]?.mag;
  }) || sats[sats.length-1];

  const [alignSat, setAlignSat] = useState(defaultSat);
  const [alignQV, setAlignQV]   = useState("QV1");
  const [newSatName, setNewSatName] = useState("");
  const [result, setResult]     = useState(null);
  const [history, setHistory]   = useState([]);
  const [gain, setGain]         = useState(1.0);
  const [copied, setCopied]     = useState("");
  const [step, setStep]         = useState(0); // procedure step tracker

  const copy=(text,key)=>{copyText(text);setCopied(key);setTimeout(()=>setCopied(""),2000);};

  // Determine the effective satellite key (either existing or new)
  const isNewSat = alignSat === "__new__";
  const effectiveSat = isNewSat ? (newSatName||"BBnew") : alignSat;

  const handleFile = ({rawPts, filename}) => {
    const required=["pa","pb","pc","pd","p1","p2","p4"];
    if(!required.every(k=>rawPts[k])){alert("File missing SMR labels: "+required.filter(k=>!rawPts[k]).join(", "));return;}
    const res = computeAlignment({pa:rawPts.pa,pb:rawPts.pb,pc:rawPts.pc,pd:rawPts.pd,p1:rawPts.p1,p2:rawPts.p2,p4:rawPts.p4}, gain);
    setResult(res);
    setHistory(prev=>[...prev,{iter:prev.length+1,filename,...res}]);
    setStep(s=>Math.max(s,1));
  };

  // Commit aligned result into analysis data (Flotron 90° — Alignment phase)
  const commitResult = () => {
    if(!result) return;
    // Build deviations from last raw pts - we'll store deltaXYZ as the phase data
    const satKey = effectiveSat;
    // Figure out FM number
    const existingFM = allData[satKey]?.fmName;
    const fmNum = existingFM ? parseInt(existingFM.replace('FM','')) : nextFMNum(allData);
    setExtraData(prev=>{
      const next=JSON.parse(JSON.stringify(prev));
      if(!next[satKey]) next[satKey]={fmName:`FM${fmNum}`,bbName:satKey,QV1:{},QV2:{},QV3:{}};
      if(!next[satKey][alignQV]) next[satKey][alignQV]={};
      // Store alignment result as the Flotron 90° — Alignment phase entry
      next[satKey][alignQV]["Flotron 90° — Alignment"]={
        dx: result.deltaXYZ.dX, dy: result.deltaXYZ.dY,
        dz: result.deltaXYZ.dZ, rot_deg: result.deltaXYZ.dRot,
        mag: Math.sqrt(result.deltaXYZ.dX**2+result.deltaXYZ.dY**2+result.deltaXYZ.dZ**2),
        rf:{}, deviations: result.coordErrors.map(e=>({point:e.pt,x:e.ex,y:e.ey,z:e.ez,mag:Math.sqrt(e.ex**2+e.ey**2+e.ez**2)}))
      };
      return next;
    });
    alert(`✓ ${satKey}/${alignQV} alignment saved to Analysis section.\n\nThis is still a local draft — click "Export ${satKey}.json" to download the file, then commit it into public/data/ to make it permanent.`);
  };

  // Downloads the satellite's full merged record (base + this session's edits) as
  // <BB>.json — drop this into public/data/ in the repo and add it to manifest.json.
  const exportBB = () => {
    const satKey = effectiveSat;
    const record = allData[satKey];
    if(!record){ alert("No data yet for this satellite — upload and save an alignment first."); return; }
    downloadJSON(`${satKey}.json`, record);
  };

  const AxisBlock=({label,axes,txt,copyKey,converged,color})=>(
    <div style={{background:C.surface,border:`2px solid ${converged?C.good:color}`,borderRadius:12,padding:16,flex:1}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontWeight:700,fontSize:13,color,fontFamily:"'Space Grotesk',sans-serif"}}>{label}</div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {converged&&<span style={{fontSize:10,color:C.good,background:C.good+"22",padding:"2px 8px",borderRadius:10}}>✓ CONVERGED</span>}
          <button onClick={()=>copy(txt,copyKey)} style={{fontSize:11,padding:"3px 10px",borderRadius:6,cursor:"pointer",background:C.surface,border:`1px solid ${C.border}`,color:C.text}}>
            {copied===copyKey?"Copied!":"Copy"}
          </button>
        </div>
      </div>
      <div style={{fontFamily:"monospace",fontSize:12,background:"#070b14",borderRadius:8,padding:10,whiteSpace:"pre",color:C.text}}>{txt}</div>
      <div style={{display:"flex",gap:6,marginTop:10}}>
        {Object.entries(axes).map(([k,v])=>{
          const c=Math.abs(v)>0.5?C.danger:Math.abs(v)>0.1?C.warn:C.good;
          return <div key={k} style={{flex:1,background:"#070b14",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
            <div style={{fontSize:9,color:C.muted,marginBottom:2}}>{k}</div>
            <div style={{fontSize:16,fontWeight:700,fontFamily:"monospace",color:c}}>{v>=0?"+":""}{v.toFixed(3)}</div>
            <div style={{fontSize:9,color:C.muted}}>mm</div>
          </div>;
        })}
      </div>
    </div>
  );

  // Procedure steps
  const STEPS = [
    {id:0, label:"Setup", icon:"⚙️", desc:"Select satellite and QV antenna, load measurement file"},
    {id:1, label:"Rotate", icon:"🔄", desc:"Apply rotational platform corrections (A4, A5, A6) first"},
    {id:2, label:"Re-measure", icon:"📐", desc:"Upload new measurement after rotational corrections"},
    {id:3, label:"Translate", icon:"↔️", desc:"Apply linear stage corrections (A1, A2, A3)"},
    {id:4, label:"Re-measure", icon:"📐", desc:"Upload new measurement to verify convergence"},
    {id:5, label:"Complete", icon:"✅", desc:"All axes converged — save result to analysis"},
  ];

  const curStepDone = result ? (result.rotConverged && result.linearConverged ? 5 : result.rotConverged ? 3 : 1) : 0;

  return <div style={{display:"grid",gridTemplateColumns:"260px 1fr",height:"100%"}}>
    {/* Alignment Sidebar */}
    <div style={{background:"#0d1424",borderRight:`1px solid ${C.border}`,padding:16,overflowY:"auto",display:"flex",flexDirection:"column",gap:14}}>

      {/* Target selection */}
      <div>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Aligning Satellite</div>
        <select value={alignSat} onChange={e=>setAlignSat(e.target.value)}
          style={{width:"100%",padding:"7px 10px",borderRadius:7,background:C.surface,border:`1px solid ${C.border}`,color:C.text,fontSize:12,marginBottom:8,cursor:"pointer"}}>
          {sats.map(s=><option key={s} value={s}>{satLabel(s)}</option>)}
          <option value="__new__">+ New Satellite…</option>
        </select>
        {isNewSat&&<input placeholder="e.g. BB12" value={newSatName} onChange={e=>setNewSatName(e.target.value.toUpperCase())}
          style={{width:"100%",padding:"7px 10px",borderRadius:7,background:C.surface,border:`1px solid ${C.accent}`,color:C.text,fontSize:12,boxSizing:"border-box"}}/>}
      </div>

      <div>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>QV Antenna</div>
        <div style={{display:"flex",gap:5}}>
          {["QV1","QV2","QV3"].map(qv=><button key={qv} onClick={()=>setAlignQV(qv)}
            style={{flex:1,padding:"6px 0",borderRadius:7,cursor:"pointer",fontWeight:alignQV===qv?700:400,fontSize:12,background:alignQV===qv?C[qv]+"22":C.surface,color:alignQV===qv?C[qv]:C.muted,border:`1px solid ${alignQV===qv?C[qv]:C.border}`}}>
            {qv}
          </button>)}
        </div>
      </div>

      {/* Context note */}
      <div style={{background:"#0ea5e912",border:`1px solid ${C.accent}33`,borderRadius:8,padding:"10px 12px",fontSize:11,color:C.muted,lineHeight:1.5}}>
        <div style={{color:C.accent,fontWeight:600,marginBottom:4}}>📍 Alignment Context</div>
        Alignment is performed on the Flotron at 90°. This establishes the reference position for all subsequent measurements on this satellite.
      </div>

      {/* Linear gain */}
      <div>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Linear Gain</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <input type="number" value={gain} step={0.05} min={0.7} max={1.3}
            onChange={e=>setGain(parseFloat(e.target.value)||1.0)}
            style={{width:70,padding:"5px 8px",borderRadius:6,background:C.surface,border:`1px solid ${C.border}`,color:C.text,fontSize:12}}/>
          <span style={{fontSize:10,color:C.muted}}>Historical range: 0.85–1.15</span>
        </div>
      </div>

      {/* Procedure flow */}
      <div>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Procedure Flow</div>
        {STEPS.map(s=>{
          const done = s.id < curStepDone;
          const active = s.id === curStepDone;
          return <div key={s.id} style={{display:"flex",gap:8,marginBottom:8,opacity:s.id>curStepDone+1?0.35:1}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:done?C.good:active?"#0ea5e9":"#1e2d45",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:done||active?"#fff":C.muted,flexShrink:0,marginTop:1}}>
              {done?"✓":s.id+1}
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:active?C.text:done?C.good:C.muted}}>{s.icon} {s.label}</div>
              <div style={{fontSize:10,color:C.muted,lineHeight:1.4}}>{s.desc}</div>
            </div>
          </div>;
        })}
      </div>

      {/* Save to analysis */}
      {result&&(result.rotConverged&&result.linearConverged)&&<button onClick={commitResult}
        style={{padding:"10px 14px",borderRadius:8,background:C.good,border:"none",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",width:"100%"}}>
        ✓ Save Alignment to Analysis
      </button>}

      {allData[effectiveSat]&&<button onClick={exportBB}
        style={{padding:"10px 14px",borderRadius:8,background:C.accent,border:"none",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",width:"100%"}}>
        ⬇ Export {effectiveSat}.json
      </button>}
      {allData[effectiveSat]&&<div style={{fontSize:10,color:C.muted,lineHeight:1.5}}>
        Drop the downloaded file into <code style={{color:C.accent}}>public/data/{effectiveSat}.json</code>, add it to <code style={{color:C.accent}}>manifest.json</code>, then commit &amp; push. The GitHub Action will rebuild and redeploy automatically.
      </div>}

      {history.length>0&&<button onClick={()=>{setHistory([]);setResult(null);setStep(0);}}
        style={{padding:"6px 14px",borderRadius:8,background:"transparent",border:`1px solid ${C.border}`,color:C.muted,fontSize:11,cursor:"pointer"}}>
        Clear Session
      </button>}
    </div>

    {/* Alignment Main */}
    <div style={{overflowY:"auto",padding:18}}>
      {/* Header */}
      <div style={{marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
        <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:18,fontWeight:700}}>
          {isNewSat?(newSatName||"New Satellite"):satLabel(effectiveSat)}
          <span style={{color:C[alignQV],marginLeft:8}}>{alignQV}</span>
        </div>
        <div style={{fontSize:11,color:"#a78bfa",background:"#a78bfa15",border:"1px solid #a78bfa44",borderRadius:20,padding:"2px 10px"}}>Flotron 90° — Alignment</div>
      </div>

      {/* Upload zone */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,color:C.muted,marginBottom:8}}>Upload laser tracker measurement (.txt) — pA, pB, pC, pD, p1, p2, p4</div>
        <UploadPanel onUpload={handleFile} label="Drop SMR measurement (.txt)" icon="📐"/>
      </div>

      {/* Results */}
      {result&&<>
        <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap"}}>
          <AxisBlock label="① ROTATION PLATFORM — Apply first" axes={result.rotations} txt={result.rotTxt} copyKey="rot" converged={result.rotConverged} color="#6366f1"/>
          <AxisBlock label="② LINEAR STAGE — After re-measurement" axes={result.linear} txt={result.linTxt} copyKey="lin" converged={result.linearConverged} color={C.accent}/>
        </div>

        {/* Feed position error */}
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Feed Position Error (Local Frame)</div>
          {result.deltaXYZ&&<div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>
            {[["ΔX′",result.deltaXYZ.dX,"mm"],["ΔY′",result.deltaXYZ.dY,"mm"],["ΔZ′",result.deltaXYZ.dZ,"mm"],["ΔRot",result.deltaXYZ.dRot,"°"]].map(([lbl,val,unit])=>{
              const thresh = unit==="°" ? 0.3 : 0.2;
              const col = Math.abs(val)<thresh ? C.good : Math.abs(val)<thresh*2 ? C.warn : C.danger;
              return <div key={lbl} style={{background:"#070b14",borderRadius:8,padding:"10px 16px",textAlign:"center",minWidth:90}}>
                <div style={{fontSize:10,color:C.muted,marginBottom:3}}>{lbl}</div>
                <div style={{fontSize:18,fontWeight:700,fontFamily:"monospace",color:col}}>{val>=0?"+":""}{val.toFixed(4)}</div>
                <div style={{fontSize:10,color:C.muted}}>{unit}</div>
              </div>;
            })}
          </div>}
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,fontFamily:"monospace"}}>
            <thead><tr style={{color:C.muted,borderBottom:`1px solid ${C.border}`}}>
              {["Point","Err X′ (mm)","Err Y′ (mm)","Err Z′ (mm)"].map(h=><th key={h} style={{padding:"5px 8px",textAlign:"right",fontWeight:400}}>{h}</th>)}
            </tr></thead>
            <tbody>{result.coordErrors.map((row,i)=>(
              <tr key={i} style={{borderBottom:`1px solid ${C.border}22`}}>
                <td style={{padding:"5px 8px",color:C.accent,fontWeight:700}}>{row.pt}</td>
                {[row.ex,row.ey,row.ez].map((v,j)=><td key={j} style={{padding:"5px 8px",textAlign:"right",color:Math.abs(v)>0.5?C.danger:Math.abs(v)>0.2?C.warn:C.good}}>{v>=0?"+":""}{v}</td>)}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </>}

      {/* Iteration history */}
      {history.length>0&&<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:14}}>
        <div style={{fontSize:11,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>
          Alignment History — {history.length} iteration{history.length>1?"s":""}
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,fontFamily:"monospace",minWidth:650}}>
            <thead><tr style={{color:C.muted,borderBottom:`1px solid ${C.border}`}}>
              {["INT","File","A4 rot","A5 rot","A6 rot","A1 lin","A2 lin","A3 lin","Rot✓","Lin✓"].map(h=><th key={h} style={{padding:"4px 8px",textAlign:"right",fontWeight:400}}>{h}</th>)}
            </tr></thead>
            <tbody>{history.map((h,i)=>(
              <tr key={i} style={{borderBottom:`1px solid ${C.border}22`,background:i===history.length-1?"#0ea5e908":"transparent"}}>
                <td style={{padding:"4px 8px",color:C.accent,fontWeight:700}}>INT {h.iter}</td>
                <td style={{padding:"4px 8px",color:C.muted,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.filename}</td>
                {[h.rotations.A4,h.rotations.A5,h.rotations.A6].map((v,j)=><td key={j} style={{padding:"4px 8px",textAlign:"right",color:Math.abs(v)>0.5?C.danger:Math.abs(v)>0.1?C.warn:C.good}}>{v>=0?"+":""}{v.toFixed(3)}</td>)}
                {[h.linear.A1,h.linear.A2,h.linear.A3].map((v,j)=><td key={j} style={{padding:"4px 8px",textAlign:"right",color:Math.abs(v)>0.5?C.danger:Math.abs(v)>0.1?C.warn:C.good}}>{v>=0?"+":""}{v.toFixed(3)}</td>)}
                <td style={{padding:"4px 8px",textAlign:"right"}}>{h.rotConverged?<span style={{color:C.good}}>✓</span>:<span style={{color:C.danger}}>✗</span>}</td>
                <td style={{padding:"4px 8px",textAlign:"right"}}>{h.linearConverged?<span style={{color:C.good}}>✓</span>:<span style={{color:C.danger}}>✗</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {history.length>1&&<div style={{marginTop:14}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:6}}>Convergence per iteration</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={history.map(h=>({iter:`INT ${h.iter}`,"|A1|":Math.abs(h.linear.A1),"|A2|":Math.abs(h.linear.A2),"|A3|":Math.abs(h.linear.A3),"|A4|":Math.abs(h.rotations.A4),"|A5|":Math.abs(h.rotations.A5),"|A6|":Math.abs(h.rotations.A6)}))}>
              <CartesianGrid stroke={C.border} strokeDasharray="4 4"/>
              <XAxis dataKey="iter" tick={{fill:C.muted,fontSize:9}}/>
              <YAxis tick={{fill:C.muted,fontSize:9}} unit="mm"/>
              <Tooltip content={<CT/>}/>
              <ReferenceLine y={0.1} stroke={C.warn} strokeDasharray="4 3" label={{value:"0.1",fill:C.warn,fontSize:8}}/>
              {["|A1|","|A2|","|A3|"].map((k,i)=><Line key={k} type="monotone" dataKey={k} stroke={[C.QV1,C.QV2,C.QV3][i]} strokeWidth={2} dot={{r:3}} connectNulls/>)}
              {["|A4|","|A5|","|A6|"].map((k,i)=><Line key={k} type="monotone" dataKey={k} stroke={["#6366f1","#a78bfa","#c4b5fd"][i]} strokeWidth={2} dot={{r:3}} strokeDasharray="4 2" connectNulls/>)}
              <Legend wrapperStyle={{color:C.muted,fontSize:10}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>}
      </div>}

      {!result&&<div style={{textAlign:"center",padding:"60px 20px",color:C.muted}}>
        <div style={{fontSize:32,marginBottom:12}}>📐</div>
        <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>Upload a measurement to begin</div>
        <div style={{fontSize:11}}>Drop a .txt file with pA, pB, pC, pD, p1, p2, p4 coordinates from the laser tracker.</div>
      </div>}
    </div>
  </div>;
}

// ─── ROOT DASHBOARD ────────────────────────────────────────────────────────────

export default function QVDashboard(){
  const [mode, setMode]         = useState("analysis");  // "analysis" | "alignment"
  const [baseData, setBaseData] = useState(null);   // loaded from /public/data/*.json
  const [loadError, setLoadError] = useState(null);
  // extraData = uploads made THIS session that haven't been exported+committed yet.
  // Restored from localStorage on load so an accidental refresh doesn't wipe work in progress.
  const [extraData, setExtraDataRaw] = useState(loadDraft);
  const [selSat, setSelSat]     = useState("BB8");
  const [selQV, setSelQV]       = useState("QV1");
  const [selPhase, setSelPhase] = useState("Flotron 90° — Alignment");
  const [calMode, setCalMode]   = useState(false);
  const [log, setLog]           = useState([]);

  // Every setExtraData call also persists the draft to localStorage automatically.
  const setExtraData = useCallback((updater)=>{
    setExtraDataRaw(prev=>{
      const next = typeof updater==="function" ? updater(prev) : updater;
      saveDraft(next);
      return next;
    });
  },[]);

  useEffect(()=>{
    loadAllData().then(setBaseData).catch(err=>setLoadError(err.message));
  },[]);

  if(loadError) return <div style={{padding:40,color:C.danger,fontFamily:"monospace"}}>
    Failed to load dashboard data: {loadError}<br/>
    Check that /public/data/manifest.json and its referenced files exist and are deployed.
  </div>;
  if(!baseData) return <div style={{padding:40,color:C.muted}}>Loading BB data…</div>;

  const allData = {...baseData, ...extraData};
  const hasUnsavedWork = Object.keys(extraData).length > 0;

  return <div style={{background:C.bg,color:C.text,minHeight:"100vh",fontFamily:"'Inter','Segoe UI',sans-serif",fontSize:14}}>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet"/>

    {/* Top nav */}
    <div style={{background:"#070b14",borderBottom:`1px solid ${C.border}`,padding:"0 20px",display:"flex",alignItems:"center",gap:0,height:52}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginRight:24}}>
        <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#0ea5e9,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>📡</div>
        <div>
          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:15}}>QV Antenna Dashboard</div>
          <div style={{color:C.muted,fontSize:9}}>AST SpaceMobile · CSAT Assembly</div>
        </div>
      </div>

      {/* Mode switcher */}
      <div style={{display:"flex",gap:2,background:"#111827",borderRadius:8,padding:3,border:`1px solid ${C.border}`}}>
        {[["analysis","📊 Analysis"],["alignment","🎯 Alignment"]].map(([m,label])=>(
          <button key={m} onClick={()=>setMode(m)} style={{padding:"5px 16px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12,fontWeight:mode===m?700:400,background:mode===m?(m==="alignment"?"#6366f1":"#0ea5e9"):"transparent",color:mode===m?"#fff":C.muted,transition:"all .15s"}}>
            {label}
          </button>
        ))}
      </div>

      <div style={{flex:1}}/>
      {hasUnsavedWork&&<div style={{fontSize:10,color:C.warn,background:C.warn+"18",border:`1px solid ${C.warn}`,borderRadius:20,padding:"3px 10px",marginRight:10}}>
        ⚠ Unsaved changes — export &amp; commit to keep them permanently
      </div>}
      <div style={{fontSize:10,color:C.muted}}>{Object.keys(allData).sort((a,b)=>Number(a.replace('BB',''))-Number(b.replace('BB',''))).join(" · ")}</div>
    </div>

    {/* Content area */}
    <div style={{height:"calc(100vh - 52px)"}}>
      {mode==="analysis"&&<AnalysisSection
        allData={allData} selSat={selSat} setSelSat={setSelSat}
        selQV={selQV} setSelQV={setSelQV}
        selPhase={selPhase} setSelPhase={setSelPhase}
        calMode={calMode} setCalMode={setCalMode}
        extraData={extraData} setExtraData={setExtraData}
        setLog={setLog} log={log}
      />}
      {mode==="alignment"&&<AlignmentSection
        allData={allData} setExtraData={setExtraData}
      />}
    </div>
  </div>;
}
