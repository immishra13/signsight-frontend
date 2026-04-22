import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import "./ObjectDetection.css";

const API_BASE = "https://signsight-backend.onrender.com";

export default function ObjectDetection() {
  const fileRef = useRef(null);
  const webcamRef = useRef(null);

  // 👇 default webcam tab
  const [mode, setMode] = useState("live"); // 'upload' | 'live'
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // upload result

  const [liveOn, setLiveOn] = useState(false);
  const [liveFrame, setLiveFrame] = useState(null); // base64 annotated frame
  const liveTimer = useRef(null);

  // -------- Upload flow (image/video) ----------
  const onUpload = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const f = fileRef.current?.files?.[0];
    if (!f) return setError("Please choose an image or video.");

    const form = new FormData();
    form.append("file", f);

    try {
      setUploading(true);
      const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Upload failed");
      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  // -------- Live flow ----------
  const sendFrame = async () => {
    if (!webcamRef.current || !webcamRef.current.video) return;

    // capture frame -> dataURL (jpeg)
    const dataURL = webcamRef.current.getScreenshot({ width: 640, height: 480 });
    if (!dataURL) return;

    try {
      const res = await fetch(`${API_BASE}/detect_frame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataURL }),
      });
      const data = await res.json();
      if (data.ok && data.image) setLiveFrame(data.image);
    } catch {
      /* swallow errors to keep loop going */
    }
  };

  const startLive = () => {
    setError("");
    setLiveFrame(null);
    setLiveOn(true);
    // ~5 FPS
    liveTimer.current = setInterval(sendFrame, 200);
  };

  const stopLive = () => {
    setLiveOn(false);
    if (liveTimer.current) clearInterval(liveTimer.current);
    liveTimer.current = null;
  };

  useEffect(() => {
    return () => {
      if (liveTimer.current) clearInterval(liveTimer.current);
    };
  }, []);

  return (
    <div className="obj-page">
      <div className="obj-card">
        <div className="obj-head">
          <h2 className="obj-title">Object Detection (YOLO)</h2>
          <p className="obj-sub">Upload media or stream from your webcam to detect objects in real-time.</p>
        </div>

        {/* Mode switch */}
        <div className="obj-tabs">
          <button
            className={`tab-btn ${mode === "upload" ? "is-active" : ""}`}
            onClick={() => { setMode("upload"); stopLive(); }}
          >
            Upload
          </button>
          <button
            className={`tab-btn ${mode === "live" ? "is-active" : ""}`}
            onClick={() => setMode("live")}
          >
            Live Webcam
          </button>
        </div>

        {/* Upload Mode */}
        {mode === "upload" && (
          <div className="obj-block">
            <form onSubmit={onUpload} className="obj-form">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                className="obj-input"
              />
              <button type="submit" className="obj-btn obj-btn--primary" disabled={uploading}>
                {uploading ? "Processing…" : "Detect"}
              </button>
            </form>

            {error && <div className="obj-error">❌ {error}</div>}

            {result && (
              <div className="obj-result">
                <h3>Result</h3>
                {result.type === "image" ? (
                  <img
                    alt="detected"
                    src={`${API_BASE}${result.detected_image}`}
                    className="obj-media"
                  />
                ) : (
                  <video
                    src={`${API_BASE}${result.detected_video}`}
                    controls
                    className="obj-media"
                  />
                )}

                <a
                  href={`${API_BASE}${result.download_link}`}
                  download
                  className="obj-download"
                >
                  ⬇ Download output
                </a>
              </div>
            )}
          </div>
        )}

        {/* Live Mode */}
        {mode === "live" && (
          <div className="obj-liveWrap">
            <div className="obj-liveRow">
              <div className="obj-livePane">
                <div className="pane-title">Your Webcam</div>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                  className="obj-webcam"
                />
              </div>

              <div className="obj-livePane">
                <div className="pane-title">Detected (Server)</div>
                {liveFrame ? (
                  <img alt="live-result" src={liveFrame} className="obj-webcam" />
                ) : (
                  <div className="obj-placeholder">No frame yet…</div>
                )}
              </div>
            </div>

            <div className="obj-actions">
              {!liveOn ? (
                <button onClick={startLive} className="obj-btn obj-btn--primary">▶ Start</button>
              ) : (
                <button onClick={stopLive} className="obj-btn obj-btn--danger">⏹ Stop</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= Info / Knowledge ================= */}
      <section className="obj-knowledge">
        <h3>Object Detection — A Quick Guide</h3>

        <div className="obj-sections">
          <article className="obj-section">
            <h4>What is it?</h4>
            <p>
              Object detection finds <strong>what</strong> is in an image and <strong>where</strong> it is,
              usually by outputting bounding boxes with labels and confidence scores.
            </p>
          </article>

          <article className="obj-section">
            <h4>How YOLO works (high level)</h4>
            <ol>
              <li>Split the image into a grid and predict candidate boxes per cell.</li>
              <li>Each box predicts a class label + confidence.</li>
              <li>Apply <em>Non-Max Suppression</em> to remove overlapping boxes, keeping the best ones.</li>
            </ol>
          </article>

          <article className="obj-section">
            <h4>Confidence, IoU & NMS</h4>
            <p><strong>Confidence</strong> ≈ probability the box actually contains the object. </p>
            <p><strong>IoU</strong> (Intersection over Union) compares overlap between predicted and ground truth boxes.</p>
            <p><strong>NMS</strong> removes duplicates by discarding lower-score boxes that overlap a higher-score box.</p>
          </article>

          <article className="obj-section">
            <h4>Best practices for better results</h4>
            <ul>
              <li>Use good, even lighting; avoid heavy backlight.</li>
              <li>Keep the subject large in frame; avoid extreme blur or motion.</li>
              <li>If live FPS is low, reduce resolution or send frames less frequently.</li>
            </ul>
          </article>

          <article className="obj-section">
            <h4>Latency & FPS</h4>
            <p>
              This demo sends frames to <code>{API_BASE}</code> about 5× per second (every 200ms).
              Network + server inference time decides the end-to-end latency.
            </p>
          </article>

          <article className="obj-section">
            <h4>Privacy</h4>
            <p>
              Frames are sent to your configured server for inference. Do not stream sensitive content.
              Clear uploaded media after testing.
            </p>
          </article>

          <article className="obj-section">
            <h4>Glossary</h4>
            <ul>
              <li><strong>BBox</strong>: Bounding box around the detected object.</li>
              <li><strong>Class</strong>: The predicted category (e.g., person, bottle).</li>
              <li><strong>Score</strong>: Model confidence for the box & class.</li>
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
