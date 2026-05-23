# QV Antenna Alignment Dashboard

**Live dashboard:** [https://martspurins.github.io/qv_alignment_dashboard/](https://martspurins.github.io/qv_alignment_dashboard/)

---

## Background

Each satellite carries three QV-band antennas (QV1, QV2, QV3), each mounted on its own panel. The antenna consists of a waveguide feed, a sub-reflector, and a main dish — all held in position relative to an azimuth bracket.

The alignment procedure moves the waveguide feed using a 6-DOF alignment jig (controlled by the alignment jig controller) so that the feed is correctly positioned relative to the azimuth bracket. All alignment work is performed on the flotron (alignment frame) at 90 degrees. A laser tracker measures the positions of seven SMR (Spherically Mounted Retroreflector) targets — four on the azimuth bracket (PA, PB, PC, PD) and three on the feed (P1, P2, P4) — and computes the corrections needed. Once the feed is within tolerance, the laser tracker takes a final baseline measurement.

That baseline measurement is fed into the **SENER alignment calculator**, which computes the expected RF performance losses due to any residual misalignment. The key outputs are:

| Metric | Nominal | Unit | Notes |
|---|---|---|---|
| Gain Tx Band | 44 | dBi | Higher is better |
| Gain Rx Band | 45 | dBi | Higher is better |
| AR (Axial Ratio) | 1 | dB | Lower is better |
| SLL (Side Lobe Level) | 19 | dB | Lower is better |

After the baseline, subsequent laser tracker measurements repeat the same 7-SMR check at different stages of satellite integration (preloading, vibe testing, etc.) to monitor whether the alignment has shifted.

### Satellite naming

The two naming schemes are always 5 apart:

| FM name | BB name |
|---|---|
| FM3 | BB8 |
| FM4 | BB9 |
| FM5 | BB10 |

### Integration phases

Measurements are taken at multiple points during assembly:

| Phase | Description |
|---|---|
| Flotron 90° Alignment | Baseline alignment measurement on the flotron |
| Flotron 87.5° | Verification check tilted at 87.5° on the flotron |
| Flotron 272.5° | Verification check rotated to 272.5° on the flotron |
| Structure 272.5° No Preload | Antenna mounted on structure, no preload applied |
| Structure 87.5° PLM Installed | PLM (Payload Module) installed, no preload yet |
| Structure 87.5° PLM Preload | After PLM preload applied |
| Structure 87.5° HDRM Preloaded | After HDRM (Hold-Down and Release Mechanism) preloading |
| Structure 87.5° Post Vibe | After vibration testing |

---

## Using the dashboard

### Navigating the data

The sidebar on the left contains three selectors:

1. **Satellite** — choose between FM3 (BB8), FM4 (BB9), and FM5 (BB10)
2. **QV Antenna** — choose QV1, QV2, or QV3
3. **Phase** — choose the integration phase; only phases with data available are shown

The **Calibrated toggle** in the top-right switches all charts and metrics between the uncalibrated and calibrated values from the SENER calculator. Calibrated values assume beam pointing error is compensated by an on-orbit offset measurement.

---

### Overview tab

Shows the four key RF metrics (Gain Tx, Gain Rx, AR, SLL) for the selected satellite / QV / phase as metric cards, each displaying the measured value, the nominal, and the delta. Colour coding:

- 🟢 **Green** — within acceptable range of nominal
- 🟡 **Amber** — moderate deviation, worth monitoring
- 🔴 **Red** — significant deviation from nominal

Below the cards, a **radar chart** compares QV1, QV2, and QV3 side by side at the selected phase. Values are normalised as a percentage of nominal so all four metrics share one scale. The closer to 100%, the closer each antenna is to its nominal target.

Below that, the **SMR deviation table** shows the X, Y, Z, and magnitude deviations of each of the 7 SMR points from their nominal positions. Points P1, P2, and P4 (on the feed) are the most sensitive indicators of feed misalignment. Deviations above 0.5 mm are flagged in red.

---

### Trends tab

Line charts showing how each RF metric evolves across all integration phases for the selected QV antenna. Useful for spotting if a particular phase (e.g. HDRM preloading or vibe) introduces a significant shift. A nominal reference line is shown on each chart.

---

### Compare tab

Bar chart and side-by-side metric cards comparing all three QV antennas at a single integration phase. Use the phase selector buttons above the chart to switch phases. Useful for checking whether all three antennas on one satellite are performing consistently.

---

### Deviations tab

Full SMR deviation table and bar chart of deviation magnitudes for the selected QV and phase. Use the phase selector buttons to step through each integration phase and track how individual SMR point positions shift over the course of assembly.

---

## Uploading new measurements

The dashboard accepts raw laser tracker output files in the standard comma-separated format:

```
pA, 0.000000, 0.000000, 0.000000
pB, 224.993894, -0.000000, -0.009720
pC, -0.035390, -112.372539, -0.013621
pD, 124.886793, -112.550073, 0.003874
p1, 224.106577, 530.547778, -470.777111
p2, 246.061918, 517.056652, -488.193564
p4, 246.107029, 569.934073, -529.042907
```

**File naming convention** — the dashboard automatically parses the filename to determine which satellite, QV antenna, and integration phase the measurement belongs to. Follow this format:

```
FM4_QV1_Post_PLM_Preload_Post_HDRM_Preload_INT_1.txt
```

The parser reads:

- `FM4` or `BB9` → satellite (FM and BB numbers are always 5 apart)
- `QV1` / `QV2` / `QV3` → which antenna
- Keywords in the filename → integration phase:
  - `Post_Vibe` or `Vibe` → Structure 87.5° Post Vibe
  - `HDRM` → Structure 87.5° HDRM Preloaded
  - `PLM_Preload` or `PLM` + `Preload` → Structure 87.5° PLM Preload
  - `PLM` (without preload) → Structure 87.5° PLM Installed
  - `272` or `272.5` → Structure 272.5° No Preload
  - `87` or `87.5` → Flotron 87.5°
  - Anything else defaults to Flotron 90° Alignment
- `INT_1`, `INT_2`, etc. → iteration number (only relevant during the alignment procedure itself)

To upload, either drag and drop one or more `.txt` files onto the upload area in the sidebar, or click it to open a file browser. Multiple files can be uploaded at once. The dashboard will switch to the newly uploaded satellite/QV/phase automatically and display the SMR deviations computed against the SENER nominal positions. Note that RF performance metrics (Gain, AR, SLL) require the SENER calculator and cannot be computed from the raw SMR coordinates alone — those fields will show `—` for uploaded files.

---

## Updating the dashboard

To deploy changes to the live site:

1. Edit `src/App.jsx` in the `qv-dashboard` project folder
2. Open a terminal, navigate to the `qv-dashboard` folder
3. Run:
   ```
   npm run deploy
   ```
4. The live URL updates within about 60 seconds

---

## Repository

Source code: [https://github.com/martspurins/qv_alignment_dashboard](https://github.com/martspurins/qv_alignment_dashboard)
