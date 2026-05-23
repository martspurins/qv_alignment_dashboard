import { useState, useCallback, useRef, useEffect } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ReferenceLine, ScatterChart, Scatter, ZAxis } from "recharts";

// ─── Static satellite data ────────────────────────────────────────────────────
const ALL_DATA = {"BB8":{"fmName":"FM3","bbName":"BB8","QV1":{"Flotron 90\u00b0 Alignment":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.173003,"cal":0.107547},"Delta AR (dB)":{"nominal":null,"no_cal":0.031112,"cal":0.02375},"Delta SLL (dB)":{"nominal":null,"no_cal":0.232366,"cal":0.232366},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.826997,"cal":43.892453},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.826997,"cal":44.892453},"AR (dB)":{"nominal":1.0,"no_cal":1.031112,"cal":1.02375},"SLL (dB)":{"nominal":19.0,"no_cal":18.767634,"cal":18.767634},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.008129,"y":0.0,"z":0.004614,"mag":0.009347},{"point":"PC","x":0.02167,"y":-0.015343,"z":0.00646,"mag":0.027326},{"point":"PD","x":0.055788,"y":-0.030832,"z":-0.001842,"mag":0.063768},{"point":"P1","x":-0.10437,"y":0.199277,"z":-0.131815,"mag":0.260729},{"point":"P2","x":-0.053107,"y":0.250171,"z":-0.060237,"mag":0.262744},{"point":"P4","x":-0.085691,"y":0.151457,"z":-0.168417,"mag":0.24217}]},"Flotron 87.5\u00b0":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.220528,"cal":0.13066},"Delta AR (dB)":{"nominal":null,"no_cal":0.036452,"cal":0.026229},"Delta SLL (dB)":{"nominal":null,"no_cal":0.281272,"cal":0.281272},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.779472,"cal":43.86934},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.779472,"cal":44.86934},"AR (dB)":{"nominal":1.0,"no_cal":1.036452,"cal":1.026229},"SLL (dB)":{"nominal":19.0,"no_cal":18.718728,"cal":18.718728},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.011527,"y":0.0,"z":0.009954,"mag":0.01523},{"point":"PC","x":0.003228,"y":0.006169,"z":0.013935,"mag":0.015578},{"point":"PD","x":0.047286,"y":-0.037527,"z":-0.00397,"mag":0.060498},{"point":"P1","x":-0.061487,"y":0.266963,"z":-0.058288,"mag":0.280085},{"point":"P2","x":-0.017432,"y":0.302457,"z":0.005188,"mag":0.303003},{"point":"P4","x":-0.062153,"y":0.204447,"z":-0.096152,"mag":0.234322}]},"Flotron 272.5\u00b0":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.502652,"cal":0.258099},"Delta AR (dB)":{"nominal":null,"no_cal":0.0709,"cal":0.041687},"Delta SLL (dB)":{"nominal":null,"no_cal":0.50701,"cal":0.50701},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.497348,"cal":43.741901},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.497348,"cal":44.741901},"AR (dB)":{"nominal":1.0,"no_cal":1.0709,"cal":1.041687},"SLL (dB)":{"nominal":19.0,"no_cal":18.49299,"cal":18.49299},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.015722,"y":0.0,"z":-0.006061,"mag":0.01685},{"point":"PC","x":0.018864,"y":-0.057071,"z":-0.008484,"mag":0.060704},{"point":"PD","x":0.063374,"y":-0.055031,"z":0.00242,"mag":0.083967},{"point":"P1","x":-0.123577,"y":0.403041,"z":0.149553,"mag":0.447302},{"point":"P2","x":-0.046546,"y":0.443183,"z":0.247842,"mag":0.509905},{"point":"P4","x":-0.068981,"y":0.336844,"z":0.125933,"mag":0.366171}]},"Structure 272.5\u00b0 No Preload":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.285403,"cal":0.168237},"Delta AR (dB)":{"nominal":null,"no_cal":0.043965,"cal":0.030487},"Delta SLL (dB)":{"nominal":null,"no_cal":0.356289,"cal":0.356289},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.714597,"cal":43.831763},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.714597,"cal":44.831763},"AR (dB)":{"nominal":1.0,"no_cal":1.043965,"cal":1.030487},"SLL (dB)":{"nominal":19.0,"no_cal":18.643711,"cal":18.643711},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.006222,"y":0.0,"z":0.000791,"mag":0.006272},{"point":"PC","x":0.01314,"y":-0.073859,"z":0.001107,"mag":0.075027},{"point":"PD","x":0.027998,"y":-0.08031,"z":-0.000316,"mag":0.085051},{"point":"P1","x":0.055839,"y":0.408781,"z":-0.068622,"mag":0.418245},{"point":"P2","x":0.142302,"y":0.376477,"z":-0.025868,"mag":0.403304},{"point":"P4","x":0.036706,"y":0.341294,"z":-0.108221,"mag":0.359918}]},"Structure 87.5\u00b0 PLM Installed":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.245279,"cal":0.145679},"Delta AR (dB)":{"nominal":null,"no_cal":0.040811,"cal":0.029434},"Delta SLL (dB)":{"nominal":null,"no_cal":0.309933,"cal":0.309933},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.754721,"cal":43.854321},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.754721,"cal":44.854321},"AR (dB)":{"nominal":1.0,"no_cal":1.040811,"cal":1.029434},"SLL (dB)":{"nominal":19.0,"no_cal":18.690067,"cal":18.690067},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.073457,"y":0.0,"z":0.031718,"mag":0.080012},{"point":"PC","x":0.013653,"y":-0.020794,"z":0.044415,"mag":0.050907},{"point":"PD","x":0.056936,"y":-0.064819,"z":-0.012662,"mag":0.087198},{"point":"P1","x":0.072177,"y":0.295562,"z":-0.098482,"mag":0.319789},{"point":"P2","x":0.191283,"y":0.233801,"z":-0.046189,"mag":0.30559},{"point":"P4","x":0.060405,"y":0.197676,"z":-0.149112,"mag":0.25487}]},"Structure 87.5\u00b0 HDRM Preloaded":{"Delta Gain (dB)":{"nominal":null,"no_cal":1.821894,"cal":0.795059},"Delta AR (dB)":{"nominal":null,"no_cal":0.235273,"cal":0.102982},"Delta SLL (dB)":{"nominal":null,"no_cal":1.041892,"cal":1.041892},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":42.178106,"cal":43.204941},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":43.178106,"cal":44.204941},"AR (dB)":{"nominal":1.0,"no_cal":1.235273,"cal":1.102982},"SLL (dB)":{"nominal":19.0,"no_cal":17.958108,"cal":17.958108},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.062722,"y":0.0,"z":-0.054324,"mag":0.082977},{"point":"PC","x":0.072784,"y":0.070285,"z":-0.076107,"mag":0.126609},{"point":"PD","x":0.096266,"y":-0.091554,"z":0.02162,"mag":0.134598},{"point":"P1","x":0.707433,"y":-0.577493,"z":-1.086868,"mag":1.419592},{"point":"P2","x":0.669222,"y":-0.694683,"z":-1.002659,"mag":1.391319},{"point":"P4","x":0.710256,"y":-0.735213,"z":-1.084987,"mag":1.490704}]},"Structure 87.5\u00b0 Post Vibe":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.621329,"cal":0.293904},"Delta AR (dB)":{"nominal":null,"no_cal":0.077072,"cal":0.037306},"Delta SLL (dB)":{"nominal":null,"no_cal":0.559423,"cal":0.559423},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.378671,"cal":43.706096},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.378671,"cal":44.706096},"AR (dB)":{"nominal":1.0,"no_cal":1.077072,"cal":1.037306},"SLL (dB)":{"nominal":19.0,"no_cal":18.440577,"cal":18.440577},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.027259,"y":0.0,"z":0.006292,"mag":0.027976},{"point":"PC","x":0.024379,"y":-0.06379,"z":0.00881,"mag":0.068856},{"point":"PD","x":0.024609,"y":-0.065164,"z":-0.002514,"mag":0.069701},{"point":"P1","x":0.358296,"y":-0.226659,"z":-0.393092,"mag":0.578162},{"point":"P2","x":0.294805,"y":-0.312224,"z":-0.393074,"mag":0.582152},{"point":"P4","x":0.340731,"y":-0.255152,"z":-0.42857,"mag":0.604047}]}},"QV2":{"Flotron 90\u00b0 Alignment":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.265069,"cal":0.15488},"Delta AR (dB)":{"nominal":null,"no_cal":0.045613,"cal":0.032972},"Delta SLL (dB)":{"nominal":null,"no_cal":0.326717,"cal":0.326717},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.734931,"cal":43.84512},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.734931,"cal":44.84512},"AR (dB)":{"nominal":1.0,"no_cal":1.045613,"cal":1.032972},"SLL (dB)":{"nominal":19.0,"no_cal":18.673283,"cal":18.673283},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.01116,"y":0.0,"z":-0.010241,"mag":0.015147},{"point":"PC","x":0.009789,"y":-0.069321,"z":-0.014339,"mag":0.071462},{"point":"PD","x":-0.000842,"y":-0.073346,"z":0.004093,"mag":0.073465},{"point":"P1","x":0.147819,"y":0.316317,"z":-0.029996,"mag":0.350438},{"point":"P2","x":0.169513,"y":0.300173,"z":-0.054619,"mag":0.34903},{"point":"P4","x":0.085035,"y":0.193756,"z":-0.213399,"mag":0.300519}]},"Flotron 87.5\u00b0":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.637519,"cal":0.331444},"Delta AR (dB)":{"nominal":null,"no_cal":0.090905,"cal":0.053875},"Delta SLL (dB)":{"nominal":null,"no_cal":0.627164,"cal":0.627164},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.362481,"cal":43.668556},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.362481,"cal":44.668556},"AR (dB)":{"nominal":1.0,"no_cal":1.090905,"cal":1.053875},"SLL (dB)":{"nominal":19.0,"no_cal":18.372836,"cal":18.372836},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.018929,"y":0.0,"z":-0.013537,"mag":0.023271},{"point":"PC","x":0.012236,"y":-0.0313,"z":-0.01896,"mag":0.038586},{"point":"PD","x":-0.033534,"y":-0.06424,"z":0.005409,"mag":0.072667},{"point":"P1","x":0.03462,"y":0.657611,"z":0.191227,"mag":0.685725},{"point":"P2","x":0.032294,"y":0.6868,"z":0.202203,"mag":0.716675},{"point":"P4","x":-0.056545,"y":0.597063,"z":0.040658,"mag":0.601111}]},"Flotron 272.5\u00b0":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.781642,"cal":0.388564},"Delta AR (dB)":{"nominal":null,"no_cal":0.109977,"cal":0.061738},"Delta SLL (dB)":{"nominal":null,"no_cal":0.690164,"cal":0.690164},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.218358,"cal":43.611436},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.218358,"cal":44.611436},"AR (dB)":{"nominal":1.0,"no_cal":1.109977,"cal":1.061738},"SLL (dB)":{"nominal":19.0,"no_cal":18.309836,"cal":18.309836},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.060489,"y":0.0,"z":-0.025445,"mag":0.065623},{"point":"PC","x":-0.018012,"y":-0.030101,"z":-0.035638,"mag":0.050006},{"point":"PD","x":-0.067293,"y":-0.095214,"z":0.010155,"mag":0.117035},{"point":"P1","x":0.138241,"y":0.672432,"z":0.295471,"mag":0.747381},{"point":"P2","x":0.192961,"y":0.698809,"z":0.330123,"mag":0.796586},{"point":"P4","x":0.091733,"y":0.574882,"z":0.167023,"mag":0.605641}]},"Structure 272.5\u00b0 No Preload":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.691353,"cal":0.362113},"Delta AR (dB)":{"nominal":null,"no_cal":0.094454,"cal":0.054455},"Delta SLL (dB)":{"nominal":null,"no_cal":0.699193,"cal":0.699193},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.308647,"cal":43.637887},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.308647,"cal":44.637887},"AR (dB)":{"nominal":1.0,"no_cal":1.094454,"cal":1.054455},"SLL (dB)":{"nominal":19.0,"no_cal":18.300807,"cal":18.300807},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.021825,"y":0.0,"z":-0.022139,"mag":0.031088},{"point":"PC","x":-0.023586,"y":-0.038927,"z":-0.030988,"mag":0.055062},{"point":"PD","x":0.021895,"y":-0.037983,"z":0.00884,"mag":0.044724},{"point":"P1","x":-0.375185,"y":0.732229,"z":-0.112453,"mag":0.830403},{"point":"P2","x":-0.40592,"y":0.68887,"z":-0.180994,"mag":0.8198},{"point":"P4","x":-0.504342,"y":0.547274,"z":-0.197593,"mag":0.770008}]},"Structure 87.5\u00b0 PLM Preload":{"Delta Gain (dB)":{"nominal":null,"no_cal":1.709462,"cal":0.774912},"Delta AR (dB)":{"nominal":null,"no_cal":0.231717,"cal":0.11181},"Delta SLL (dB)":{"nominal":null,"no_cal":1.076812,"cal":1.076812},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":42.290538,"cal":43.225088},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":43.290538,"cal":44.225088},"AR (dB)":{"nominal":1.0,"no_cal":1.231717,"cal":1.11181},"SLL (dB)":{"nominal":19.0,"no_cal":17.923188,"cal":17.923188},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.061257,"y":0.0,"z":-0.015095,"mag":0.063089},{"point":"PC","x":-0.049263,"y":-0.031276,"z":-0.021133,"mag":0.062062},{"point":"PD","x":-0.044573,"y":-0.060631,"z":0.006024,"mag":0.075493},{"point":"P1","x":-1.151025,"y":0.834273,"z":0.197913,"mag":1.435284},{"point":"P2","x":-1.085171,"y":0.88855,"z":0.298062,"mag":1.433861}]},"Structure 87.5\u00b0 HDRM Preloaded":{"Delta Gain (dB)":{"nominal":null,"no_cal":1.470671,"cal":0.675428},"Delta AR (dB)":{"nominal":null,"no_cal":0.19999,"cal":0.098708},"Delta SLL (dB)":{"nominal":null,"no_cal":0.980422,"cal":0.980422},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":42.529329,"cal":43.324572},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":43.529329,"cal":44.324572},"AR (dB)":{"nominal":1.0,"no_cal":1.19999,"cal":1.098708},"SLL (dB)":{"nominal":19.0,"no_cal":18.019578,"cal":18.019578},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.04943,"y":0.0,"z":-0.0161,"mag":0.051986},{"point":"PC","x":0.084737,"y":0.07251,"z":-0.022542,"mag":0.113781},{"point":"PD","x":0.081103,"y":0.114293,"z":0.006446,"mag":0.140293},{"point":"P1","x":-0.579727,"y":0.350498,"z":0.981865,"mag":1.192892},{"point":"P2","x":-0.558208,"y":0.333181,"z":1.121317,"mag":1.296132},{"point":"P4","x":-0.310785,"y":0.291569,"z":1.06612,"mag":1.148134}]},"Structure 87.5\u00b0 Post Vibe":{"Delta Gain (dB)":{"nominal":null,"no_cal":1.295587,"cal":0.589726},"Delta AR (dB)":{"nominal":null,"no_cal":0.187208,"cal":0.097826},"Delta SLL (dB)":{"nominal":null,"no_cal":0.867404,"cal":0.867404},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":42.704413,"cal":43.410274},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":43.704413,"cal":44.410274},"AR (dB)":{"nominal":1.0,"no_cal":1.187208,"cal":1.097826},"SLL (dB)":{"nominal":19.0,"no_cal":18.132596,"cal":18.132596},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.038631,"y":0.0,"z":0.003667,"mag":0.038805},{"point":"PC","x":-0.049332,"y":-0.058254,"z":0.005133,"mag":0.076508},{"point":"PD","x":-0.038823,"y":-0.041126,"z":-0.001465,"mag":0.056575},{"point":"P1","x":-0.355253,"y":0.566626,"z":0.820528,"mag":1.058554},{"point":"P2","x":-0.351846,"y":0.534989,"z":0.941899,"mag":1.138939},{"point":"P4","x":-0.032727,"y":0.341598,"z":0.681269,"mag":0.762816}]}},"QV3":{"Flotron 90\u00b0 Alignment":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.249709,"cal":0.154197},"Delta AR (dB)":{"nominal":null,"no_cal":0.043571,"cal":0.032679},"Delta SLL (dB)":{"nominal":null,"no_cal":0.327156,"cal":0.327156},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.750291,"cal":43.845803},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.750291,"cal":44.845803},"AR (dB)":{"nominal":1.0,"no_cal":1.043571,"cal":1.032679},"SLL (dB)":{"nominal":19.0,"no_cal":18.672844,"cal":18.672844},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.002757,"y":0.0,"z":0.03752,"mag":0.037621},{"point":"PC","x":0.129804,"y":-0.077875,"z":0.052534,"mag":0.160229},{"point":"PD","x":0.084932,"y":-0.017867,"z":-0.015034,"mag":0.088083},{"point":"P1","x":0.062033,"y":0.267586,"z":-0.297726,"mag":0.405082},{"point":"P2","x":0.051178,"y":0.267761,"z":-0.307902,"mag":0.411241},{"point":"P4","x":-0.11786,"y":0.206119,"z":-0.380972,"mag":0.448905}]},"Flotron 87.5\u00b0":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.258257,"cal":0.15835},"Delta AR (dB)":{"nominal":null,"no_cal":0.045281,"cal":0.033867},"Delta SLL (dB)":{"nominal":null,"no_cal":0.335041,"cal":0.335041},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.741743,"cal":43.84165},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.741743,"cal":44.84165},"AR (dB)":{"nominal":1.0,"no_cal":1.045281,"cal":1.033867},"SLL (dB)":{"nominal":19.0,"no_cal":18.664959,"cal":18.664959},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.009867,"y":0.0,"z":0.037521,"mag":0.038797},{"point":"PC","x":0.123947,"y":-0.080224,"z":0.052528,"mag":0.15671},{"point":"PD","x":0.09745,"y":-0.021162,"z":-0.015028,"mag":0.100847},{"point":"P1","x":0.05315,"y":0.277961,"z":-0.28114,"mag":0.398907},{"point":"P2","x":0.046148,"y":0.269252,"z":-0.305034,"mag":0.409478},{"point":"P4","x":-0.135901,"y":0.2043,"z":-0.37677,"mag":0.449626}]},"Flotron 272.5\u00b0":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.313548,"cal":0.176426},"Delta AR (dB)":{"nominal":null,"no_cal":0.048123,"cal":0.032234},"Delta SLL (dB)":{"nominal":null,"no_cal":0.370144,"cal":0.370144},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.686452,"cal":43.823574},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.686452,"cal":44.823574},"AR (dB)":{"nominal":1.0,"no_cal":1.048123,"cal":1.032234},"SLL (dB)":{"nominal":19.0,"no_cal":18.629856,"cal":18.629856},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.000605,"y":0.0,"z":0.034798,"mag":0.034803},{"point":"PC","x":0.127933,"y":-0.106625,"z":0.048711,"mag":0.173518},{"point":"PD","x":0.108363,"y":-0.019391,"z":-0.013948,"mag":0.110964},{"point":"P1","x":0.194289,"y":0.310686,"z":-0.056978,"mag":0.370838},{"point":"P2","x":0.236148,"y":0.316386,"z":-0.027252,"mag":0.395738},{"point":"P4","x":0.122517,"y":0.251906,"z":-0.114731,"mag":0.302705}]},"Structure 272.5\u00b0 No Preload":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.988516,"cal":0.457224},"Delta AR (dB)":{"nominal":null,"no_cal":0.126208,"cal":0.05991},"Delta SLL (dB)":{"nominal":null,"no_cal":0.751733,"cal":0.751733},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.011484,"cal":43.542776},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.011484,"cal":44.542776},"AR (dB)":{"nominal":1.0,"no_cal":1.126208,"cal":1.05991},"SLL (dB)":{"nominal":19.0,"no_cal":18.248267,"cal":null},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.048961,"y":0.0,"z":0.008655,"mag":0.04972},{"point":"PC","x":0.134157,"y":0.023889,"z":0.012127,"mag":0.136806},{"point":"PD","x":0.071708,"y":-0.053129,"z":-0.003458,"mag":0.089312},{"point":"P1","x":0.630349,"y":-0.353984,"z":-0.399354,"mag":0.82591},{"point":"P2","x":0.620134,"y":-0.240099,"z":-0.50041,"mag":0.83224},{"point":"P4","x":0.681725,"y":-0.255962,"z":-0.561475,"mag":0.919521}]},"Structure 87.5\u00b0 PLM Installed":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.548981,"cal":0.271967},"Delta AR (dB)":{"nominal":null,"no_cal":0.068713,"cal":0.035388},"Delta SLL (dB)":{"nominal":null,"no_cal":0.528329,"cal":0.528329},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.451019,"cal":43.728033},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.451019,"cal":44.728033},"AR (dB)":{"nominal":1.0,"no_cal":1.068713,"cal":1.035388},"SLL (dB)":{"nominal":19.0,"no_cal":18.471671,"cal":18.471671},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.002586,"y":0.0,"z":0.026562,"mag":0.026688},{"point":"PC","x":0.015786,"y":0.060183,"z":0.037188,"mag":0.072485},{"point":"PD","x":0.010743,"y":0.091545,"z":-0.010628,"mag":0.092784},{"point":"P1","x":0.400856,"y":-0.046888,"z":-0.328711,"mag":0.520514},{"point":"P2","x":0.373464,"y":-0.100446,"z":-0.324589,"mag":0.504899},{"point":"P4","x":0.408791,"y":-0.118614,"z":-0.34849,"mag":0.550113}]},"Structure 87.5\u00b0 HDRM Preloaded":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.535144,"cal":0.261278},"Delta AR (dB)":{"nominal":null,"no_cal":0.070883,"cal":0.037958},"Delta SLL (dB)":{"nominal":null,"no_cal":0.512865,"cal":0.512865},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.464856,"cal":43.738722},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.464856,"cal":44.738722},"AR (dB)":{"nominal":1.0,"no_cal":1.070883,"cal":1.037958},"SLL (dB)":{"nominal":19.0,"no_cal":18.487135,"cal":18.487135},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.007336,"y":0.0,"z":-0.051771,"mag":0.052288},{"point":"PC","x":0.024856,"y":0.104929,"z":-0.072473,"mag":0.129924},{"point":"PD","x":0.066128,"y":0.090901,"z":0.020669,"mag":0.114294},{"point":"P1","x":0.482647,"y":0.004911,"z":-0.162306,"mag":0.50923},{"point":"P2","x":0.353394,"y":-0.106254,"z":-0.200193,"mag":0.419827},{"point":"P4","x":0.451768,"y":-0.064983,"z":-0.168321,"mag":0.486466}]},"Structure 87.5\u00b0 Post Vibe":{"Delta Gain (dB)":{"nominal":null,"no_cal":1.197231,"cal":0.53851},"Delta AR (dB)":{"nominal":null,"no_cal":0.156751,"cal":0.073625},"Delta SLL (dB)":{"nominal":null,"no_cal":0.826436,"cal":0.826436},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":42.802769,"cal":43.46149},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":43.802769,"cal":44.46149},"AR (dB)":{"nominal":1.0,"no_cal":1.156751,"cal":1.073625},"SLL (dB)":{"nominal":19.0,"no_cal":18.173564,"cal":18.173564},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.037945,"y":0.0,"z":-0.035142,"mag":0.051718},{"point":"PC","x":0.057909,"y":0.02523,"z":-0.049193,"mag":0.080062},{"point":"PD","x":0.084025,"y":0.075048,"z":0.014065,"mag":0.113535},{"point":"P1","x":0.73473,"y":-0.415109,"z":-0.473037,"mag":0.967423},{"point":"P2","x":0.637199,"y":-0.521736,"z":-0.524941,"mag":0.976624},{"point":"P4","x":0.780734,"y":-0.49113,"z":-0.500731,"mag":1.049517}]}}},"BB9":{"fmName":"FM4","bbName":"BB9","QV1":{"Flotron 90\u00b0 Alignment":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.160261,"cal":0.091434},"Delta AR (dB)":{"nominal":null,"no_cal":0.026655,"cal":0.018901},"Delta SLL (dB)":{"nominal":null,"no_cal":0.210793,"cal":0.210793},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.839739,"cal":43.908566},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.839739,"cal":44.908566},"AR (dB)":{"nominal":1.0,"no_cal":1.026655,"cal":1.018901},"SLL (dB)":{"nominal":19.0,"no_cal":18.789207,"cal":18.789207},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.255446,"y":0.0,"z":-0.002149,"mag":0.255455},{"point":"PC","x":-0.23829,"y":0.089138,"z":-0.003004,"mag":0.254434},{"point":"PD","x":-0.1438,"y":0.114133,"z":0.000856,"mag":0.183591},{"point":"P1","x":0.089697,"y":-0.155335,"z":-0.014066,"mag":0.179923},{"point":"P2","x":0.113739,"y":-0.093926,"z":-0.059275,"mag":0.158972},{"point":"P4","x":0.053852,"y":-0.029953,"z":0.015769,"mag":0.063607}]},"Flotron 87.5\u00b0":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.165842,"cal":0.088591},"Delta AR (dB)":{"nominal":null,"no_cal":0.027737,"cal":0.018999},"Delta SLL (dB)":{"nominal":null,"no_cal":0.213783,"cal":0.213783},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.834158,"cal":43.911409},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.834158,"cal":44.911409},"AR (dB)":{"nominal":1.0,"no_cal":1.027737,"cal":1.018999},"SLL (dB)":{"nominal":19.0,"no_cal":18.786217,"cal":18.786217},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.259191,"y":0.0,"z":-0.029549,"mag":0.26087},{"point":"PC","x":-0.212427,"y":0.014305,"z":-0.041299,"mag":0.216877},{"point":"PD","x":-0.105086,"y":0.158008,"z":0.011805,"mag":0.190129},{"point":"P1","x":0.021524,"y":-0.13367,"z":-0.088105,"mag":0.161535},{"point":"P2","x":0.016672,"y":-0.067153,"z":-0.108603,"mag":0.128771},{"point":"P4","x":-0.084192,"y":-0.01411,"z":-0.047168,"mag":0.097531}]},"Flotron 272.5\u00b0":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.163147,"cal":0.09548},"Delta AR (dB)":{"nominal":null,"no_cal":0.021982,"cal":0.014363},"Delta SLL (dB)":{"nominal":null,"no_cal":0.216545,"cal":0.216545},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.836853,"cal":43.90452},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.836853,"cal":44.90452},"AR (dB)":{"nominal":1.0,"no_cal":1.021982,"cal":1.014363},"SLL (dB)":{"nominal":19.0,"no_cal":18.783455,"cal":18.783455},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.140927,"y":0.0,"z":-0.031473,"mag":0.144399},{"point":"PC","x":-0.124619,"y":0.00833,"z":-0.044045,"mag":0.132436},{"point":"PD","x":-0.120445,"y":0.020975,"z":0.012566,"mag":0.122902},{"point":"P1","x":-0.06955,"y":-0.200383,"z":-0.000607,"mag":0.212111},{"point":"P2","x":-0.072149,"y":-0.178199,"z":-0.032883,"mag":0.195043},{"point":"P4","x":-0.070533,"y":-0.158547,"z":-0.004165,"mag":0.173578}]},"Structure 272.5\u00b0 No Preload":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.78832,"cal":0.38088},"Delta AR (dB)":{"nominal":null,"no_cal":0.107152,"cal":0.057049},"Delta SLL (dB)":{"nominal":null,"no_cal":0.670992,"cal":0.670992},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.21168,"cal":43.61912},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.21168,"cal":44.61912},"AR (dB)":{"nominal":1.0,"no_cal":1.107152,"cal":1.057049},"SLL (dB)":{"nominal":19.0,"no_cal":18.329008,"cal":18.329008},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.008669,"y":0.0,"z":-0.001991,"mag":0.008895},{"point":"PC","x":0.029403,"y":0.173447,"z":-0.002789,"mag":0.175944},{"point":"PD","x":-0.004797,"y":0.137058,"z":0.000796,"mag":0.137144},{"point":"P1","x":-0.611827,"y":-0.080863,"z":-0.337537,"mag":0.703422},{"point":"P2","x":-0.490406,"y":-0.03337,"z":-0.39053,"mag":0.627794},{"point":"P4","x":-0.658918,"y":-0.009525,"z":-0.33583,"mag":0.739625}]},"Structure 87.5\u00b0 PLM Preload":{"Delta Gain (dB)":{"nominal":null,"no_cal":1.455975,"cal":0.660418},"Delta AR (dB)":{"nominal":null,"no_cal":0.187826,"cal":0.086502},"Delta SLL (dB)":{"nominal":null,"no_cal":0.954039,"cal":0.954039},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":42.544025,"cal":43.339582},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":43.544025,"cal":44.339582},"AR (dB)":{"nominal":1.0,"no_cal":1.187826,"cal":1.086502},"SLL (dB)":{"nominal":19.0,"no_cal":18.045961,"cal":18.045961},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.025282,"y":0.0,"z":-0.006655,"mag":0.026143},{"point":"PC","x":-0.015568,"y":0.24165,"z":-0.009325,"mag":0.24233},{"point":"PD","x":-0.100488,"y":0.128517,"z":0.002655,"mag":0.163161},{"point":"P1","x":-0.937184,"y":0.587225,"z":0.369194,"mag":1.165955},{"point":"P2","x":-0.919764,"y":0.633868,"z":0.375572,"mag":1.178477},{"point":"P4","x":-0.966153,"y":0.721325,"z":0.414608,"mag":1.275014}]},"Structure 87.5\u00b0 HDRM Preloaded":{"Delta Gain (dB)":{"nominal":null,"no_cal":1.027513,"cal":0.46995},"Delta AR (dB)":{"nominal":null,"no_cal":0.133508,"cal":0.063753},"Delta SLL (dB)":{"nominal":null,"no_cal":0.762158,"cal":0.762158},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":42.972487,"cal":43.53005},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":43.972487,"cal":44.53005},"AR (dB)":{"nominal":1.0,"no_cal":1.133508,"cal":1.063753},"SLL (dB)":{"nominal":19.0,"no_cal":18.237842,"cal":18.237842},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.006106,"y":0.0,"z":-0.00972,"mag":0.011479},{"point":"PC","x":-0.03539,"y":0.241461,"z":-0.013621,"mag":0.244421},{"point":"PD","x":-0.113207,"y":0.089927,"z":0.003874,"mag":0.14463},{"point":"P1","x":-0.893423,"y":0.071778,"z":-0.038111,"mag":0.897112},{"point":"P2","x":-0.938082,"y":0.059652,"z":-0.067564,"mag":0.942402},{"point":"P4","x":-0.892971,"y":0.140073,"z":0.016093,"mag":0.904034}]},"Structure 87.5\u00b0 Post Vibe":{"Delta Gain (dB)":{"nominal":null,"no_cal":1.452608,"cal":0.63092},"Delta AR (dB)":{"nominal":null,"no_cal":0.183122,"cal":0.078311},"Delta SLL (dB)":{"nominal":null,"no_cal":0.899611,"cal":0.899611},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":42.547392,"cal":43.36908},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":43.547392,"cal":44.36908},"AR (dB)":{"nominal":1.0,"no_cal":1.183122,"cal":1.078311},"SLL (dB)":{"nominal":19.0,"no_cal":18.100389,"cal":18.100389},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.093352,"y":0.0,"z":-0.067601,"mag":0.115258},{"point":"PC","x":0.032036,"y":0.05393,"z":-0.094653,"mag":0.113551},{"point":"PD","x":0.097572,"y":0.024586,"z":0.026992,"mag":0.104179},{"point":"P1","x":-0.498735,"y":-0.668771,"z":-0.861831,"mag":1.199477},{"point":"P2","x":-0.559779,"y":-0.684045,"z":-0.905301,"mag":1.265243},{"point":"P4","x":-0.519776,"y":-0.66345,"z":-0.880885,"mag":1.219136}]}},"QV2":{"Flotron 90\u00b0 Alignment":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.129683,"cal":0.073095},"Delta AR (dB)":{"nominal":null,"no_cal":0.020112,"cal":0.013777},"Delta SLL (dB)":{"nominal":null,"no_cal":0.177029,"cal":0.177029},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.870317,"cal":43.926905},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.870317,"cal":44.926905},"AR (dB)":{"nominal":1.0,"no_cal":1.020112,"cal":1.013777},"SLL (dB)":{"nominal":19.0,"no_cal":18.822971,"cal":18.822971},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.252903,"y":0.0,"z":0.049166,"mag":0.257638},{"point":"PC","x":-0.246847,"y":-0.186179,"z":0.06869,"mag":0.316724},{"point":"PD","x":-0.069487,"y":-0.03259,"z":-0.019624,"mag":0.079219},{"point":"P1","x":-0.06585,"y":0.005923,"z":-0.07548,"mag":0.100342},{"point":"P2","x":-0.045103,"y":0.05123,"z":-0.061633,"mag":0.091964},{"point":"P4","x":-0.116783,"y":0.015079,"z":-0.043574,"mag":0.125556}]},"Flotron 87.5\u00b0":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.126477,"cal":0.073019},"Delta AR (dB)":{"nominal":null,"no_cal":0.019109,"cal":0.013134},"Delta SLL (dB)":{"nominal":null,"no_cal":0.174136,"cal":0.174136},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.873523,"cal":43.926981},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.873523,"cal":44.926981},"AR (dB)":{"nominal":1.0,"no_cal":1.019109,"cal":1.013134},"SLL (dB)":{"nominal":19.0,"no_cal":18.825864,"cal":18.825864},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.244373,"y":0.0,"z":0.054285,"mag":0.25033},{"point":"PC","x":-0.247825,"y":-0.175378,"z":0.075846,"mag":0.312933},{"point":"PD","x":-0.068139,"y":-0.033596,"z":-0.021661,"mag":0.078999},{"point":"P1","x":-0.067577,"y":0.013786,"z":-0.095329,"mag":0.117662},{"point":"P2","x":-0.042847,"y":0.058945,"z":-0.080988,"mag":0.108947},{"point":"P4","x":-0.102913,"y":0.030952,"z":-0.067656,"mag":0.12699}]},"Flotron 272.5\u00b0":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.45736,"cal":0.228354},"Delta AR (dB)":{"nominal":null,"no_cal":0.057231,"cal":0.029975},"Delta SLL (dB)":{"nominal":null,"no_cal":0.463306,"cal":0.463306},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.54264,"cal":43.771646},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.54264,"cal":44.771646},"AR (dB)":{"nominal":1.0,"no_cal":1.057231,"cal":1.029975},"SLL (dB)":{"nominal":19.0,"no_cal":18.536694,"cal":18.536694},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.016609,"y":0.0,"z":-0.040792,"mag":0.044044},{"point":"PC","x":0.073807,"y":-0.02759,"z":-0.057127,"mag":0.097325},{"point":"PD","x":0.039663,"y":-0.02958,"z":0.016317,"mag":0.0521},{"point":"P1","x":-0.221805,"y":0.095781,"z":0.252974,"mag":0.34981},{"point":"P2","x":-0.143592,"y":0.143582,"z":0.394626,"mag":0.443806},{"point":"P4","x":-0.121297,"y":0.142165,"z":0.346226,"mag":0.393442}]},"Structure 272.5\u00b0 No Preload":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.927284,"cal":0.446268},"Delta AR (dB)":{"nominal":null,"no_cal":0.118619,"cal":0.058918},"Delta SLL (dB)":{"nominal":null,"no_cal":0.756074,"cal":0.756074},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.072716,"cal":43.553732},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.072716,"cal":44.553732},"AR (dB)":{"nominal":1.0,"no_cal":1.118619,"cal":1.058918},"SLL (dB)":{"nominal":19.0,"no_cal":18.243926,"cal":18.243926},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.027641,"y":0.0,"z":0.059956,"mag":0.066021},{"point":"PC","x":-0.075408,"y":-0.008772,"z":0.084012,"mag":0.113231},{"point":"PD","x":-0.096702,"y":-0.23262,"z":-0.023818,"mag":0.253043},{"point":"P1","x":0.653626,"y":0.453717,"z":0.086446,"mag":0.800349},{"point":"P2","x":0.722383,"y":0.523609,"z":0.137607,"mag":0.90274},{"point":"P4","x":0.671225,"y":0.464594,"z":0.114819,"mag":0.824363}]},"Structure 87.5\u00b0 PLM Preload":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.863399,"cal":0.441017},"Delta AR (dB)":{"nominal":null,"no_cal":0.119375,"cal":0.067329},"Delta SLL (dB)":{"nominal":null,"no_cal":0.834094,"cal":0.834094},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.136601,"cal":43.558983},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.136601,"cal":44.558983},"AR (dB)":{"nominal":1.0,"no_cal":1.119375,"cal":1.067329},"SLL (dB)":{"nominal":19.0,"no_cal":18.165906,"cal":18.165906},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.002431,"y":0.0,"z":0.02103,"mag":0.02117},{"point":"PC","x":0.028054,"y":0.00694,"z":0.02945,"mag":0.041261},{"point":"PD","x":0.012823,"y":-0.026705,"z":-0.0084,"mag":0.030792},{"point":"P1","x":-0.055792,"y":1.010263,"z":0.034305,"mag":1.012384},{"point":"P2","x":0.027595,"y":1.130665,"z":0.063526,"mag":1.132784},{"point":"P4","x":-0.150553,"y":1.076376,"z":0.03569,"mag":1.08744}]},"Structure 87.5\u00b0 HDRM Preloaded":{"Delta Gain (dB)":{"nominal":null,"no_cal":1.220729,"cal":0.544384},"Delta AR (dB)":{"nominal":null,"no_cal":0.158971,"cal":0.073508},"Delta SLL (dB)":{"nominal":null,"no_cal":0.829717,"cal":0.829717},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":42.779271,"cal":43.455616},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":43.779271,"cal":44.455616},"AR (dB)":{"nominal":1.0,"no_cal":1.158971,"cal":1.073508},"SLL (dB)":{"nominal":19.0,"no_cal":18.170283,"cal":18.170283},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.016461,"y":0.0,"z":0.022993,"mag":0.028278},{"point":"PC","x":0.020271,"y":0.011733,"z":0.032203,"mag":0.03982},{"point":"PD","x":0.026256,"y":-0.076989,"z":-0.009168,"mag":0.081858},{"point":"P1","x":0.926636,"y":0.143867,"z":0.238662,"mag":0.967632},{"point":"P2","x":0.898436,"y":0.179577,"z":0.32574,"mag":0.97239},{"point":"P4","x":1.030059,"y":0.172601,"z":0.277771,"mag":1.080726}]},"Structure 87.5\u00b0 Post Vibe":{"Delta Gain (dB)":{"nominal":null,"no_cal":1.107159,"cal":0.497481},"Delta AR (dB)":{"nominal":null,"no_cal":0.14297,"cal":0.066337},"Delta SLL (dB)":{"nominal":null,"no_cal":0.786509,"cal":0.786509},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":42.892841,"cal":43.502519},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":43.892841,"cal":44.502519},"AR (dB)":{"nominal":1.0,"no_cal":1.14297,"cal":1.066337},"SLL (dB)":{"nominal":19.0,"no_cal":18.213491,"cal":18.213491},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.039132,"y":0.0,"z":0.007926,"mag":0.039927},{"point":"PC","x":-0.037169,"y":0.02612,"z":0.011099,"mag":0.046765},{"point":"PD","x":-0.029235,"y":-0.040535,"z":-0.003161,"mag":0.050078},{"point":"P1","x":0.892617,"y":-0.117984,"z":-0.159958,"mag":0.914479},{"point":"P2","x":0.87147,"y":-0.172318,"z":-0.136223,"mag":0.898727},{"point":"P4","x":0.987735,"y":-0.167361,"z":-0.137405,"mag":1.011192}]}},"QV3":{"Flotron 90\u00b0 Alignment":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.201835,"cal":0.112967},"Delta AR (dB)":{"nominal":null,"no_cal":0.030228,"cal":0.020124},"Delta SLL (dB)":{"nominal":null,"no_cal":0.254217,"cal":0.254217},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.798165,"cal":43.887033},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.798165,"cal":44.887033},"AR (dB)":{"nominal":1.0,"no_cal":1.030228,"cal":1.020124},"SLL (dB)":{"nominal":19.0,"no_cal":18.745783,"cal":18.745783},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.004749,"y":0.0,"z":0.018954,"mag":0.01954},{"point":"PC","x":0.052641,"y":0.058759,"z":0.026545,"mag":0.083237},{"point":"PD","x":0.066191,"y":-0.030013,"z":-0.007556,"mag":0.073069},{"point":"P1","x":-0.002278,"y":-0.197346,"z":-0.028334,"mag":0.199383},{"point":"P2","x":-0.016581,"y":-0.185723,"z":-0.048599,"mag":0.192691},{"point":"P4","x":-0.110096,"y":-0.185473,"z":-0.063394,"mag":0.224811}]},"Flotron 87.5\u00b0":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.287535,"cal":0.151475},"Delta AR (dB)":{"nominal":null,"no_cal":0.041337,"cal":0.025577},"Delta SLL (dB)":{"nominal":null,"no_cal":0.331472,"cal":0.331472},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.712465,"cal":43.848525},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.712465,"cal":44.848525},"AR (dB)":{"nominal":1.0,"no_cal":1.041337,"cal":1.025577},"SLL (dB)":{"nominal":19.0,"no_cal":18.668528,"cal":18.668528},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.004879,"y":0.0,"z":0.020028,"mag":0.020614},{"point":"PC","x":0.044399,"y":0.040975,"z":0.028047,"mag":0.06661},{"point":"PD","x":0.058466,"y":-0.025051,"z":-0.007989,"mag":0.064107},{"point":"P1","x":-0.058511,"y":-0.207945,"z":-0.07488,"mag":0.22863},{"point":"P2","x":-0.071431,"y":-0.209765,"z":-0.100929,"mag":0.243496},{"point":"P4","x":-0.183763,"y":-0.2315,"z":-0.104909,"mag":0.313635}]},"Flotron 272.5\u00b0":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.329642,"cal":0.170549},"Delta AR (dB)":{"nominal":null,"no_cal":0.046344,"cal":0.027773},"Delta SLL (dB)":{"nominal":null,"no_cal":0.366516,"cal":0.366516},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.670358,"cal":43.829451},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.670358,"cal":44.829451},"AR (dB)":{"nominal":1.0,"no_cal":1.046344,"cal":1.027773},"SLL (dB)":{"nominal":19.0,"no_cal":18.633484,"cal":18.633484},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.011043,"y":0.0,"z":0.016753,"mag":0.020065},{"point":"PC","x":0.068908,"y":-0.006045,"z":0.023461,"mag":0.073043},{"point":"PD","x":0.080841,"y":-0.074456,"z":-0.006683,"mag":0.110107},{"point":"P1","x":-0.172306,"y":-0.207114,"z":-0.07822,"mag":0.280542},{"point":"P2","x":-0.162242,"y":-0.177858,"z":-0.068321,"mag":0.250247},{"point":"P4","x":-0.274953,"y":-0.188469,"z":-0.083532,"mag":0.343653}]},"Structure 272.5\u00b0 No Preload":{"Delta Gain (dB)":{"nominal":null,"no_cal":2.678207,"cal":1.121342},"Delta AR (dB)":{"nominal":null,"no_cal":0.358048,"cal":0.154269},"Delta SLL (dB)":{"nominal":null,"no_cal":1.534691,"cal":1.534691},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":41.321793,"cal":42.878658},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":42.321793,"cal":43.878658},"AR (dB)":{"nominal":1.0,"no_cal":1.358048,"cal":1.154269},"SLL (dB)":{"nominal":19.0,"no_cal":17.465309,"cal":17.465309},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.017069,"y":0.0,"z":0.013013,"mag":0.021464},{"point":"PC","x":0.030088,"y":-0.02626,"z":0.01822,"mag":0.043896},{"point":"PD","x":0.057888,"y":-0.077485,"z":-0.005191,"mag":0.09686},{"point":"P1","x":1.820731,"y":-1.032916,"z":0.698802,"mag":2.206876},{"point":"P2","x":1.798305,"y":-1.157085,"z":0.740046,"mag":2.262833},{"point":"P4","x":2.005457,"y":-1.151547,"z":0.745548,"mag":2.429765}]},"Structure 87.5\u00b0 PLM Preload":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.855881,"cal":0.434228},"Delta AR (dB)":{"nominal":null,"no_cal":0.116032,"cal":0.06408},"Delta SLL (dB)":{"nominal":null,"no_cal":0.798716,"cal":0.798716},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.144119,"cal":43.565772},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.144119,"cal":44.565772},"AR (dB)":{"nominal":1.0,"no_cal":1.116032,"cal":1.06408},"SLL (dB)":{"nominal":19.0,"no_cal":18.201284,"cal":18.201284},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.002165,"y":0.0,"z":0.056598,"mag":0.056639},{"point":"PC","x":0.070524,"y":0.054593,"z":0.079248,"mag":0.119307},{"point":"PD","x":0.093764,"y":0.002669,"z":-0.02258,"mag":0.096481},{"point":"P1","x":0.518556,"y":-0.727752,"z":0.215125,"mag":0.919131},{"point":"P2","x":0.542766,"y":-0.724133,"z":0.226812,"mag":0.932956},{"point":"P4","x":0.687426,"y":-0.757149,"z":0.185786,"mag":1.039397}]},"Structure 87.5\u00b0 HDRM Preloaded":{"Delta Gain (dB)":{"nominal":null,"no_cal":1.832754,"cal":0.796147},"Delta AR (dB)":{"nominal":null,"no_cal":0.237717,"cal":0.104113},"Delta SLL (dB)":{"nominal":null,"no_cal":1.038123,"cal":1.038123},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":42.167246,"cal":43.203853},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":43.167246,"cal":44.203853},"AR (dB)":{"nominal":1.0,"no_cal":1.237717,"cal":1.104113},"SLL (dB)":{"nominal":19.0,"no_cal":17.961877,"cal":17.961877},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.068591,"y":0.0,"z":0.012687,"mag":0.069754},{"point":"PC","x":-0.02819,"y":-0.046304,"z":0.017759,"mag":0.057045},{"point":"PD","x":-0.015109,"y":-0.050532,"z":-0.005066,"mag":0.052985},{"point":"P1","x":-1.240625,"y":-0.471326,"z":-0.347474,"mag":1.371873},{"point":"P2","x":-1.329277,"y":-0.559542,"z":-0.441503,"mag":1.508307},{"point":"P4","x":-1.294618,"y":-0.485024,"z":-0.357674,"mag":1.428011}]},"Structure 87.5\u00b0 Post Vibe":{"Delta Gain (dB)":{"nominal":null,"no_cal":1.170283,"cal":0.554131},"Delta AR (dB)":{"nominal":null,"no_cal":0.156455,"cal":0.078965},"Delta SLL (dB)":{"nominal":null,"no_cal":0.877924,"cal":0.877924},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":42.829717,"cal":43.445869},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":43.829717,"cal":44.445869},"AR (dB)":{"nominal":1.0,"no_cal":1.156455,"cal":1.078965},"SLL (dB)":{"nominal":19.0,"no_cal":18.122076,"cal":18.122076},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.032179,"y":0.0,"z":0.020423,"mag":0.038113},{"point":"PC","x":0.038327,"y":-0.027035,"z":0.02861,"mag":0.05494},{"point":"PD","x":-0.028655,"y":-0.059086,"z":-0.008168,"mag":0.066174},{"point":"P1","x":-0.547239,"y":-0.75321,"z":-0.26042,"mag":0.966755},{"point":"P2","x":-0.67865,"y":-0.783694,"z":-0.353723,"mag":1.095382},{"point":"P4","x":-0.544735,"y":-0.729903,"z":-0.250793,"mag":0.944665}]}}},"BB10":{"fmName":"FM5","bbName":"BB10","QV1":{"Flotron 90\u00b0 Alignment":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.149074,"cal":0.079506},"Delta AR (dB)":{"nominal":null,"no_cal":0.02176,"cal":0.01392},"Delta SLL (dB)":{"nominal":null,"no_cal":0.196597,"cal":0.196597},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.850926,"cal":43.920494},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.850926,"cal":44.920494},"AR (dB)":{"nominal":1.0,"no_cal":1.02176,"cal":1.01392},"SLL (dB)":{"nominal":19.0,"no_cal":18.803403,"cal":18.803403},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.058001,"y":0.0,"z":-0.097547,"mag":0.113488},{"point":"PC","x":-0.018037,"y":-0.053351,"z":-0.13659,"mag":0.147745},{"point":"PD","x":-0.097946,"y":-0.006174,"z":0.039076,"mag":0.105634},{"point":"P1","x":-0.088939,"y":0.027151,"z":0.009564,"mag":0.093482},{"point":"P2","x":-0.074716,"y":0.07872,"z":0.022988,"mag":0.11094},{"point":"P4","x":-0.052171,"y":0.069345,"z":0.110317,"mag":0.140358}]},"Flotron 87.5\u00b0":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.642467,"cal":0.30604},"Delta AR (dB)":{"nominal":null,"no_cal":0.082181,"cal":0.041258},"Delta SLL (dB)":{"nominal":null,"no_cal":0.575065,"cal":0.575065},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.357533,"cal":43.69396},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.357533,"cal":44.69396},"AR (dB)":{"nominal":1.0,"no_cal":1.082181,"cal":1.041258},"SLL (dB)":{"nominal":19.0,"no_cal":18.424935,"cal":18.424935},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.003225,"y":0.0,"z":-0.057348,"mag":0.057439},{"point":"PC","x":-0.084401,"y":-0.026251,"z":-0.080335,"mag":0.119442},{"point":"PD","x":-0.141929,"y":-0.084097,"z":0.02291,"mag":0.166556},{"point":"P1","x":0.301693,"y":-0.347098,"z":-0.395938,"mag":0.606846},{"point":"P2","x":0.28228,"y":-0.357022,"z":-0.383402,"mag":0.5951},{"point":"P4","x":0.348429,"y":-0.359269,"z":-0.320929,"mag":0.594535}]},"Flotron 272.5\u00b0":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.995637,"cal":0.451797},"Delta AR (dB)":{"nominal":null,"no_cal":0.123412,"cal":0.055463},"Delta SLL (dB)":{"nominal":null,"no_cal":0.742446,"cal":0.742446},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.004363,"cal":43.548203},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.004363,"cal":44.548203},"AR (dB)":{"nominal":1.0,"no_cal":1.123412,"cal":1.055463},"SLL (dB)":{"nominal":19.0,"no_cal":18.257554,"cal":18.257554},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.046411,"y":0.0,"z":-0.037121,"mag":0.05943},{"point":"PC","x":-0.136866,"y":0.011112,"z":-0.051967,"mag":0.146821},{"point":"PD","x":-0.137732,"y":0.012147,"z":0.014831,"mag":0.13906},{"point":"P1","x":-0.34432,"y":0.458024,"z":0.566187,"mag":0.805549},{"point":"P2","x":-0.237018,"y":0.555997,"z":0.613533,"mag":0.861239},{"point":"P4","x":-0.227517,"y":0.512423,"z":0.689297,"mag":0.888522}]},"Structure 272.5\u00b0 No Preload":{"Delta Gain (dB)":{"nominal":null,"no_cal":1.79529,"cal":0.80986},"Delta AR (dB)":{"nominal":null,"no_cal":0.234513,"cal":0.107783},"Delta SLL (dB)":{"nominal":null,"no_cal":1.123047,"cal":1.123047},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":42.20471,"cal":43.19014},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":43.20471,"cal":44.19014},"AR (dB)":{"nominal":1.0,"no_cal":1.234513,"cal":1.107783},"SLL (dB)":{"nominal":19.0,"no_cal":17.876953,"cal":17.876953},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.015,"y":0.0,"z":-0.00027,"mag":0.015002},{"point":"PC","x":0.00574,"y":0.004,"z":-0.00038,"mag":0.007007},{"point":"PD","x":-0.015,"y":0.0,"z":0.000108,"mag":0.015},{"point":"P1","x":-1.364,"y":0.375,"z":-0.561,"mag":1.521789},{"point":"P2","x":-1.311,"y":0.38,"z":-0.542,"mag":1.468634},{"point":"P4","x":-1.429,"y":0.37,"z":-0.525,"mag":1.566705}]},"Structure 87.5\u00b0 PLM Installed":{"Delta Gain (dB)":{"nominal":null,"no_cal":3.095555,"cal":1.115725},"Delta AR (dB)":{"nominal":null,"no_cal":0.411136,"cal":0.150771},"Delta SLL (dB)":{"nominal":null,"no_cal":1.596583,"cal":1.596583},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":40.904445,"cal":42.884275},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":41.904445,"cal":43.884275},"AR (dB)":{"nominal":1.0,"no_cal":1.411136,"cal":1.150771},"SLL (dB)":{"nominal":19.0,"no_cal":17.403417,"cal":17.403417},"deviations":[{"point":"PA","x":0.000515,"y":0.013795,"z":0.003432,"mag":0.014225},{"point":"PB","x":-0.037701,"y":0.005578,"z":-0.018915,"mag":0.042547},{"point":"PC","x":-0.040449,"y":-0.010145,"z":-0.027857,"mag":0.05015},{"point":"PD","x":-0.058448,"y":-0.027334,"z":0.012361,"mag":0.065697},{"point":"P1","x":-2.252778,"y":0.21312,"z":-1.115903,"mag":2.523028},{"point":"P2","x":-2.183217,"y":0.272826,"z":-1.107848,"mag":2.463371},{"point":"P4","x":-2.324102,"y":0.176158,"z":-1.164375,"mag":2.605427}]},"Structure 87.5\u00b0 PLM Preload":{"Delta Gain (dB)":{"nominal":null,"no_cal":2.891924,"cal":1.11282},"Delta AR (dB)":{"nominal":null,"no_cal":0.383006,"cal":0.149554},"Delta SLL (dB)":{"nominal":null,"no_cal":1.490726,"cal":1.490726},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":41.108076,"cal":42.88718},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":42.108076,"cal":43.88718},"AR (dB)":{"nominal":1.0,"no_cal":1.383006,"cal":1.149554},"SLL (dB)":{"nominal":19.0,"no_cal":17.509274,"cal":17.509274},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.080463,"y":0.0,"z":0.012675,"mag":0.081455},{"point":"PC","x":-0.015302,"y":-0.084891,"z":0.017747,"mag":0.088066},{"point":"PD","x":-0.047086,"y":-0.107077,"z":-0.005062,"mag":0.117082},{"point":"P1","x":-2.163796,"y":0.521632,"z":-0.585681,"mag":2.301551},{"point":"P2","x":-2.082856,"y":0.592947,"z":-0.554579,"mag":2.235494},{"point":"P4","x":-2.246387,"y":0.552901,"z":-0.548975,"mag":2.377673}]},"Structure 87.5\u00b0 HDRM Preloaded":{"Delta Gain (dB)":{"nominal":null,"no_cal":3.136035,"cal":1.113891},"Delta AR (dB)":{"nominal":null,"no_cal":0.412946,"cal":0.146893},"Delta SLL (dB)":{"nominal":null,"no_cal":1.609868,"cal":1.609868},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":40.863965,"cal":42.886109},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":41.863965,"cal":43.886109},"AR (dB)":{"nominal":1.0,"no_cal":1.412946,"cal":1.146893},"SLL (dB)":{"nominal":19.0,"no_cal":17.390132,"cal":17.390132},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.026359,"y":0.0,"z":0.004627,"mag":0.026762},{"point":"PC","x":0.015313,"y":-0.02281,"z":0.00648,"mag":0.028227},{"point":"PD","x":0.0165,"y":-0.070116,"z":-0.001847,"mag":0.072055},{"point":"P1","x":-2.309316,"y":0.299174,"z":-1.00127,"mag":2.534756},{"point":"P2","x":-2.313478,"y":0.340792,"z":-0.996453,"mag":2.541897},{"point":"P4","x":-2.43072,"y":0.311973,"z":-0.982636,"mag":2.640322}]},"Structure 87.5\u00b0 Post Vibe":{"Delta Gain (dB)":{"nominal":null,"no_cal":3.820475,"cal":1.117483},"Delta AR (dB)":{"nominal":null,"no_cal":0.509132,"cal":0.15087},"Delta SLL (dB)":{"nominal":null,"no_cal":1.918684,"cal":1.918684},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":40.179525,"cal":42.882517},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":41.179525,"cal":43.882517},"AR (dB)":{"nominal":1.0,"no_cal":1.509132,"cal":1.15087},"SLL (dB)":{"nominal":19.0,"no_cal":17.081316,"cal":17.081316},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.058001,"y":0.0,"z":-0.097547,"mag":0.113488},{"point":"PC","x":-0.018037,"y":-0.053351,"z":-0.13659,"mag":0.147745},{"point":"PD","x":-0.097946,"y":-0.006174,"z":0.039076,"mag":0.105634},{"point":"P1","x":-0.088939,"y":0.027151,"z":0.009564,"mag":0.093482},{"point":"P2","x":-0.074716,"y":0.07872,"z":0.022988,"mag":0.11094},{"point":"P4","x":-0.052171,"y":0.069345,"z":0.110317,"mag":0.140358}]}},"QV2":{"Flotron 90\u00b0 Alignment":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.25439,"cal":0.15089},"Delta AR (dB)":{"nominal":null,"no_cal":0.04127,"cal":0.029428},"Delta SLL (dB)":{"nominal":null,"no_cal":0.320703,"cal":0.320703},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.74561,"cal":43.84911},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.74561,"cal":44.84911},"AR (dB)":{"nominal":1.0,"no_cal":1.04127,"cal":1.029428},"SLL (dB)":{"nominal":19.0,"no_cal":18.679297,"cal":18.679297},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.024523,"y":0.0,"z":-0.008744,"mag":0.026035},{"point":"PC","x":0.020939,"y":0.083193,"z":-0.012251,"mag":0.086658},{"point":"PD","x":-0.0319,"y":-0.0014,"z":0.003491,"mag":0.032121},{"point":"P1","x":-0.056468,"y":0.129449,"z":-0.312605,"mag":0.343027},{"point":"P2","x":0.002887,"y":0.136077,"z":-0.306432,"mag":0.3353},{"point":"P4","x":-0.152742,"y":0.150163,"z":-0.314671,"mag":0.380653}]},"Flotron 87.5\u00b0":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.63841,"cal":0.324862},"Delta AR (dB)":{"nominal":null,"no_cal":0.088478,"cal":0.050491},"Delta SLL (dB)":{"nominal":null,"no_cal":0.608069,"cal":0.608069},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.36159,"cal":43.675138},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.36159,"cal":44.675138},"AR (dB)":{"nominal":1.0,"no_cal":1.088478,"cal":1.050491},"SLL (dB)":{"nominal":19.0,"no_cal":18.391931,"cal":18.391931},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.010575,"y":0.0,"z":0.019835,"mag":0.022478},{"point":"PC","x":0.008518,"y":0.131976,"z":0.027782,"mag":0.135137},{"point":"PD","x":-0.011219,"y":0.062567,"z":-0.007917,"mag":0.064056},{"point":"P1","x":0.001381,"y":0.051789,"z":-0.473663,"mag":0.476488},{"point":"P2","x":0.072116,"y":-0.106695,"z":-0.646782,"mag":0.659478},{"point":"P4","x":-0.09711,"y":-0.110542,"z":-0.657213,"mag":0.673483}]},"Flotron 272.5\u00b0":{"Delta Gain (dB)":{"nominal":null,"no_cal":1.680116,"cal":0.755292},"Delta AR (dB)":{"nominal":null,"no_cal":0.22815,"cal":0.109546},"Delta SLL (dB)":{"nominal":null,"no_cal":1.034873,"cal":1.034873},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":42.319884,"cal":43.244708},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":43.319884,"cal":44.244708},"AR (dB)":{"nominal":1.0,"no_cal":1.22815,"cal":1.109546},"SLL (dB)":{"nominal":19.0,"no_cal":17.965127,"cal":17.965127},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.022435,"y":0.0,"z":-0.007596,"mag":0.023686},{"point":"PC","x":-0.033609,"y":0.102586,"z":-0.010641,"mag":0.108474},{"point":"PD","x":-0.076547,"y":0.060739,"z":0.003036,"mag":0.097764},{"point":"P1","x":-0.261623,"y":1.014838,"z":0.754765,"mag":1.291516},{"point":"P2","x":-0.153098,"y":1.061216,"z":0.753464,"mag":1.310468},{"point":"P4","x":-0.41971,"y":1.064501,"z":0.837965,"mag":1.418275}]},"Structure 272.5\u00b0 No Preload":{"Delta Gain (dB)":{"nominal":null,"no_cal":1.084293,"cal":0.521211},"Delta AR (dB)":{"nominal":null,"no_cal":0.14864,"cal":0.078157},"Delta SLL (dB)":{"nominal":null,"no_cal":0.849451,"cal":0.849451},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":42.915707,"cal":43.478789},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":43.915707,"cal":44.478789},"AR (dB)":{"nominal":1.0,"no_cal":1.14864,"cal":1.078157},"SLL (dB)":{"nominal":19.0,"no_cal":18.150549,"cal":18.150549},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.005,"y":0.0,"z":-0.00453,"mag":0.006747},{"point":"PC","x":0.03741,"y":0.004,"z":-0.00634,"mag":0.038154},{"point":"PD","x":0.06,"y":0.03,"z":0.001811,"mag":0.067106},{"point":"P1","x":-0.884,"y":0.297,"z":-0.034,"mag":0.933178},{"point":"P2","x":-0.777,"y":0.367,"z":0.075,"mag":0.862579},{"point":"P4","x":-0.907,"y":-0.305,"z":0.364,"mag":1.023802}]},"Structure 87.5\u00b0 PLM Installed":{"Delta Gain (dB)":{"nominal":null,"no_cal":2.029712,"cal":0.895138},"Delta AR (dB)":{"nominal":null,"no_cal":0.272601,"cal":0.125811},"Delta SLL (dB)":{"nominal":null,"no_cal":1.152296,"cal":1.152296},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":41.970288,"cal":43.104862},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":42.970288,"cal":44.104862},"AR (dB)":{"nominal":1.0,"no_cal":1.272601,"cal":1.125811},"SLL (dB)":{"nominal":19.0,"no_cal":17.847704,"cal":17.847704},"deviations":[{"point":"PA","x":-0.000773,"y":-0.007869,"z":0.000189,"mag":0.007909},{"point":"PB","x":0.002377,"y":-0.004724,"z":-0.002608,"mag":0.005896},{"point":"PC","x":-0.012838,"y":0.03192,"z":-0.003727,"mag":0.034606},{"point":"PD","x":0.05241,"y":-0.025028,"z":0.001304,"mag":0.058094},{"point":"P1","x":0.048033,"y":0.544515,"z":1.323117,"mag":1.431587},{"point":"P2","x":0.040325,"y":0.585894,"z":1.54459,"mag":1.65247},{"point":"P4","x":0.242223,"y":0.541511,"z":1.400481,"mag":1.520938}]},"Structure 87.5\u00b0 PLM Preload":{"Delta Gain (dB)":{"nominal":null,"no_cal":3.748865,"cal":1.04434},"Delta AR (dB)":{"nominal":null,"no_cal":0.497147,"cal":0.138676},"Delta SLL (dB)":{"nominal":null,"no_cal":1.709058,"cal":1.709058},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":40.251135,"cal":42.95566},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":41.251135,"cal":43.95566},"AR (dB)":{"nominal":1.0,"no_cal":1.497147,"cal":1.138676},"SLL (dB)":{"nominal":19.0,"no_cal":17.290942,"cal":17.290942},"deviations":[{"point":"PA","x":0.004367,"y":-0.018363,"z":-0.019042,"mag":0.026812},{"point":"PB","x":0.035698,"y":-0.005758,"z":-0.244487,"mag":0.247147},{"point":"PC","x":0.053428,"y":0.060181,"z":-0.328522,"mag":0.338235},{"point":"PD","x":-0.371404,"y":-0.558603,"z":0.069217,"mag":0.674366},{"point":"P1","x":-0.719919,"y":1.735903,"z":2.328243,"mag":2.992049},{"point":"P2","x":-0.752589,"y":1.820392,"z":2.473261,"mag":3.161841},{"point":"P4","x":-0.578857,"y":1.846883,"z":2.468409,"mag":3.136733}]},"Structure 87.5\u00b0 HDRM Preloaded":{"Delta Gain (dB)":{"nominal":null,"no_cal":1.470671,"cal":0.675428},"Delta AR (dB)":{"nominal":null,"no_cal":0.19999,"cal":0.098708},"Delta SLL (dB)":{"nominal":null,"no_cal":0.980422,"cal":0.980422},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":42.529329,"cal":43.324572},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":43.529329,"cal":44.324572},"AR (dB)":{"nominal":1.0,"no_cal":1.19999,"cal":1.098708},"SLL (dB)":{"nominal":19.0,"no_cal":18.019578,"cal":18.019578},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.04943,"y":0.0,"z":-0.0161,"mag":0.051986},{"point":"PC","x":0.084737,"y":0.07251,"z":-0.022542,"mag":0.113781},{"point":"PD","x":0.081103,"y":0.114293,"z":0.006446,"mag":0.140293},{"point":"P1","x":-0.579727,"y":0.350498,"z":0.981865,"mag":1.192892},{"point":"P2","x":-0.558208,"y":0.333181,"z":1.121317,"mag":1.296132},{"point":"P4","x":-0.310785,"y":0.291569,"z":1.06612,"mag":1.148134}]},"Structure 87.5\u00b0 Post Vibe":{"Delta Gain (dB)":{"nominal":null,"no_cal":3.113136,"cal":1.037064},"Delta AR (dB)":{"nominal":null,"no_cal":0.408204,"cal":0.134895},"Delta SLL (dB)":{"nominal":null,"no_cal":1.438636,"cal":1.438636},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":40.886864,"cal":42.962936},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":41.886864,"cal":43.962936},"AR (dB)":{"nominal":1.0,"no_cal":1.408204,"cal":1.134895},"SLL (dB)":{"nominal":19.0,"no_cal":17.561364,"cal":17.561364},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.118645,"y":0.0,"z":-0.014777,"mag":0.119562},{"point":"PC","x":0.068335,"y":0.025291,"z":-0.020701,"mag":0.075749},{"point":"PD","x":0.012255,"y":0.037118,"z":0.005921,"mag":0.039535},{"point":"P1","x":-1.637053,"y":1.176636,"z":1.50859,"mag":2.517987},{"point":"P2","x":-1.702218,"y":1.108817,"z":1.36105,"mag":2.445297},{"point":"P4","x":-1.623673,"y":1.12888,"z":1.478252,"mag":2.46899}]}},"QV3":{"Flotron 90\u00b0 Alignment":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.265311,"cal":0.139902},"Delta AR (dB)":{"nominal":null,"no_cal":0.034196,"cal":0.019725},"Delta SLL (dB)":{"nominal":null,"no_cal":0.311291,"cal":0.311291},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.734689,"cal":43.860098},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.734689,"cal":44.860098},"AR (dB)":{"nominal":1.0,"no_cal":1.034196,"cal":1.019725},"SLL (dB)":{"nominal":19.0,"no_cal":18.688709,"cal":18.688709},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.088194,"y":0.0,"z":-0.000565,"mag":0.088196},{"point":"PC","x":-0.007695,"y":-0.182145,"z":-0.000791,"mag":0.182309},{"point":"PD","x":0.00728,"y":-0.103273,"z":0.000226,"mag":0.10353},{"point":"P1","x":-0.185637,"y":-0.197118,"z":-0.095059,"mag":0.286972},{"point":"P2","x":-0.122903,"y":-0.157246,"z":-0.017481,"mag":0.200342},{"point":"P4","x":-0.103378,"y":-0.155812,"z":-0.070025,"mag":0.199669}]},"Flotron 87.5\u00b0":{"Delta Gain (dB)":{"nominal":null,"no_cal":1.701608,"cal":0.734543},"Delta AR (dB)":{"nominal":null,"no_cal":0.221542,"cal":0.097276},"Delta SLL (dB)":{"nominal":null,"no_cal":0.982303,"cal":0.982303},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":42.298392,"cal":43.265457},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":43.298392,"cal":44.265457},"AR (dB)":{"nominal":1.0,"no_cal":1.221542,"cal":1.097276},"SLL (dB)":{"nominal":19.0,"no_cal":18.017697,"cal":18.017697},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.120991,"y":0.0,"z":-0.041212,"mag":0.127817},{"point":"PC","x":0.097628,"y":-0.17942,"z":-0.057703,"mag":0.212256},{"point":"PD","x":0.026406,"y":-0.17692,"z":0.016475,"mag":0.179637},{"point":"P1","x":-0.330846,"y":-0.794493,"z":-0.981077,"mag":1.305063},{"point":"P2","x":-0.223821,"y":-0.810295,"z":-0.948753,"mag":1.267599},{"point":"P4","x":-0.234858,"y":-0.869756,"z":-1.079977,"mag":1.406408}]},"Flotron 272.5\u00b0":{"Delta Gain (dB)":{"nominal":null,"no_cal":0.45736,"cal":0.228354},"Delta AR (dB)":{"nominal":null,"no_cal":0.057231,"cal":0.029975},"Delta SLL (dB)":{"nominal":null,"no_cal":0.463306,"cal":0.463306},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":43.54264,"cal":43.771646},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":44.54264,"cal":44.771646},"AR (dB)":{"nominal":1.0,"no_cal":1.057231,"cal":1.029975},"SLL (dB)":{"nominal":19.0,"no_cal":18.536694,"cal":18.536694},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.000605,"y":0.0,"z":0.034798,"mag":0.034803},{"point":"PC","x":0.127933,"y":-0.106625,"z":0.048711,"mag":0.173518},{"point":"PD","x":0.108363,"y":-0.019391,"z":-0.013948,"mag":0.110964},{"point":"P1","x":0.194289,"y":0.310686,"z":-0.056978,"mag":0.370838},{"point":"P2","x":0.236148,"y":0.316386,"z":-0.027252,"mag":0.395738},{"point":"P4","x":0.122517,"y":0.251906,"z":-0.114731,"mag":0.302705}]},"Structure 272.5\u00b0 No Preload":{"Delta Gain (dB)":{"nominal":null,"no_cal":1.288864,"cal":0.580209},"Delta AR (dB)":{"nominal":null,"no_cal":0.162965,"cal":0.073211},"Delta SLL (dB)":{"nominal":null,"no_cal":0.86814,"cal":0.86814},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":42.711136,"cal":43.419791},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":43.711136,"cal":44.419791},"AR (dB)":{"nominal":1.0,"no_cal":1.162965,"cal":1.073211},"SLL (dB)":{"nominal":19.0,"no_cal":18.13186,"cal":18.13186},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.048961,"y":0.0,"z":0.008655,"mag":0.04972},{"point":"PC","x":0.134157,"y":0.023889,"z":0.012127,"mag":0.136806},{"point":"PD","x":0.071708,"y":-0.053129,"z":-0.003458,"mag":0.089312},{"point":"P1","x":0.630349,"y":-0.353984,"z":-0.399354,"mag":0.82591},{"point":"P2","x":0.620134,"y":-0.240099,"z":-0.50041,"mag":0.83224},{"point":"P4","x":0.681725,"y":-0.255962,"z":-0.561475,"mag":0.919521}]},"Structure 87.5\u00b0 PLM Installed":{"Delta Gain (dB)":{"nominal":null,"no_cal":2.738853,"cal":1.092475},"Delta AR (dB)":{"nominal":null,"no_cal":0.353349,"cal":0.137634},"Delta SLL (dB)":{"nominal":null,"no_cal":1.356926,"cal":1.356926},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":41.261147,"cal":42.907525},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":42.261147,"cal":43.907525},"AR (dB)":{"nominal":1.0,"no_cal":1.353349,"cal":1.137634},"SLL (dB)":{"nominal":19.0,"no_cal":17.643074,"cal":17.643074},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":0.002586,"y":0.0,"z":0.026562,"mag":0.026688},{"point":"PC","x":0.015786,"y":0.060183,"z":0.037188,"mag":0.072485},{"point":"PD","x":0.010743,"y":0.091545,"z":-0.010628,"mag":0.092784},{"point":"P1","x":0.400856,"y":-0.046888,"z":-0.328711,"mag":0.520514},{"point":"P2","x":0.373464,"y":-0.100446,"z":-0.324589,"mag":0.504899},{"point":"P4","x":0.408791,"y":-0.118614,"z":-0.34849,"mag":0.550113}]},"Structure 87.5\u00b0 PLM Preload":{"Delta Gain (dB)":{"nominal":null,"no_cal":2.865971,"cal":1.082994},"Delta AR (dB)":{"nominal":null,"no_cal":0.379693,"cal":0.145723},"Delta SLL (dB)":{"nominal":null,"no_cal":1.385386,"cal":1.385386},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":41.134029,"cal":42.917006},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":42.134029,"cal":43.917006},"AR (dB)":{"nominal":1.0,"no_cal":1.379693,"cal":1.145723},"SLL (dB)":{"nominal":19.0,"no_cal":17.614614,"cal":17.614614},"deviations":[{"point":"PA","x":-0.002255,"y":0.022599,"z":0.016544,"mag":0.028098},{"point":"PB","x":-0.147721,"y":0.001023,"z":0.035092,"mag":0.151835},{"point":"PC","x":-0.062362,"y":-0.017191,"z":0.042495,"mag":0.077398},{"point":"PD","x":-0.016285,"y":-0.016791,"z":0.009145,"mag":0.025115},{"point":"P1","x":-2.119027,"y":-0.125813,"z":-0.737663,"mag":2.247276},{"point":"P2","x":-2.051617,"y":-0.087563,"z":-0.671797,"mag":2.160581},{"point":"P4","x":-2.075981,"y":-0.200846,"z":-0.82043,"mag":2.241237}]},"Structure 87.5\u00b0 HDRM Preloaded":{"Delta Gain (dB)":{"nominal":null,"no_cal":2.651767,"cal":1.069092},"Delta AR (dB)":{"nominal":null,"no_cal":0.344946,"cal":0.137727},"Delta SLL (dB)":{"nominal":null,"no_cal":1.274959,"cal":1.274959},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":41.348233,"cal":42.930908},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":42.348233,"cal":43.930908},"AR (dB)":{"nominal":1.0,"no_cal":1.344946,"cal":1.137727},"SLL (dB)":{"nominal":19.0,"no_cal":17.725041,"cal":17.725041},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.022775,"y":0.0,"z":-0.009974,"mag":0.024863},{"point":"PC","x":0.052049,"y":-0.120879,"z":-0.013963,"mag":0.132347},{"point":"PD","x":0.061606,"y":-0.111049,"z":0.003986,"mag":0.127055},{"point":"P1","x":-1.854102,"y":-0.286366,"z":-0.765647,"mag":2.026306},{"point":"P2","x":-1.865643,"y":-0.307551,"z":-0.798869,"mag":2.052658},{"point":"P4","x":-1.786994,"y":-0.268388,"z":-0.759797,"mag":1.960273}]},"Structure 87.5\u00b0 Post Vibe":{"Delta Gain (dB)":{"nominal":null,"no_cal":2.897994,"cal":1.075427},"Delta AR (dB)":{"nominal":null,"no_cal":0.379181,"cal":0.139911},"Delta SLL (dB)":{"nominal":null,"no_cal":1.389471,"cal":1.389471},"Gain Tx band (dBi)":{"nominal":44.0,"no_cal":41.102006,"cal":42.924573},"Gain Rx band (dBi)":{"nominal":45.0,"no_cal":42.102006,"cal":43.924573},"AR (dB)":{"nominal":1.0,"no_cal":1.379181,"cal":1.139911},"SLL (dB)":{"nominal":19.0,"no_cal":17.610529,"cal":17.610529},"deviations":[{"point":"PA","x":0.0,"y":0.0,"z":0.0,"mag":0.0},{"point":"PB","x":-0.103464,"y":0.0,"z":0.037048,"mag":0.109897},{"point":"PC","x":-0.001726,"y":-0.055448,"z":0.051856,"mag":0.075938},{"point":"PD","x":0.011467,"y":-0.07496,"z":-0.014781,"mag":0.077259},{"point":"P1","x":-2.116583,"y":-0.291629,"z":-0.843427,"mag":2.297029},{"point":"P2","x":-2.124301,"y":-0.317311,"z":-0.860349,"mag":2.313772}]}}}};

// ─── SENER nominal SMR positions (mm) ────────────────────────────────────────
const NOMINAL = {
  pa:{x:0,y:0,z:0}, pb:{x:225,y:0,z:0}, pc:{x:0,y:-112.614,z:0}, pd:{x:125,y:-112.64,z:0},
  p1:{x:225,y:530.476,z:-470.739}, p2:{x:247,y:516.997,z:-488.126}, p4:{x:247,y:569.794,z:-529.059},
};

// ─── Alignment maths (JS port of Feed_Alignment_20260202.m) ──────────────────
function matMul(A, B) {
  // A: m×k, B: k×n  (both row-major flat arrays with dims)
  const [ma,ka]=A.dims, [kb,nb]=B.dims;
  const C = new Array(ma*nb).fill(0);
  for (let i=0;i<ma;i++) for (let j=0;j<nb;j++) for (let k=0;k<ka;k++)
    C[i*nb+j] += A.d[i*ka+k]*B.d[k*nb+j];
  return {d:C,dims:[ma,nb]};
}
function mat(d,dims){return {d,dims};}
function vec(d){return mat(d,[d.length,1]);}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function dot(a,b){return a.reduce((s,v,i)=>s+v*b[i],0);}
function norm(v){return Math.sqrt(dot(v,v));}
function sub(a,b){return a.map((v,i)=>v-b[i]);}
function scale(a,s){return a.map(v=>v*s);}
function transpose3(R){return[[R[0][0],R[1][0],R[2][0]],[R[0][1],R[1][1],R[2][1]],[R[0][2],R[1][2],R[2][2]]];}
function mat3vec(R,v){return R.map(row=>dot(row,v));}
function mat3mul(A,B){
  return A.map((row,i)=>B[0].map((_,j)=>row.reduce((s,_,k)=>s+A[i][k]*B[k][j],0)));
}
// Kabsch SVD via iterative (enough for 3×3)
function kabsch(A_cols, B_cols) {
  // A_cols, B_cols: arrays of 3-vectors (columns of the 3×n matrix)
  // Returns {R: 3x3 matrix, t: [tx,ty,tz]}
  const n = A_cols.length;
  // centroids
  const cA = [0,1,2].map(i=>A_cols.reduce((s,p)=>s+p[i],0)/n);
  const cB = [0,1,2].map(i=>B_cols.reduce((s,p)=>s+p[i],0)/n);
  // centred
  const Ac = A_cols.map(p=>sub(p,cA));
  const Bc = B_cols.map(p=>sub(p,cB));
  // H = sum Ac_i * Bc_i^T  (3×3)
  const H = [[0,0,0],[0,0,0],[0,0,0]];
  for(let k=0;k<n;k++) for(let i=0;i<3;i++) for(let j=0;j<3;j++) H[i][j]+=Ac[k][i]*Bc[k][j];
  // SVD of 3×3 via Jacobi (simplified - sufficient for near-identity rotations)
  const {U,S,Vt} = svd3(H);
  // R = V * U^T
  const V = transpose3(Vt);
  const Ut = transpose3(U);
  let R = mat3mul(V,Ut);
  // Ensure proper rotation (det = +1)
  const det = R[0][0]*(R[1][1]*R[2][2]-R[1][2]*R[2][1])
             -R[0][1]*(R[1][0]*R[2][2]-R[1][2]*R[2][0])
             +R[0][2]*(R[1][0]*R[2][1]-R[1][1]*R[2][0]);
  if(det < 0){
    const Vcorr = V.map((r,i)=>r.map((v,j)=>i===2?-v:v));
    R = mat3mul(Vcorr,Ut);
  }
  const t = sub(cB, mat3vec(R,cA));
  return {R, t};
}
// Simple 3×3 SVD via Jacobi iteration
function svd3(A){
  // Returns U, S, Vt such that A = U*diag(S)*Vt
  // We use one-sided Jacobi on A^T A to get V, then U = A V S^-1
  let V = [[1,0,0],[0,1,0],[0,0,1]];
  let M = A.map(r=>[...r]);
  for(let iter=0;iter<50;iter++){
    let converged=true;
    for(let p=0;p<3;p++) for(let q=p+1;q<3;q++){
      // Apply Jacobi rotation to symmetrize M^T M
      const [a,b,c]=[M[0][p],M[1][p],M[2][p]];
      const [d,e,f]=[M[0][q],M[1][q],M[2][q]];
      const app=a*a+b*b+c*c, aqq=d*d+e*e+f*f, apq=a*d+b*e+c*f;
      if(Math.abs(apq)<1e-12*Math.sqrt(app*aqq)) continue;
      converged=false;
      const tau=(aqq-app)/(2*apq);
      const t2=tau>=0?1/(tau+Math.sqrt(1+tau*tau)):1/(tau-Math.sqrt(1+tau*tau));
      const c2=1/Math.sqrt(1+t2*t2), s2=t2*c2;
      // Rotate columns p,q of M
      for(let i=0;i<3;i++){const mp=M[i][p],mq=M[i][q];M[i][p]=c2*mp-s2*mq;M[i][q]=s2*mp+c2*mq;}
      // Accumulate into V
      for(let i=0;i<3;i++){const vp=V[i][p],vq=V[i][q];V[i][p]=c2*vp-s2*vq;V[i][q]=s2*vp+c2*vq;}
    }
    if(converged) break;
  }
  const S = [0,1,2].map(j=>Math.sqrt(M[0][j]**2+M[1][j]**2+M[2][j]**2));
  const U = [[0,0,0],[0,0,0],[0,0,0]];
  for(let j=0;j<3;j++) if(S[j]>1e-12) for(let i=0;i<3;i++) U[i][j]=M[i][j]/S[j];
    else for(let i=0;i<3;i++) U[i][j]=i===j?1:0;
  return {U, S, Vt: transpose3(V)};
}

function computeAlignment(pts, linearGain=1.0) {
  // pts: {pa,pb,pc,pd,p1,p2,p4} each [x,y,z]
  const {pa,pb,pc,pd,p1,p2,p4} = pts;
  const p1m=pa, p2m=pb, p3m=pc, p7m=pd, p4m=p1, p5m=p2, p6m=p4;
  const p1n=[0,0,0],p2n=[225,0,0],p3n=[0,-112.615,0];
  const p4n=[225,530.476,-470.739],p5n=[247,516.996,-488.126],p6n=[247,569.794,-529.059];

  // Substructure best-fit
  const subFit = kabsch([p1n,p2n,p3n],[p1m,p2m,p3m]);
  const {R:Rs,t:ts} = subFit;

  // Target positions for feed points
  const p4obj = [0,1,2].map(i=>ts[i]+dot(Rs[i],p4n));
  const p5obj = [0,1,2].map(i=>ts[i]+dot(Rs[i],p5n));
  const p6obj = [0,1,2].map(i=>ts[i]+dot(Rs[i],p6n));

  // Required motion of feed
  const motFit = kabsch([p4m,p5m,p6m],[p4obj,p5obj,p6obj]);
  const {R:Rm,t:tm} = motFit;

  const Th_X = -Rm[1][2];
  const Th_Y =  Rm[0][2];
  const Th_Z = -Rm[0][1];
  const [tx,ty,tz] = tm;

  // Transform to feed local frame (theta = -52.213927 deg)
  const theta = -52.213927 * Math.PI/180;
  const Rfeed = [[1,0,0],[0,Math.cos(theta),-Math.sin(theta)],[0,Math.sin(theta),Math.cos(theta)]];

  const rot_vec_local = mat3vec(Rfeed,[Th_X,Th_Y,Th_Z]);
  const t_feed_local  = mat3vec(Rfeed,[tx,ty,tz]);

  // Bug-1 fix: re-express translation in post-rotation frame
  const Rm_local = mat3mul(mat3mul(Rfeed,Rm),transpose3(Rfeed));
  const t_corr   = mat3vec(transpose3(Rm_local),t_feed_local).map(v=>v*linearGain);

  // Check if rotations are within tolerance
  const tol = 0.05;
  const rotTiny = Math.abs(Rm[0][2])<tol && Math.abs(Rm[1][2])<tol && Math.abs(Rm[0][1])<tol;

  let DOF;
  if(rotTiny){
    // Pure translation fallback
    const diffs = [[0,1,2].map(i=>p4obj[i]-p4m[i]),[0,1,2].map(i=>p5obj[i]-p5m[i]),[0,1,2].map(i=>p6obj[i]-p6m[i])];
    const meanDiff = [0,1,2].map(i=>(diffs[0][i]+diffs[1][i]+diffs[2][i])/3);
    const t_pure = mat3vec(Rfeed,meanDiff).map(v=>v*linearGain);
    DOF = [...t_pure,0,0,0];
  } else {
    DOF = [...t_corr,...rot_vec_local];
  }

  // Actuator matrix
  const Arm_X=111.6, Arm_Y=126.7, Arm_Z=92.3;
  const act2DOF = [
    [-1,0,0,0,Arm_Z/87.25,Arm_Y/91.41],
    [0,1,0,Arm_Z/87.25,0,-Arm_X/91.41],
    [0,0,1,Arm_Y/87.25,-Arm_X/87.25,0],
    [0,0,0,-1/91.41,0,0],
    [0,0,0,0,1/87.25,0],
    [0,0,0,0,0,1/87.25],
  ];
  // Invert 6×6 (use Gaussian elimination)
  const DOF2act = inv6(act2DOF);
  const act = DOF2act.map(row=>dot(row,DOF));
  act[0] = -act[0];

  let AXIS_1= act[0], AXIS_2= act[1], AXIS_3=-act[2];
  let AXIS_4= act[3], AXIS_5= act[5], AXIS_6=-act[4];

  if(rotTiny){ AXIS_4=0; AXIS_5=0; AXIS_6=0; }

  // Coordinate errors (feed points vs nominal in measured frame)
  const coordErrors = [
    {pt:"P1(p4)", ex:+(p4n[0]-p4m[0]).toFixed(4), ey:+(p4n[1]-p4m[1]).toFixed(4), ez:+(p4n[2]-p4m[2]).toFixed(4)},
    {pt:"P2(p5)", ex:+(p5n[0]-p5m[0]).toFixed(4), ey:+(p5n[1]-p5m[1]).toFixed(4), ez:+(p5n[2]-p5m[2]).toFixed(4)},
    {pt:"P4(p6)", ex:+(p6n[0]-p6m[0]).toFixed(4), ey:+(p6n[1]-p6m[1]).toFixed(4), ez:+(p6n[2]-p6m[2]).toFixed(4)},
  ];

  const rotConverged = rotTiny;
  const linear_tol = 0.1;
  const linearConverged = Math.abs(AXIS_1)<linear_tol && Math.abs(AXIS_2)<linear_tol && Math.abs(AXIS_3)<linear_tol;

  return {
    rotations: {AXIS_4:+AXIS_4.toFixed(4), AXIS_5:+AXIS_5.toFixed(4), AXIS_6:+AXIS_6.toFixed(4)},
    linear:    {AXIS_1:+AXIS_1.toFixed(4), AXIS_2:+AXIS_2.toFixed(4), AXIS_3:+AXIS_3.toFixed(4)},
    coordErrors, rotConverged, linearConverged, linearGain,
    rotTxt: formatMotionFile([AXIS_4,AXIS_5,AXIS_6]),
    linTxt: formatMotionFile([AXIS_1,AXIS_2,AXIS_3]),
  };
}

function inv6(A){
  // Gaussian elimination with partial pivoting on 6×6
  const n=6;
  const M=A.map(r=>[...r,...Array(n).fill(0).map((_,j)=>j===A.indexOf(r)?1:0)]);
  // re-do identity correctly
  const aug=A.map((r,i)=>[...r,...Array(n).fill(0).map((_,j)=>j===i?1:0)]);
  for(let col=0;col<n;col++){
    let maxRow=col;
    for(let row=col+1;row<n;row++) if(Math.abs(aug[row][col])>Math.abs(aug[maxRow][col])) maxRow=row;
    [aug[col],aug[maxRow]]=[aug[maxRow],aug[col]];
    const pivot=aug[col][col];
    for(let j=0;j<2*n;j++) aug[col][j]/=pivot;
    for(let row=0;row<n;row++) if(row!==col){
      const f=aug[row][col];
      for(let j=0;j<2*n;j++) aug[row][j]-=f*aug[col][j];
    }
  }
  return aug.map(r=>r.slice(n));
}

function formatMotionFile(axes){
  // axes: [ax1, ax2, ax3]  → same format as MATLAB output
  return axes.map((v,i)=>{
    const s = v>=0?`+${Math.abs(v).toFixed(3)}`:`-${Math.abs(v).toFixed(3)}`;
    return `${i+1}PR${s}\n${i+1}WS`;
  }).join("\n") + (axes.length===3 ? "" : "");
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseTxt(text){
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
  let phase="Flotron 90° Alignment";
  if(lower.includes("post_vibe")||lower.includes("vibe")) phase="Structure 87.5° Post Vibe";
  else if(lower.includes("hdrm")) phase="Structure 87.5° HDRM Preloaded";
  else if(lower.includes("plm")&&lower.includes("preload")) phase="Structure 87.5° PLM Preload";
  else if(lower.includes("plm")) phase="Structure 87.5° PLM Installed";
  else if(lower.includes("272")) phase="Structure 272.5° No Preload";
  else if(lower.includes("87")) phase="Flotron 87.5°";
  return {satKey,fmNum,bbNum,qvKey,phase};
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const C={
  QV1:"#00d4ff",QV2:"#ff6b35",QV3:"#a8ff3e",
  bg:"#0a0e1a",surface:"#111827",border:"#1e2d45",
  text:"#e2e8f0",muted:"#64748b",accent:"#0ea5e9",
  warn:"#f59e0b",danger:"#ef4444",good:"#22c55e",info:"#a78bfa",
};
const PHASE_SHORT={"Flotron 90° Alignment":"F-90°","Flotron 87.5°":"F-87.5°","Flotron 272.5°":"F-272.5°","Structure 272.5° No Preload":"S-272.5°","Structure 87.5° PLM Installed":"S-PLM","Structure 87.5° PLM Preload":"S-PLM PL","Structure 87.5° HDRM Preloaded":"S-HDRM","Structure 87.5° Post Vibe":"S-PostVibe"};
const NOM={"Gain Tx band (dBi)":44,"Gain Rx band (dBi)":45,"AR (dB)":1,"SLL (dB)":19};

function copyToClipboard(text){
  try{navigator.clipboard.writeText(text);}catch(e){
    const el=document.createElement("textarea");
    el.value=text;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Tok({active,onClick,children,color}){
  return <button onClick={onClick} style={{padding:"4px 12px",borderRadius:20,fontSize:11,cursor:"pointer",background:active?(color||C.accent):C.surface,color:active?"#fff":C.muted,border:`1px solid ${active?(color||C.accent):C.border}`,transition:"all .15s"}}>{children}</button>;
}
function MetricCard({label,value,unit,nominal,higherIsBetter}){
  const diff=value!==null&&value!==undefined&&nominal?value-nominal:null;
  const good=diff!==null?(higherIsBetter?diff>=-0.2:diff<=0.05):null;
  const med=diff!==null?(higherIsBetter?diff>=-0.5:diff<=0.15):null;
  const col=value==null?C.muted:good?C.good:med?C.warn:C.danger;
  return <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 16px",minWidth:130}}>
    <div style={{fontSize:10,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</div>
    <div style={{fontSize:20,fontWeight:700,color:col,fontFamily:"monospace"}}>{value==null?"—":value.toFixed(3)}<span style={{fontSize:11,color:C.muted,marginLeft:4}}>{unit}</span></div>
    {nominal&&value!=null&&<div style={{fontSize:10,color:C.muted,marginTop:3}}>Nom: {nominal} | Δ <span style={{color:col}}>{diff>=0?"+":""}{diff.toFixed(3)}</span></div>}
  </div>;
}
function CT({active,payload,label}){
  if(!active||!payload?.length) return null;
  return <div style={{background:"#1e2d45",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:12}}>
    <div style={{color:C.muted,marginBottom:6}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color,marginBottom:2}}>{p.name}: <b>{typeof p.value==="number"?p.value.toFixed(4):p.value}</b></div>)}
  </div>;
}
function DevTable({devs}){
  if(!devs?.length) return <div style={{color:C.muted,fontSize:13}}>No deviation data</div>;
  return <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,fontFamily:"monospace"}}>
    <thead><tr style={{color:C.muted,borderBottom:`1px solid ${C.border}`}}>
      {["Point","ΔX (mm)","ΔY (mm)","ΔZ (mm)","|Δ| (mm)"].map(h=><th key={h} style={{padding:"6px 8px",textAlign:"right",fontWeight:500}}>{h}</th>)}
    </tr></thead>
    <tbody>{devs.map((d,i)=>{const ov=d.mag>0.5;return <tr key={i} style={{borderBottom:`1px solid ${C.border}22`,background:ov?"#ef444408":"transparent"}}>
      <td style={{padding:"5px 8px",color:C.accent,fontWeight:700}}>{d.point}</td>
      {[d.x,d.y,d.z,d.mag].map((v,j)=><td key={j} style={{padding:"5px 8px",textAlign:"right",color:j===3?(ov?C.danger:C.good):C.text}}>{v!=null?v.toFixed(4):"—"}</td>)}
    </tr>;})}
    </tbody>
  </table>;
}

// ─── Alignment Panel ──────────────────────────────────────────────────────────
function AlignmentPanel(){
  const [pts, setPts] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]); // [{iter, rotations, linear, coordErrors, pts}]
  const [gain, setGain] = useState(1.0);
  const [copied, setCopied] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    const r = new FileReader();
    r.onload = (e) => {
      const raw = parseTxt(e.target.result);
      if(!raw.pa || !raw.p1){
        alert("File missing expected SMR labels (pA, pB, pC, pD, p1, p2, p4)");
        return;
      }
      const pObj = ptsToObj(raw);
      setPts(pObj);
      const res = computeAlignment({
        pa:[raw.pa[0],raw.pa[1],raw.pa[2]],
        pb:[raw.pb[0],raw.pb[1],raw.pb[2]],
        pc:[raw.pc[0],raw.pc[1],raw.pc[2]],
        pd:[raw.pd[0],raw.pd[1],raw.pd[2]],
        p1:[raw.p1[0],raw.p1[1],raw.p1[2]],
        p2:[raw.p2[0],raw.p2[1],raw.p2[2]],
        p4:[raw.p4[0],raw.p4[1],raw.p4[2]],
      }, gain);
      setResult(res);
      setHistory(prev=>[...prev, {
        iter: prev.length+1, filename: file.name,
        ...res, pts: pObj,
        devs: computeDeviations(pObj),
      }]);
    };
    r.readAsText(file);
  };

  const copy = (text, key) => {
    copyToClipboard(text);
    setCopied(key);
    setTimeout(()=>setCopied(""),2000);
  };

  const AxisBlock = ({label, axes, txtContent, copyKey, converged, color}) => (
    <div style={{background:C.surface,border:`2px solid ${converged?C.good:color}`,borderRadius:12,padding:18,flex:1}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:14,color}}>{label}</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {converged&&<span style={{fontSize:11,color:C.good,background:C.good+"22",padding:"2px 8px",borderRadius:10}}>✓ Within tolerance</span>}
          <button onClick={()=>copy(txtContent, copyKey)} style={{fontSize:11,padding:"4px 10px",borderRadius:6,cursor:"pointer",background:copied===copyKey?C.good:C.accent,color:"#fff",border:"none",transition:"background .3s"}}>
            {copied===copyKey?"Copied!":"Copy output"}
          </button>
        </div>
      </div>
      <div style={{fontFamily:"monospace",fontSize:13,background:"#070b14",borderRadius:8,padding:12,whiteSpace:"pre",color:C.text,lineHeight:1.7}}>
        {txtContent}
      </div>
      <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
        {Object.entries(axes).map(([k,v])=>{
          const over=Math.abs(v)>0.5, near=Math.abs(v)>0.1;
          return <div key={k} style={{flex:1,minWidth:80,background:"#070b14",borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
            <div style={{fontSize:10,color:C.muted,marginBottom:4}}>{k}</div>
            <div style={{fontSize:18,fontWeight:700,fontFamily:"monospace",color:over?C.danger:near?C.warn:C.good}}>{v>=0?"+":""}{v.toFixed(3)}</div>
            <div style={{fontSize:10,color:C.muted}}>mm</div>
          </div>;
        })}
      </div>
    </div>
  );

  return (
    <div>
      {/* Upload zone */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:12,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.08em"}}>
          Upload laser tracker measurement — alignment will be computed automatically
        </div>
        <div onDragOver={(e)=>{e.preventDefault();setDragging(true);}}
          onDragLeave={()=>setDragging(false)}
          onDrop={(e)=>{e.preventDefault();setDragging(false);[...e.dataTransfer.files].forEach(handleFile);}}
          onClick={()=>fileRef.current.click()}
          style={{border:`2px dashed ${dragging?C.accent:C.border}`,borderRadius:12,padding:"28px 20px",textAlign:"center",cursor:"pointer",background:dragging?"#0ea5e912":"transparent",transition:"all .2s"}}>
          <input ref={fileRef} type="file" accept=".txt" style={{display:"none"}} onChange={(e)=>[...e.target.files].forEach(handleFile)}/>
          <div style={{fontSize:28,marginBottom:8}}>📐</div>
          <div style={{color:C.text,fontWeight:600,marginBottom:4}}>Drop SMR measurement file (.txt)</div>
          <div style={{color:C.muted,fontSize:12}}>Format: pA, x, y, z (one point per line)</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginTop:12}}>
          <span style={{fontSize:12,color:C.muted}}>Linear gain:</span>
          <input type="number" value={gain} step={0.05} min={0.7} max={1.3}
            onChange={e=>setGain(parseFloat(e.target.value)||1.0)}
            style={{width:70,padding:"4px 8px",borderRadius:6,background:C.surface,border:`1px solid ${C.border}`,color:C.text,fontSize:12}}/>
          <span style={{fontSize:11,color:C.muted}}>(default 1.0 — adjust 0.85–1.15 based on historical residuals)</span>
          {history.length>0&&<button onClick={()=>{setHistory([]);setPts(null);setResult(null);}} style={{marginLeft:"auto",fontSize:11,padding:"4px 10px",borderRadius:6,cursor:"pointer",background:C.surface,color:C.danger,border:`1px solid ${C.danger}`}}>Clear history</button>}
        </div>
      </div>

      {result && (
        <>
          {/* Step indicator */}
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:16}}>
            <div style={{padding:"6px 16px",borderRadius:20,background:"#6366f122",border:"1px solid #6366f1",fontSize:12,color:"#a5b4fc",fontWeight:600}}>
              STEP 1 — Apply rotations first
            </div>
            <div style={{color:C.muted,fontSize:18}}>→</div>
            <div style={{padding:"6px 16px",borderRadius:20,background:"#0ea5e922",border:"1px solid #0ea5e9",fontSize:12,color:"#7dd3fc",fontWeight:600}}>
              STEP 2 — Take new measurement
            </div>
            <div style={{color:C.muted,fontSize:18}}>→</div>
            <div style={{padding:"6px 16px",borderRadius:20,background:"#22c55e22",border:"1px solid #22c55e",fontSize:12,color:"#86efac",fontWeight:600}}>
              STEP 3 — Apply linear moves
            </div>
          </div>

          {/* Axis blocks */}
          <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
            <AxisBlock label="ROTATION PLATFORM (do first)" axes={result.rotations} txtContent={result.rotTxt} copyKey="rot" converged={result.rotConverged} color="#6366f1"/>
            <AxisBlock label="LINEAR STAGE (do after re-measurement)" axes={result.linear} txtContent={result.linTxt} copyKey="lin" converged={result.linearConverged} color={C.accent}/>
          </div>

          {/* Coordinate errors */}
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Feed SMR coordinate errors (nom − meas, mm)</div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,fontFamily:"monospace"}}>
              <thead><tr style={{color:C.muted,borderBottom:`1px solid ${C.border}`}}>
                {["Point","Err X","Err Y","Err Z"].map(h=><th key={h} style={{padding:"5px 8px",textAlign:"right"}}>{h}</th>)}
              </tr></thead>
              <tbody>{result.coordErrors.map((row,i)=>{
                const mx=Math.max(Math.abs(row.ex),Math.abs(row.ey),Math.abs(row.ez));
                return <tr key={i} style={{borderBottom:`1px solid ${C.border}22`}}>
                  <td style={{padding:"5px 8px",color:C.accent,fontWeight:700}}>{row.pt}</td>
                  {[row.ex,row.ey,row.ez].map((v,j)=><td key={j} style={{padding:"5px 8px",textAlign:"right",color:Math.abs(v)>0.5?C.danger:Math.abs(v)>0.1?C.warn:C.good}}>{v>=0?"+":""}{v.toFixed(4)}</td>)}
                </tr>;
              })}</tbody>
            </table>
          </div>
        </>
      )}

      {/* History */}
      {history.length>0&&(
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>
            Alignment history — {history.length} iteration{history.length>1?"s":""}
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,fontFamily:"monospace",minWidth:700}}>
              <thead><tr style={{color:C.muted,borderBottom:`1px solid ${C.border}`}}>
                {["INT","File","Rot A4","Rot A5","Rot A6","Lin A1","Lin A2","Lin A3","Rot OK","Lin OK"].map(h=><th key={h} style={{padding:"6px 10px",textAlign:"right",whiteSpace:"nowrap"}}>{h}</th>)}
              </tr></thead>
              <tbody>{history.map((h,i)=><tr key={i} style={{borderBottom:`1px solid ${C.border}22`,background:i===history.length-1?"#0ea5e908":"transparent"}}>
                <td style={{padding:"5px 10px",color:C.accent,fontWeight:700}}>INT {h.iter}</td>
                <td style={{padding:"5px 10px",color:C.muted,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.filename}</td>
                {[h.rotations.AXIS_4,h.rotations.AXIS_5,h.rotations.AXIS_6].map((v,j)=><td key={j} style={{padding:"5px 10px",textAlign:"right",color:Math.abs(v)<0.05?C.good:Math.abs(v)<0.2?C.warn:C.danger}}>{v>=0?"+":""}{v.toFixed(3)}</td>)}
                {[h.linear.AXIS_1,h.linear.AXIS_2,h.linear.AXIS_3].map((v,j)=><td key={j} style={{padding:"5px 10px",textAlign:"right",color:Math.abs(v)<0.1?C.good:Math.abs(v)<0.3?C.warn:C.danger}}>{v>=0?"+":""}{v.toFixed(3)}</td>)}
                <td style={{padding:"5px 10px",textAlign:"right"}}>{h.rotConverged?<span style={{color:C.good}}>✓</span>:<span style={{color:C.danger}}>✗</span>}</td>
                <td style={{padding:"5px 10px",textAlign:"right"}}>{h.linearConverged?<span style={{color:C.good}}>✓</span>:<span style={{color:C.danger}}>✗</span>}</td>
              </tr>)}
              </tbody>
            </table>
          </div>
          {/* Convergence chart */}
          {history.length>1&&<div style={{marginTop:16}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:8}}>Convergence — residual axis motions per iteration</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={history.map(h=>({iter:`INT ${h.iter}`,A1:Math.abs(h.linear.AXIS_1),A2:Math.abs(h.linear.AXIS_2),A3:Math.abs(h.linear.AXIS_3),A4:Math.abs(h.rotations.AXIS_4),A5:Math.abs(h.rotations.AXIS_5),A6:Math.abs(h.rotations.AXIS_6)}))}>
                <CartesianGrid stroke={C.border} strokeDasharray="4 4"/>
                <XAxis dataKey="iter" tick={{fill:C.muted,fontSize:10}}/>
                <YAxis tick={{fill:C.muted,fontSize:10}} unit="mm"/>
                <Tooltip content={<CT/>}/>
                <ReferenceLine y={0.1} stroke={C.warn} strokeDasharray="4 3" label={{value:"0.1mm tol",fill:C.warn,fontSize:9}}/>
                <Line type="monotone" dataKey="A1" stroke={C.QV1} strokeWidth={2} dot={{r:3}} name="|A1|" connectNulls/>
                <Line type="monotone" dataKey="A2" stroke={C.QV2} strokeWidth={2} dot={{r:3}} name="|A2|" connectNulls/>
                <Line type="monotone" dataKey="A3" stroke={C.QV3} strokeWidth={2} dot={{r:3}} name="|A3|" connectNulls/>
                <Line type="monotone" dataKey="A4" stroke="#6366f1" strokeWidth={1} dot={{r:2}} strokeDasharray="4 2" name="|A4 rot|" connectNulls/>
                <Line type="monotone" dataKey="A5" stroke="#a78bfa" strokeWidth={1} dot={{r:2}} strokeDasharray="4 2" name="|A5 rot|" connectNulls/>
                <Line type="monotone" dataKey="A6" stroke="#c4b5fd" strokeWidth={1} dot={{r:2}} strokeDasharray="4 2" name="|A6 rot|" connectNulls/>
                <Legend wrapperStyle={{color:C.muted,fontSize:11}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>}
        </div>
      )}
    </div>
  );
}

// ─── Position history tab ─────────────────────────────────────────────────────
function PositionHistoryTab({satData, selectedQV, allPhases, selectedPhase, setSelectedPhase, calMode}){
  const calKey = calMode?"cal":"no_cal";
  // For each phase, pull feed point (P1/P2/P4) deviations
  const FEED_PTS = ["P1","P2","P4"];
  const BRACKET_PTS = ["PA","PB","PC","PD"];

  const trendForPoint = (pt) => allPhases.map(ph=>{
    const devs = satData[selectedQV]?.[ph]?.deviations||[];
    const d = devs.find(dv=>dv.point===pt);
    return {phase: PHASE_SHORT[ph]||ph, phaseFull:ph, x:d?.x??null, y:d?.y??null, z:d?.z??null, mag:d?.mag??null};
  });

  const [selPoint, setSelPoint] = useState("P1");
  const trend = trendForPoint(selPoint);

  // Summary table: all points at selected phase
  const phaseDevs = satData[selectedQV]?.[selectedPhase]?.deviations||[];

  return <div>
    <div style={{marginBottom:16,display:"flex",flexWrap:"wrap",gap:6}}>
      {allPhases.map(p=><Tok key={p} active={selectedPhase===p} onClick={()=>setSelectedPhase(p)}>{PHASE_SHORT[p]||p}</Tok>)}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
      {/* Feed point trends */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>
          Feed Point Position Deviation — across integration
        </div>
        <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
          {[...FEED_PTS,...BRACKET_PTS].map(pt=><Tok key={pt} active={selPoint===pt} onClick={()=>setSelPoint(pt)} color={FEED_PTS.includes(pt)?C.accent:C.info}>{pt}</Tok>)}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trend} margin={{left:0,right:10}}>
            <CartesianGrid stroke={C.border} strokeDasharray="4 4"/>
            <XAxis dataKey="phase" tick={{fill:C.muted,fontSize:10}}/>
            <YAxis tick={{fill:C.muted,fontSize:10}} unit="mm" tickFormatter={v=>v.toFixed(2)}/>
            <Tooltip content={<CT/>}/>
            <ReferenceLine y={0} stroke={C.muted} strokeDasharray="3 3"/>
            <ReferenceLine y={0.5} stroke={C.warn} strokeDasharray="4 3" label={{value:"0.5mm",fill:C.warn,fontSize:9}}/>
            <ReferenceLine y={-0.5} stroke={C.warn} strokeDasharray="4 3"/>
            <Line type="monotone" dataKey="x" stroke={C.QV1} strokeWidth={2} dot={{r:3}} name="ΔX" connectNulls/>
            <Line type="monotone" dataKey="y" stroke={C.QV2} strokeWidth={2} dot={{r:3}} name="ΔY" connectNulls/>
            <Line type="monotone" dataKey="z" stroke={C.QV3} strokeWidth={2} dot={{r:3}} name="ΔZ" connectNulls/>
            <Line type="monotone" dataKey="mag" stroke={C.accent} strokeWidth={2} strokeDasharray="5 2" dot={{r:4}} name="|Δ|" connectNulls/>
            <Legend wrapperStyle={{color:C.muted,fontSize:11}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* All-points magnitude heatmap at selected phase */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>
          All SMR Magnitudes at {PHASE_SHORT[selectedPhase]||selectedPhase}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={phaseDevs.filter(d=>d.mag!=null).map(d=>({point:d.point,mag:d.mag}))}>
            <CartesianGrid stroke={C.border} strokeDasharray="4 4"/>
            <XAxis dataKey="point" tick={{fill:C.muted,fontSize:11}}/>
            <YAxis tick={{fill:C.muted,fontSize:10}} unit="mm"/>
            <Tooltip content={<CT/>}/>
            <ReferenceLine y={0.5} stroke={C.warn} strokeDasharray="4 3" label={{value:"0.5mm",fill:C.warn,fontSize:9}}/>
            <Bar dataKey="mag" name="Magnitude (mm)" radius={[4,4,0,0]}
              fill={C.accent}
              label={{position:"top",formatter:v=>v.toFixed(3),fill:C.muted,fontSize:9}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* X/Y/Z breakdown across all phases for all feed points */}
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:16}}>
      <div style={{fontSize:12,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>
        Feed vs Bracket max deviation magnitude — integration trend for {selectedQV}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={allPhases.map(ph=>{
          const devs=satData[selectedQV]?.[ph]?.deviations||[];
          const feedMags=devs.filter(d=>["P1","P2","P4"].includes(d.point)).map(d=>d.mag).filter(v=>v!=null);
          const bktMags=devs.filter(d=>["PA","PB","PC","PD"].includes(d.point)).map(d=>d.mag).filter(v=>v!=null);
          return {phase:PHASE_SHORT[ph]||ph,
            feedMax:feedMags.length?+Math.max(...feedMags).toFixed(4):null,
            feedMean:feedMags.length?+( feedMags.reduce((a,b)=>a+b,0)/feedMags.length).toFixed(4):null,
            bracketMax:bktMags.length?+Math.max(...bktMags).toFixed(4):null};
        })}>
          <CartesianGrid stroke={C.border} strokeDasharray="4 4"/>
          <XAxis dataKey="phase" tick={{fill:C.muted,fontSize:10}}/>
          <YAxis tick={{fill:C.muted,fontSize:10}} unit="mm" tickFormatter={v=>v.toFixed(2)}/>
          <Tooltip content={<CT/>}/>
          <ReferenceLine y={0.5} stroke={C.warn} strokeDasharray="4 3" label={{value:"0.5mm",fill:C.warn,fontSize:9}}/>
          <Line type="monotone" dataKey="feedMax" stroke={C.QV1} strokeWidth={2} dot={{r:4}} name="Feed max |Δ|" connectNulls/>
          <Line type="monotone" dataKey="feedMean" stroke={C.QV1} strokeWidth={1} strokeDasharray="5 2" dot={{r:3}} name="Feed mean |Δ|" connectNulls/>
          <Line type="monotone" dataKey="bracketMax" stroke={C.info} strokeWidth={2} dot={{r:4}} name="Bracket max |Δ|" connectNulls/>
          <Legend wrapperStyle={{color:C.muted,fontSize:11}}/>
        </LineChart>
      </ResponsiveContainer>
    </div>

    {/* Full deviation table */}
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
      <div style={{fontSize:12,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>
        Full SMR deviation table — {selectedQV} at {PHASE_SHORT[selectedPhase]||selectedPhase}
      </div>
      <DevTable devs={phaseDevs}/>
    </div>
  </div>;
}

// ─── Upload panel (shared) ────────────────────────────────────────────────────
function UploadPanel({onUpload}){
  const [drag,setDrag]=useState(false);
  const ref=useRef();
  const handle=(file)=>{
    const r=new FileReader();
    r.onload=(e)=>{
      const raw=parseTxt(e.target.result);
      const pObj=ptsToObj(raw);
      const meta=parseFilename(file.name);
      onUpload({meta,deviations:computeDeviations(pObj),filename:file.name});
    };
    r.readAsText(file);
  };
  return <div onDragOver={(e)=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
    onDrop={(e)=>{e.preventDefault();setDrag(false);[...e.dataTransfer.files].forEach(handle);}}
    onClick={()=>ref.current.click()}
    style={{border:`2px dashed ${drag?C.accent:C.border}`,borderRadius:12,padding:"24px 16px",textAlign:"center",cursor:"pointer",background:drag?"#0ea5e912":"transparent",transition:"all .2s"}}>
    <input ref={ref} type="file" accept=".txt" multiple style={{display:"none"}} onChange={(e)=>[...e.target.files].forEach(handle)}/>
    <div style={{fontSize:24,marginBottom:6}}>📡</div>
    <div style={{color:C.text,fontWeight:600,marginBottom:3,fontSize:13}}>Drop laser tracker TXT files</div>
    <div style={{color:C.muted,fontSize:11}}>e.g. FM4_QV1_Post_PLM_Preload_INT_1</div>
  </div>;
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function QVDashboard(){
  const [extraData, setExtraData] = useState({});
  const [selSat, setSelSat] = useState("BB8");
  const [selQV, setSelQV] = useState("QV1");
  const [selPhase, setSelPhase] = useState("Flotron 90° Alignment");
  const [calMode, setCalMode] = useState(false);
  const [tab, setTab] = useState("overview");
  const [log, setLog] = useState([]);

  const allData = {...ALL_DATA,...extraData};
  const sats = Object.keys(allData).sort();
  const satInfo = allData[selSat]||{};
  const qvData = satInfo[selQV]||{};
  const phases = Object.keys(qvData);
  const phaseData = qvData[selPhase]||{};
  const calKey = calMode?"cal":"no_cal";

  const satLabel = (s)=>{ const d=allData[s]; return d?`${d.fmName||s} (${s})`:s; };

  const handleUpload = useCallback(({meta,deviations,filename})=>{
    const {satKey,qvKey,phase,fmNum,bbNum}=meta;
    if(!satKey||!qvKey||!phase){setLog(l=>[...l,{filename,status:"error",msg:"Could not parse filename"}]);return;}
    setExtraData(prev=>{
      const next=JSON.parse(JSON.stringify(prev));
      if(!next[satKey]) next[satKey]={fmName:`FM${fmNum}`,bbName:satKey,QV1:{},QV2:{},QV3:{}};
      if(!next[satKey][qvKey]) next[satKey][qvKey]={};
      next[satKey][qvKey][phase]={"Gain Tx band (dBi)":{nominal:44,no_cal:null,cal:null},"Gain Rx band (dBi)":{nominal:45,no_cal:null,cal:null},"AR (dB)":{nominal:1,no_cal:null,cal:null},"SLL (dB)":{nominal:19,no_cal:null,cal:null},deviations};
      return next;
    });
    setLog(l=>[...l,{filename,status:"ok",msg:`→ ${satKey} / ${qvKey} / ${PHASE_SHORT[phase]||phase}`}]);
    setSelSat(satKey); setSelQV(qvKey); setSelPhase(phase);
  },[]);

  const radarData=["Gain Tx band (dBi)","Gain Rx band (dBi)","AR (dB)","SLL (dB)"].map(m=>{
    const nom=NOM[m];
    const entry={metric:m.replace(" band (dBi)","").replace(" (dB)","")};
    ["QV1","QV2","QV3"].forEach(qv=>{const v=allData[selSat]?.[qv]?.[selPhase]?.[m]?.[calKey];entry[qv]=v!=null?+(v/nom*100).toFixed(3):null;});
    return entry;
  });

  const trendData=phases.map(ph=>({phase:PHASE_SHORT[ph]||ph,"Gain Tx":qvData[ph]?.["Gain Tx band (dBi)"]?.[calKey],"Gain Rx":qvData[ph]?.["Gain Rx band (dBi)"]?.[calKey],"AR":qvData[ph]?.["AR (dB)"]?.[calKey],"SLL":qvData[ph]?.["SLL (dB)"]?.[calKey]}));

  const tabBtn = (t,label) => <button onClick={()=>setTab(t)} style={{padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:tab===t?700:400,color:tab===t?C.accent:C.muted,borderBottom:`2px solid ${tab===t?C.accent:"transparent"}`,background:"transparent",border:"none",outline:"none"}}>{label}</button>;

  return <div style={{background:C.bg,color:C.text,minHeight:"100vh",fontFamily:"'Inter','Segoe UI',sans-serif",fontSize:14}}>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet"/>

    {/* Header */}
    <div style={{background:"#070b14",borderBottom:`1px solid ${C.border}`,padding:"14px 24px",display:"flex",alignItems:"center",gap:16}}>
      <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#0ea5e9,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📡</div>
      <div>
        <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:18}}>QV Antenna Alignment Dashboard</div>
        <div style={{color:C.muted,fontSize:11}}>SENER Calculator · Laser Tracker · CSAT Assembly — BB8 / BB9 / BB10</div>
      </div>
      <div style={{flex:1}}/>
      <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,color:C.muted}}>
        <span>Calibrated</span>
        <div onClick={()=>setCalMode(c=>!c)} style={{width:38,height:20,borderRadius:10,background:calMode?C.accent:C.border,position:"relative",cursor:"pointer",transition:"background .2s"}}>
          <div style={{position:"absolute",top:2,left:calMode?18:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
        </div>
      </label>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"240px 1fr",height:"calc(100vh - 65px)"}}>
      {/* Sidebar */}
      <div style={{background:"#0d1424",borderRight:`1px solid ${C.border}`,padding:14,overflowY:"auto",display:"flex",flexDirection:"column",gap:12}}>
        <div>
          <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Satellite</div>
          {sats.map(s=><div key={s} onClick={()=>{setSelSat(s);setSelPhase("Flotron 90° Alignment");}}
            style={{padding:"7px 12px",borderRadius:8,cursor:"pointer",marginBottom:3,fontWeight:selSat===s?600:400,fontSize:13,background:selSat===s?"#0ea5e915":"transparent",border:`1px solid ${selSat===s?C.accent:"transparent"}`,color:selSat===s?C.accent:C.text}}>
            {satLabel(s)}
          </div>)}
        </div>

        <div>
          <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>QV Antenna</div>
          <div style={{display:"flex",gap:5}}>
            {["QV1","QV2","QV3"].map(qv=><button key={qv} onClick={()=>setSelQV(qv)}
              style={{flex:1,padding:"7px 0",borderRadius:8,cursor:"pointer",fontWeight:selQV===qv?700:400,fontSize:12,background:selQV===qv?C[qv]+"22":C.surface,color:selQV===qv?C[qv]:C.muted,border:`1px solid ${selQV===qv?C[qv]:C.border}`}}>
              {qv}
            </button>)}
          </div>
        </div>

        <div>
          <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Phase</div>
          {phases.map(ph=><div key={ph} onClick={()=>setSelPhase(ph)}
            style={{padding:"6px 10px",borderRadius:6,cursor:"pointer",marginBottom:3,fontSize:11,background:selPhase===ph?"#0ea5e912":"transparent",borderLeft:`3px solid ${selPhase===ph?C.accent:"transparent"}`,color:selPhase===ph?C.text:C.muted}}>
            {PHASE_SHORT[ph]||ph}
          </div>)}
        </div>

        <div>
          <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Upload Measurement</div>
          <UploadPanel onUpload={handleUpload}/>
        </div>

        {log.length>0&&<div style={{maxHeight:90,overflowY:"auto"}}>
          {log.slice(-5).map((l,i)=><div key={i} style={{fontSize:10,color:l.status==="ok"?C.good:C.danger,marginBottom:3,fontFamily:"monospace"}}>
            {l.status==="ok"?"✓":"✗"} {l.msg}
          </div>)}
        </div>}
      </div>

      {/* Main content */}
      <div style={{overflowY:"auto",padding:20}}>
        <div style={{marginBottom:14,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:20,fontWeight:700}}>
            {satLabel(selSat)} · <span style={{color:C[selQV]}}>{selQV}</span>
          </div>
          <div style={{fontSize:12,color:C.muted,background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:"3px 12px"}}>{PHASE_SHORT[selPhase]||selPhase}</div>
          <div style={{fontSize:11,color:calMode?C.good:C.warn,background:(calMode?C.good:C.warn)+"15",border:`1px solid ${calMode?C.good:C.warn}`,borderRadius:20,padding:"3px 10px"}}>{calMode?"Calibrated":"No Calibration"}</div>
        </div>

        <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:20}}>
          {tabBtn("overview","Overview")}
          {tabBtn("trends","Trends")}
          {tabBtn("compare","Compare")}
          {tabBtn("positions","Position History")}
          {tabBtn("alignment","Alignment Tool")}
        </div>

        {/* OVERVIEW */}
        {tab==="overview"&&<div>
          <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:20}}>
            <MetricCard label="Gain Tx Band" value={phaseData["Gain Tx band (dBi)"]?.[calKey]??null} unit="dBi" nominal={44} higherIsBetter={true}/>
            <MetricCard label="Gain Rx Band" value={phaseData["Gain Rx band (dBi)"]?.[calKey]??null} unit="dBi" nominal={45} higherIsBetter={true}/>
            <MetricCard label="AR" value={phaseData["AR (dB)"]?.[calKey]??null} unit="dB" nominal={1} higherIsBetter={false}/>
            <MetricCard label="SLL" value={phaseData["SLL (dB)"]?.[calKey]??null} unit="dB" nominal={19} higherIsBetter={false}/>
          </div>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:600,marginBottom:4,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>RF Performance Radar — QV1 vs QV2 vs QV3 at {PHASE_SHORT[selPhase]||selPhase}</div>
            <div style={{fontSize:11,color:C.muted,marginBottom:12}}>Values as % of nominal (Gain Tx:44, Gain Rx:45, AR:1, SLL:19 dB). Closer to 100% = closer to nominal.</div>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={C.border}/><PolarAngleAxis dataKey="metric" tick={{fill:C.muted,fontSize:12}}/>
                <PolarRadiusAxis angle={30} domain={[96,102]} tick={{fill:C.muted,fontSize:9}} tickCount={4} tickFormatter={v=>`${v}%`}/>
                {["QV1","QV2","QV3"].map(qv=><Radar key={qv} name={qv} dataKey={qv} stroke={C[qv]} fill={C[qv]} fillOpacity={0.12} strokeWidth={2} connectNulls/>)}
                <Legend wrapperStyle={{color:C.muted,fontSize:12}}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:12,fontWeight:600,marginBottom:12,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>SMR Deviations from Nominal</div>
            <DevTable devs={phaseData.deviations}/>
          </div>
        </div>}

        {/* TRENDS */}
        {tab==="trends"&&<div>
          {[{key:"Gain Tx",label:"Gain Tx Band (dBi)",nom:44,col:C.QV1},{key:"Gain Rx",label:"Gain Rx Band (dBi)",nom:45,col:C.QV2},{key:"AR",label:"AR (dB)",nom:1,col:C.QV3},{key:"SLL",label:"SLL (dB)",nom:19,col:C.info}].map(({key,label,nom,col})=>(
            <div key={key} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:600,marginBottom:14,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label} — {selQV}</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{left:10,right:10}}>
                  <CartesianGrid stroke={C.border} strokeDasharray="4 4"/>
                  <XAxis dataKey="phase" tick={{fill:C.muted,fontSize:10}}/>
                  <YAxis tick={{fill:C.muted,fontSize:10}} tickFormatter={v=>v.toFixed(2)} domain={["auto","auto"]}/>
                  <Tooltip content={<CT/>}/>
                  <ReferenceLine y={nom} stroke={C.warn} strokeDasharray="5 3" label={{value:`Nom:${nom}`,fill:C.warn,fontSize:10,position:"right"}}/>
                  <Line type="monotone" dataKey={key} stroke={col} strokeWidth={2} dot={{fill:col,r:4}} name={label} connectNulls/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>}

        {/* COMPARE */}
        {tab==="compare"&&<div>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:600,marginBottom:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>QV1 vs QV2 vs QV3 at {PHASE_SHORT[selPhase]||selPhase}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:14}}>
              {phases.map(p=><Tok key={p} active={selPhase===p} onClick={()=>setSelPhase(p)}>{PHASE_SHORT[p]||p}</Tok>)}
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={["QV1","QV2","QV3"].map(qv=>{const d=allData[selSat]?.[qv]?.[selPhase];return{qv,"Gain Tx":d?.["Gain Tx band (dBi)"]?.[calKey],"Gain Rx":d?.["Gain Rx band (dBi)"]?.[calKey],"SLL":d?.["SLL (dB)"]?.[calKey]};})}>
                <CartesianGrid stroke={C.border} strokeDasharray="4 4"/>
                <XAxis dataKey="qv" tick={{fill:C.muted,fontSize:12}}/>
                <YAxis tick={{fill:C.muted,fontSize:10}} domain={[0,"auto"]}/>
                <Tooltip content={<CT/>}/><Legend wrapperStyle={{color:C.muted,fontSize:11}}/>
                <Bar dataKey="Gain Tx" fill={C.QV1} name="Gain Tx (dBi)" radius={[4,4,0,0]}/>
                <Bar dataKey="Gain Rx" fill={C.QV2} name="Gain Rx (dBi)" radius={[4,4,0,0]}/>
                <Bar dataKey="SLL" fill={C.info} name="SLL (dB)" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            {["QV1","QV2","QV3"].map(qv=>{const d=allData[selSat]?.[qv]?.[selPhase];return(
              <div key={qv} style={{background:C.surface,border:`1px solid ${C[qv]}44`,borderRadius:12,padding:16}}>
                <div style={{fontSize:16,fontWeight:700,color:C[qv],marginBottom:12,fontFamily:"'Space Grotesk',sans-serif"}}>{qv}</div>
                {[["Gain Tx",d?.["Gain Tx band (dBi)"]?.[calKey],"dBi",44,true],["Gain Rx",d?.["Gain Rx band (dBi)"]?.[calKey],"dBi",45,true],["AR",d?.["AR (dB)"]?.[calKey],"dB",1,false],["SLL",d?.["SLL (dB)"]?.[calKey],"dB",19,false]].map(([lbl,val,unit,nom,hib])=>{
                  const diff=val!=null?val-nom:null; const ok=diff!=null?(hib?diff>=-0.2:diff<=0.05):null; const med=diff!=null?(hib?diff>=-0.5:diff<=0.15):null;
                  const col=val==null?C.muted:ok?C.good:med?C.warn:C.danger;
                  return <div key={lbl} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span style={{fontSize:11,color:C.muted}}>{lbl}</span>
                    <span style={{fontFamily:"monospace",fontSize:13,fontWeight:600,color:col}}>{val!=null?val.toFixed(3):"—"} <span style={{fontSize:10,color:C.muted}}>{unit}</span></span>
                  </div>;
                })}
              </div>);})}
          </div>
        </div>}

        {/* POSITION HISTORY */}
        {tab==="positions"&&<PositionHistoryTab satData={satInfo} selectedQV={selQV} allPhases={phases} selectedPhase={selPhase} setSelectedPhase={setSelPhase} calMode={calMode}/>}

        {/* ALIGNMENT TOOL */}
        {tab==="alignment"&&<AlignmentPanel/>}
      </div>
    </div>
  </div>;
}
