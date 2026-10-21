"use client";

import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, Zap, CheckCircle2, AlertCircle, Scan, Sparkles, ScanLine } from "lucide-react";
import { scanCardBase64 } from "../utils/api";
import { sounds } from "../utils/audio";

export default function CameraScanner({
  onCardScanned,
  onError,
  engine = "auto",
  dewarp = true
}) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState("environment"); // back camera by default
  const [scanning, setScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [continuousMode, setContinuousMode] = useState(false);
  const [hasPermissionError, setHasPermissionError] = useState(false);
  const [lastDewarped, setLastDewarped] = useState(false);

  // Start Camera Stream
  const startCamera = async () => {
    setHasPermissionError(false);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setStream(mediaStream);
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setHasPermissionError(true);
      setCameraActive(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Toggle Camera Facing
  const toggleFacing = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  useEffect(() => {
    if (cameraActive) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Capture frame and send to ML Backend
  const captureAndScan = async () => {
    if (!videoRef.current || scanning) return;

    sounds.playShutter();
    setScanning(true);
    setLastDewarped(false);
    
    const engineLabel = engine === "gemini"
      ? "Google Gemini AI"
      : engine === "apple_vision"
      ? "Apple Vision Neural Engine"
      : "ML Pipeline";

    setStatusMessage(`Running ${engineLabel}...`);

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const base64Image = canvas.toDataURL("image/jpeg", 0.95);

      const result = await scanCardBase64(base64Image, engine, dewarp);

      sounds.playSuccess();
      const detected = Boolean(result.card?.card_detected);
      setLastDewarped(detected);

      setStatusMessage(
        detected
          ? "Card boundary detected & perspective dewarped!"
          : "Card details extracted successfully!"
      );

      if (onCardScanned) {
        onCardScanned(result.card);
      }

      setTimeout(() => {
        setScanning(false);
        setStatusMessage("");
        setLastDewarped(false);
      }, 1200);

    } catch (err) {
      console.error("Scanning failed:", err);
      setScanning(false);
      setStatusMessage("");
      if (onError) onError(err.message || "Failed to scan business card");
    }
  };

  return (
    <div className="glass-panel" style={{ padding: "16px", position: "relative", overflow: "hidden" }}>
      {/* Header controls */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
        flexWrap: "wrap",
        gap: 8
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{
            width: 34,
            height: 34,
            minWidth: 34,
            borderRadius: "var(--radius-sm)",
            background: "rgba(99, 102, 241, 0.15)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Scan size={18} color="#818cf8" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap" }}>Live Camera</h2>
              <span className="badge badge-primary" style={{ fontSize: 10, padding: "1px 6px" }}>
                {engine === "gemini" ? "🧠 Gemini" : engine === "apple_vision" ? "⚡ Neural" : "⚡ ML"}
              </span>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {dewarp ? "Auto-detects edges & dewarps" : "Align card in viewfinder"}
            </p>
          </div>
        </div>

        {/* Continuous toggle */}
        <label style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 11,
          color: "var(--text-muted)",
          cursor: "pointer",
          userSelect: "none",
          marginLeft: "auto"
        }}>
          <input
            type="checkbox"
            checked={continuousMode}
            onChange={(e) => setContinuousMode(e.target.checked)}
            style={{ cursor: "pointer", accentColor: "#6366f1" }}
          />
          <span className="hide-on-small-mobile">Continuous</span>
        </label>
      </div>

      {/* Permission error banner */}
      {hasPermissionError && (
        <div style={{
          padding: "10px 14px",
          background: "rgba(244, 63, 94, 0.15)",
          border: "1px solid rgba(244, 63, 94, 0.3)",
          borderRadius: "var(--radius-sm)",
          color: "#fda4af",
          fontSize: 12,
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>Camera denied. Enable camera permissions in your mobile browser or use File Upload.</span>
        </div>
      )}

      {/* Viewfinder Window */}
      <div style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 10",
        minHeight: 220,
        maxHeight: 380,
        background: "#030712",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        border: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {cameraActive ? (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />

            {/* Business Card Viewfinder Overlay */}
            <div style={{
              position: "absolute",
              width: "82%",
              aspectRatio: "1.75", // Standard business card ratio (3.5 / 2)
              border: `2px dashed ${lastDewarped ? "#10b981" : "rgba(255, 255, 255, 0.35)"}`,
              borderRadius: 10,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55)",
              pointerEvents: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: 10,
              transition: "border-color 0.3s ease"
            }}>
              {/* Corner brackets */}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ width: 18, height: 18, borderTop: "3px solid #6366f1", borderLeft: "3px solid #6366f1" }} />
                <span style={{ width: 18, height: 18, borderTop: "3px solid #6366f1", borderRight: "3px solid #6366f1" }} />
              </div>
              
              {/* Laser scanning beam */}
              {scanning && (
                <div style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: 3,
                  background: "linear-gradient(90deg, transparent, #06b6d4, #6366f1, transparent)",
                  boxShadow: "0 0 14px #06b6d4",
                  animation: "laserSweep 1.2s infinite ease-in-out"
                }} />
              )}

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ width: 18, height: 18, borderBottom: "3px solid #6366f1", borderLeft: "3px solid #6366f1" }} />
                <span style={{ width: 18, height: 18, borderBottom: "3px solid #6366f1", borderRight: "3px solid #6366f1" }} />
              </div>
            </div>

            {/* Scanning Status Badge */}
            {scanning && (
              <div style={{
                position: "absolute",
                bottom: 14,
                left: 14,
                right: 14,
                margin: "0 auto",
                maxWidth: 280,
                background: "rgba(15, 23, 42, 0.92)",
                backdropFilter: "blur(10px)",
                border: "1px solid var(--border-accent)",
                padding: "8px 14px",
                borderRadius: "var(--radius-full)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 12,
                fontWeight: 600,
                color: "#c7d2fe",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)"
              }}>
                <RefreshCw size={13} className="spinner" />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{statusMessage}</span>
              </div>
            )}
          </>
        ) : (
          /* Camera Off State */
          <div style={{ textAlign: "center", padding: "20px 14px" }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: "rgba(99, 102, 241, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 10px auto"
            }}>
              <Camera size={24} color="#818cf8" />
            </div>
            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Camera Scanner Ready</h4>
            <p style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 280, margin: "0 auto" }}>
              Tap Start Camera to scan cards with your device camera
            </p>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div style={{
        marginTop: 14,
        display: "flex",
        flexDirection: cameraActive ? "column" : "row",
        alignItems: "stretch",
        gap: 10
      }}>
        {cameraActive && (
          <button
            onClick={captureAndScan}
            disabled={scanning}
            className="btn btn-emerald btn-lg"
            id="snap-card-btn"
            style={{
              width: "100%",
              boxShadow: "0 4px 18px rgba(16, 185, 129, 0.4)",
              fontWeight: 700
            }}
          >
            {scanning ? (
              <>
                <RefreshCw size={18} className="spinner" />
                <span>Analyzing Card...</span>
              </>
            ) : (
              <>
                <Zap size={18} />
                <span>Snap & Append to CSV</span>
              </>
            )}
          </button>
        )}

        <div style={{ display: "flex", gap: 8, width: "100%" }}>
          {!cameraActive ? (
            <button
              onClick={startCamera}
              className="btn btn-primary"
              id="start-camera-btn"
              style={{ width: "100%", minHeight: 42 }}
            >
              <Camera size={16} />
              <span>Start Camera</span>
            </button>
          ) : (
            <>
              <button
                onClick={stopCamera}
                className="btn btn-secondary"
                style={{ flex: 1, minHeight: 38 }}
              >
                <span>Stop Camera</span>
              </button>

              <button
                onClick={toggleFacing}
                className="btn btn-secondary"
                title="Flip between front and back camera"
                style={{ flex: 1, minHeight: 38 }}
              >
                <RefreshCw size={14} />
                <span>Flip Lens</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
