import React, { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { HAND_CONNECTIONS } from "@mediapipe/hands";
import "./detection.css";


/* ---------------- CONFIG ---------------- */
const STABLE_FRAMES = 3;           // same label itne frames → commit
const COOLDOWN_FRAMES = 8;         // commit ke baad pause frames
const MIN_COMMIT_CONF = 50;        // strictly > 50%
const HISTORY_MAX = 10;            // recent list length
const MAX_SENTENCE_CHARS = 280;    // display trim
const AUTOCOMMIT_CHAR_IDLE = 40;   // letters idle → word commit
/* --------------------------------------- */


const SPECIAL = {
  space: " ", Space: " ", SPACE: " ", blank: " ",
  del: "<DEL>", Del: "<DEL>", DELETE: "<DEL>",
  comma: ",", period: ".", dot: ".", question: "?", exclamation: "!",
};
const isCharToken = (tok) => tok && tok.length === 1;


/* Light grammar polish (browser-safe) */
function polishGrammar(s) {
  if (!s) return s;
  s = s.replace(/\s+/g, " ").trim();
  s = s.replace(/\s+([,!.?])/g, "$1");
  s = s.replace(/([,!.?])(?!\s|$)/g, "$1 ");
  s = s
    .replace(/\bi\b/g, "I")
    .replace(/\b(?i:)i'm\b/gi, "I'm")
    .replace(/\b(?i:)i've\b/gi, "I've")
    .replace(/\b(?i:)i\'ve\b/gi, "I've")
    .replace(/\b(?i:)i'll\b/gi, "I'll");
  s = s.replace(/(^|[.!?]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  return s.trim();
}


const Detection = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);


  // model + loop
  const [recognizer, setRecognizer] = useState(null);
  const [runningMode, setRunningMode] = useState("IMAGE");
  const [modelStatus, setModelStatus] = useState("Loading model…");
  const rafRef = useRef();


  // UI live
  const [isRunning, setIsRunning] = useState(false);
  const [liveLabel, setLiveLabel] = useState("");
  const [liveConf, setLiveConf] = useState(0);
  const [history, setHistory] = useState([]); // {label, conf, ts}


  // sentence builder
  const [sentence, setSentence] = useState("");
  const prettySentence = polishGrammar(sentence);


  const stableRef = useRef(0);
  const prevLabelRef = useRef(null);
  const cooldownRef = useRef(0);
  const lastCommittedTokenRef = useRef(null);
  const lastTypeRef = useRef(null); // 'char' | 'word'
  const currentWordRef = useRef(""); // accumulating letters
  const charIdleRef = useRef(0);


  /* -------- Load MediaPipe model -------- */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const MODEL_URL = `${process.env.PUBLIC_URL}/models/gesture_recognizer.task?v=1`;


        let r;
        try {
          r = await GestureRecognizer.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_URL },
            numHands: 2,
            runningMode,
          });
        } catch (e) {
          // fallback: fetch buffer
          const res = await fetch(MODEL_URL);
          if (!res.ok) throw new Error("Model not found at " + MODEL_URL);
          const buf = new Uint8Array(await res.arrayBuffer());
          r = await GestureRecognizer.createFromOptions(vision, {
            baseOptions: { modelAssetBuffer: buf },
            numHands: 2,
            runningMode,
          });
        }
        if (!cancelled) {
          setRecognizer(r);
          setModelStatus("Ready");
        }
      } catch (err) {
        console.error(err);
        setModelStatus("Failed to load model");
        alert("Model load failed. Place gesture_recognizer.task in /public/models/");
      }
    }
    load();
    return () => { cancelled = true; };
  }, [runningMode]);


  /* -------- Prediction loop -------- */
  const predict = useCallback(() => {
    if (!recognizer || !webcamRef.current || !webcamRef.current.video) return;


    if (runningMode === "IMAGE") {
      setRunningMode("VIDEO");
      recognizer.setOptions({ runningMode: "VIDEO" });
    }


    const nowMs = Date.now();
    const video = webcamRef.current.video;
    const res = recognizer.recognizeForVideo(video, nowMs);


    // canvas sizes + draw hands
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const vw = video.videoWidth, vh = video.videoHeight;
    video.width = vw; video.height = vh;
    canvas.width = vw; canvas.height = vh;


    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (res.landmarks) {
      for (const lms of res.landmarks) {
        drawConnectors(ctx, lms, HAND_CONNECTIONS, { color: "#00ff88", lineWidth: 4 });
        drawLandmarks(ctx, lms, { color: "#ff3366", lineWidth: 3 });
      }
    }
    ctx.restore();


    // Top gesture
    let label = "", conf = 0;
    if (res.gestures && res.gestures.length > 0) {
      const g = res.gestures[0][0];
      label = String(g.categoryName || "");
      conf = Math.round(parseFloat(g.score) * 100);
    }


    // UI update
    const ts = new Date().toLocaleTimeString();
    setLiveLabel(label);
    setLiveConf(conf);
    if (label) {
      setHistory((h) => [...h, { label, conf, ts }].slice(-HISTORY_MAX));
    }


    // ---- Sentence builder (strict > 50 + debounce) ----
    if (label && conf > MIN_COMMIT_CONF) {
      if (prevLabelRef.current === label) {
        stableRef.current += 1;
      } else {
        prevLabelRef.current = label;
        stableRef.current = 1;
      }


      if (cooldownRef.current === 0 && stableRef.current >= STABLE_FRAMES) {
        const token = SPECIAL[label] ?? label;
        if (token !== lastCommittedTokenRef.current) {
          setSentence((prev) => {
            let s = prev || "";


            const flushWord = () => {
              const w = currentWordRef.current.trim();
              if (w) {
                if (s.length && !s.endsWith(" ")) s += " ";
                s += w + " ";
                currentWordRef.current = "";
                lastTypeRef.current = "word";
              }
            };


            if (token === "<DEL>") {
              if (currentWordRef.current.length > 0) {
                currentWordRef.current = currentWordRef.current.slice(0, -1);
              } else {
                s = s.slice(0, -1);
              }
              lastTypeRef.current = null;


            } else if (token === " ") {
              if (currentWordRef.current.length > 0) {
                flushWord();
              } else if (!s.endsWith(" ")) {
                s += " ";
              }
              lastTypeRef.current = null;


            } else if ([",", ".", "!", "?"].includes(token)) {
              flushWord();
              s = s.replace(/\s+$/g, "") + token + " ";
              lastTypeRef.current = null;


            } else if (!isCharToken(token)) {
              // word token (HELLO/THANKYOU)
              flushWord();
              if (s.length && !s.endsWith(" ")) s += " ";
              s += token + " ";
              lastTypeRef.current = "word";


            } else {
              // char token (A–Z)
              if (lastTypeRef.current === "word" && !s.endsWith(" ")) s += " ";
              currentWordRef.current += token;
              lastTypeRef.current = "char";
              charIdleRef.current = 0;
            }


            if (s.length > MAX_SENTENCE_CHARS) s = s.slice(-MAX_SENTENCE_CHARS);
            return s;
          });


          lastCommittedTokenRef.current = token;
          cooldownRef.current = COOLDOWN_FRAMES;
          stableRef.current = 0;
        }
      }
    }


    // auto-commit letters if idle
    if (lastTypeRef.current === "char") {
      charIdleRef.current += 1;
      if (charIdleRef.current >= AUTOCOMMIT_CHAR_IDLE) {
        setSentence((prev) => {
          let s = prev || "";
          const w = currentWordRef.current.trim();
          if (w) {
            if (s.length && !s.endsWith(" ")) s += " ";
            s += w + " ";
            currentWordRef.current = "";
            lastTypeRef.current = "word";
            if (s.length > MAX_SENTENCE_CHARS) s = s.slice(-MAX_SENTENCE_CHARS);
          }
          return s;
        });
        charIdleRef.current = 0;
      }
    }


    // cooldown tick
    if (cooldownRef.current > 0) cooldownRef.current -= 1;


    // next frame
    if (isRunning) rafRef.current = requestAnimationFrame(predict);
  }, [recognizer, runningMode, isRunning]);


  const animate = useCallback(() => {
    rafRef.current = requestAnimationFrame(animate);
    predict();
  }, [predict]);


  /* -------- Start / Stop -------- */
  const onToggle = useCallback(() => {
    if (!recognizer) return;
    if (isRunning) {
      setIsRunning(false);
      cancelAnimationFrame(rafRef.current);
      // flush remaining letters
      const w = currentWordRef.current.trim();
      if (w) {
        setSentence((prev) => {
          let s = prev || "";
          if (s.length && !s.endsWith(" ")) s += " ";
          s += w + " ";
          currentWordRef.current = "";
          return s.slice(-MAX_SENTENCE_CHARS);
        });
      }
    } else {
      // session reset
      setHistory([]);
      setSentence("");
      setLiveLabel("");
      setLiveConf(0);


      currentWordRef.current = "";
      stableRef.current = 0;
      prevLabelRef.current = null;
      cooldownRef.current = 0;
      lastCommittedTokenRef.current = null;
      lastTypeRef.current = null;
      charIdleRef.current = 0;


      setIsRunning(true);
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [recognizer, isRunning, animate]);


  /* -------- UI -------- */
  const barWidth = Math.max(0, Math.min(100, liveConf || 0));


  return (
    <div className="detect-root">
      <div className="main-container">
        
        {/* Left Side - Camera */}
        <div className="camera-section">
          <div className="camera-container">
            <Webcam audio={false} ref={webcamRef} className="detect-webcam" />
            <canvas ref={canvasRef} className="detect-canvas" />

            {/* Status pill */}
            <div className="status-pill">
              {recognizer ? (isRunning ? "Camera On" : "Camera Off") : modelStatus}
            </div>
          </div>

          {/* Button centered above sentence */}
          <div className="button-container">
            <button
              className={`main-btn ${isRunning ? "stop" : "start"}`}
              onClick={onToggle}
              disabled={!recognizer}
              title={!recognizer ? "Model loading…" : ""}
            >
              {isRunning ? "Stop" : "Start"}
            </button>
          </div>

          {/* Bottom sentence bar */}
          <div className="sentence">
            <div className="sentence-title">Sentence</div>
            <div className="sentence-text">{prettySentence || "—"}</div>
          </div>
        </div>

        {/* Right Side - Info Panels */}
        <div className="info-section">
          
          {/* Detection Results Card */}
          <div className="card">
            <div className="title">Detection Results</div>
            <div className="big">{liveLabel || "—"}</div>
            <div className="meta">
              {liveConf ? `${liveConf}% confident` : "—"}
            </div>
            <div className="meta">{new Date().toLocaleTimeString()}</div>
          </div>

          {/* Confidence Level Card */}
          <div className="card">
            <div className="title">Confidence Level</div>
            <div className="bar-bg">
              <div className="bar-fill" style={{ width: `${barWidth}%` }} />
            </div>
            <div className="bar-text">{liveConf ? `${liveConf}%` : "—"}</div>
          </div>

          {/* Recent Detections Card */}
          <div className="card">
            <div className="title">Recent Detections</div>
            <div className="list">
              {[...history].reverse().map((h, i) => (
                <div key={i} className="row">
                  <span className="label">{h.label || "—"}</span>
                  <span className="conf">{Math.round(h.conf)}%</span>
                  <span className="time">{h.ts}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};


export default Detection;
