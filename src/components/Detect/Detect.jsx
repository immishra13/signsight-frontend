import React, { useState, useRef, useEffect, useCallback } from "react";
import "./Detect.css";
import { v4 as uuidv4 } from "uuid";
import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { HAND_CONNECTIONS } from "@mediapipe/hands";
import Webcam from "react-webcam";
import { SignImageData } from "../../data/SignImageData";
import { useDispatch, useSelector } from "react-redux";
import { addSignData } from "../../redux/actions/signdataaction";
import ProgressBar from "./ProgressBar/ProgressBar";
import DisplayImg from "../../assests/displayGif.gif";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

let startTime = "";

const Detect = () => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [gestureOutput, setGestureOutput] = useState("");
  const [gestureRecognizer, setGestureRecognizer] = useState(null);
  const [runningMode, setRunningMode] = useState("IMAGE");
  const [progress, setProgress] = useState(0);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState(null);

  const requestRef = useRef();
  const [detectedData, setDetectedData] = useState([]);

  const user = useSelector((state) => state.auth?.user);
  const { accessToken } = useSelector((state) => state.auth);

  const dispatch = useDispatch();
  const [currentImage, setCurrentImage] = useState(null);

  useEffect(() => {
    let intervalId;
    if (webcamRunning) {
      intervalId = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * SignImageData.length);
        const randomImage = SignImageData[randomIndex];
        setCurrentImage(randomImage);
      }, 5000);
    }
    return () => clearInterval(intervalId);
  }, [webcamRunning]);

  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-console
    console.log = function () {};
  }

  const predictWebcam = useCallback(() => {
    if (runningMode === "IMAGE") {
      setRunningMode("VIDEO");
      gestureRecognizer.setOptions({ runningMode: "VIDEO" });
    }

    const nowInMs = Date.now();
    const results = gestureRecognizer.recognizeForVideo(
      webcamRef.current.video,
      nowInMs
    );

    const canvasCtx = canvasRef.current.getContext("2d");
    canvasCtx.save();
    canvasCtx.clearRect(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;

    webcamRef.current.video.width = videoWidth;
    webcamRef.current.video.height = videoHeight;

    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    if (results.landmarks) {
      for (const landmarks of results.landmarks) {
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 5,
        });
        drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 2 });
      }
    }

    if (results.gestures.length > 0) {
      const label = results.gestures[0][0].categoryName;
      const scorePct = Math.round(parseFloat(results.gestures[0][0].score) * 100);

      setDetectedData((prevData) => [
        ...prevData,
        {
          SignDetected: label,
          DetectedScore: scorePct,
        },
      ]);

      setGestureOutput(label);
      setProgress(scorePct);
    } else {
      setGestureOutput("");
      setProgress("");
    }

    if (webcamRunning === true) {
      requestRef.current = requestAnimationFrame(predictWebcam);
    }
  }, [webcamRunning, runningMode, gestureRecognizer]);

  const animate = useCallback(() => {
    requestRef.current = requestAnimationFrame(animate);
    predictWebcam();
  }, [predictWebcam]);

  const enableCam = useCallback(async () => {
    if (!gestureRecognizer) {
      alert("Please wait for gestureRecognizer to load");
      return;
    }

    if (webcamRunning === true) {
      // STOP
      setWebcamRunning(false);
      cancelAnimationFrame(requestRef.current);
      setCurrentImage(null);

      const endTime = new Date();
      const timeElapsed = (
        (endTime.getTime() - startTime.getTime()) /
        1000
      ).toFixed(2);

      const nonEmptyData = detectedData.filter((d) => d?.SignDetected);

      const resultArray = [];
      let current = nonEmptyData[0];
      for (let i = 1; i < nonEmptyData.length; i++) {
        if (nonEmptyData[i].SignDetected !== current.SignDetected) {
          resultArray.push(current);
          current = nonEmptyData[i];
        }
      }
      if (current) resultArray.push(current);

      const countMap = new Map();
      for (const item of resultArray) {
        const count = countMap.get(item.SignDetected) || 0;
        countMap.set(item.SignDetected, count + 1);
      }

      const sortedArray = Array.from(countMap.entries()).sort(
        (a, b) => b[1] - a[1]
      );

      const outputArray = sortedArray
        .slice(0, 5)
        .map(([sign, count]) => ({ SignDetected: sign, count }));

      const data = {
        signsPerformed: outputArray,
        id: uuidv4(),
        username: user?.name,
        userId: user?.userId,
        createdAt: String(endTime),
        secondsSpent: Number(timeElapsed),
      };

      try {
        await dispatch(addSignData(data));
        toast.success("✅ Session saved to Firebase");
      } catch (err) {
        console.error(err);
        toast.error(`❌ Failed to save: ${err?.message || "Unknown error"}`);
      } finally {
        setDetectedData([]);
      }
    } else {
      // START
      setWebcamRunning(true);
      startTime = new Date();
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [webcamRunning, gestureRecognizer, animate, detectedData, user?.name, user?.userId, dispatch]);

  useEffect(() => {
    let cancelled = false;

    async function loadGestureRecognizer() {
      try {
        setModelLoading(true);
        setModelError(null);

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const MODEL_URL = `${process.env.PUBLIC_URL}/models/gesture_recognizer.task?v=1`;

        let recognizer;
        try {
          recognizer = await GestureRecognizer.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_URL },
            numHands: 2,
            runningMode,
          });
        } catch (e) {
          const res = await fetch(MODEL_URL);
          if (!res.ok) throw new Error("Model not found at " + MODEL_URL);
          const buf = new Uint8Array(await res.arrayBuffer());
          recognizer = await GestureRecognizer.createFromOptions(vision, {
            baseOptions: { modelAssetBuffer: buf },
            numHands: 2,
            runningMode,
          });
        }

        if (!cancelled) {
          setGestureRecognizer(recognizer);
          setModelLoading(false);
        }
      } catch (err) {
        console.error("GestureRecognizer load failed:", err);
        if (!cancelled) {
          setModelError(err.message);
          setModelLoading(false);
        }
      }
    }

    loadGestureRecognizer();
    return () => {
      cancelled = true;
    };
  }, [runningMode]);

  const practiceRef = useRef(null);
  const libraryRef = useRef(null);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <div className="signlang_detection-container" ref={practiceRef}>
        {accessToken ? (
          <>
            {/* Model Loading Status */}
            <div className="status-container">
              {modelLoading && (
                <div className="model-status loading">
                  <span>🔄</span> Loading gesture recognition model...
                </div>
              )}

              {modelError && (
                <div className="model-status error">
                  <span>❌</span> Error loading model: {modelError}
                </div>
              )}

              {!modelLoading && !modelError && gestureRecognizer && (
                <div className="model-status success">
                  <span>✅</span> Model ready!
                </div>
              )}
            </div>

            <div className="detection-main-grid">
              <div className="camera-wrapper">
                <Webcam audio={false} ref={webcamRef} className="signlang_webcam" />
                <canvas ref={canvasRef} className="signlang_canvas" />

                <div className="signlang_data-container">
                  <button
                    onClick={enableCam}
                    disabled={modelLoading || modelError}
                    className={modelLoading ? "loading" : ""}
                  >
                    {modelLoading
                      ? "Loading..."
                      : webcamRunning
                      ? "Stop Practice"
                      : "Start Practice"}
                  </button>

                  <div className="signlang_data">
                    <p className="gesture_output">{gestureOutput || "Waiting..."}</p>
                    {progress ? <ProgressBar progress={progress} /> : null}
                  </div>
                </div>
              </div>

              <div className="signlang_imagelist-container">
                <h2 className="gradient__text">Practice Guide</h2>
                <div className="signlang_image-div">
                  {currentImage ? (
                    <img src={currentImage.url} alt={`img ${currentImage.id}`} />
                  ) : (
                    <div style={{textAlign: "center"}}>
                      <h3 className="gradient__text">Ready to start?</h3>
                      <p style={{color: "var(--color-subtext)", fontSize: "0.9rem"}}>Click Start above to begin practicing with images.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="signlang_detection_notLoggedIn">
            <div className="glass-card auth-card">
              <h1 className="gradient__text">Please Login !</h1>
              <img src={DisplayImg} alt="display-img" />
              <p>
                We save your detection data to track your progress and learning in the 
                dashboard. Please login to access the full detection features.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ======== LEARNING ZONE (added below the page) ======== */}
      <section className="learn-wrapper">
        {/* Row 1: Quick Learning Cards */}
        <div className="learn-grid">
          <article className="lcard">
            <div className="lcard-icon">🤟</div>
            <h3>Sign AI – Quick Practice</h3>
            <p>Practice core alphabets and common words with confidence meter. Works best in good light with clear hands-in-frame.</p>
            <ul>
              <li>Keep hands within camera box</li>
              <li>Solid background improves accuracy</li>
              <li>Hold gesture for 1–2 seconds</li>
            </ul>
            <div className="lcard-cta">
              <button type="button" onClick={() => scrollToSection(practiceRef)}>Open Guide</button>
            </div>
          </article>

          <article className="lcard">
            <div className="lcard-icon">🗣️</div>
            <h3>Lang AI – Sentence Builder</h3>
            <p>Detected signs form words & sentences. Punctuation like <code>comma</code> or <code>period</code> is supported.</p>
            <ul>
              <li>Spell letters to auto-commit a word</li>
              <li>Say <code>space</code> to separate words</li>
              <li>Use <code>del</code> to delete last char</li>
            </ul>
            <div className="lcard-cta">
              <button type="button" onClick={() => scrollToSection(libraryRef)}>See Examples</button>
            </div>
          </article>

          <article className="lcard">
            <div className="lcard-icon">🧠</div>
            <h3>Object AI – Context Hints</h3>
            <p>Combine object cues (bottle, book, phone) with hand signs to boost intent understanding and accuracy.</p>
            <ul>
              <li>Context-aware suggestions</li>
              <li>Fewer spelling mistakes</li>
              <li>Instant phrase shortcuts</li>
            </ul>
            <div className="lcard-cta">
              <button type="button" onClick={() => navigate("/objectdetection")}>Explore Object AI</button>
            </div>
          </article>
        </div>

        {/* Row 2: Library preview from your SignImageData */}
        <div className="library-block" ref={libraryRef}>
          <div className="library-head">
            <h3>Practice Library</h3>
            <p>Quick preview of signs from your dataset. Click Start above to get a new image every 5s.</p>
          </div>
          <div className="library-grid">
            {(SignImageData || []).slice(0, 12).map((item) => (
              <figure key={item.id} className="lib-card">
                <img src={item.url} alt={item.name || `sign-${item.id}`} />
                <figcaption>{item.name || `Sign ${item.id}`}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* Row 3: How it works */}
        <div className="howitworks">
          <h3>How Detection Works</h3>
          <ol className="hiw-steps">
            <li>
              <span>1</span>
              <div>
                <strong>Hand Landmarks</strong>
                <p>MediaPipe finds 21 key points per hand and draws skeleton for stability.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Gesture Scores</strong>
                <p>Each frame gets a label + confidence. Your progress bar shows the top score.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Sentence Logic</strong>
                <p>Stable frames &gt; threshold → commit; letters auto-commit into words after idle.</p>
              </div>
            </li>
          </ol>
        </div>

        {/* Row 4: FAQ (details/summary = no JS) */}
        <div className="faq">
          <h3>FAQs</h3>
          <details>
            <summary>Webcam dark dikh raha hai — kya karun?</summary>
            <p>Room light increase karein, camera angle adjust karein. (Optional CSS: <code>.signlang_webcam &#123; filter: brightness(1.2) contrast(1.05); &#125;</code>)</p>
          </details>
          <details>
            <summary>Detection ko accurate kaise banaye?</summary>
            <p>Plain background, hands center me, stable hold 1–2s. Finger occlusion avoid karein.</p>
          </details>
          <details>
            <summary>Session save kahan hota hai?</summary>
            <p>Stop press karte hi top 5 repeated signs Firebase me save hote hain (toast success दिखाई देगा).</p>
          </details>
        </div>
      </section>
      {/* ======== /LEARNING ZONE ======== */}
    </>
  );
};

export default Detect;
