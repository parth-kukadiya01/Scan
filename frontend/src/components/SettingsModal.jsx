"use client";

import React, { useState, useEffect } from "react";
import { X, Cpu, Key, Sparkles, Check, AlertCircle, RefreshCw, ShieldCheck, Zap } from "lucide-react";
import { fetchConfig, updateConfig, getApiBase } from "../utils/api";
import { Link2 } from "lucide-react";

export default function SettingsModal({ isOpen, onClose, onConfigSaved }) {
  const [backendUrl, setBackendUrl] = useState("");
  const [config, setConfig] = useState({
    apple_vision_ml_available: true,
    default_engine: "apple_vision"
  });
  const [loading, setLoading] = useState(false);
  const [savingUrl, setSavingUrl] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await fetchConfig();
      setConfig(data);
    } catch (err) {
      console.error("Failed to load config:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (typeof window !== "undefined") {
        setBackendUrl(localStorage.getItem("cardpulse_api_url") || "");
      }
      loadConfig();
    }
  }, [isOpen]);

  const handleSaveBackendUrl = (e) => {
    e.preventDefault();
    setSavingUrl(true);
    const trimmed = backendUrl.trim().replace(/\/+$/, "");
    if (trimmed) {
      localStorage.setItem("cardpulse_api_url", trimmed);
      setStatusMessage({
        type: "success",
        text: `Backend URL saved: ${trimmed}`
      });
    } else {
      localStorage.removeItem("cardpulse_api_url");
      setStatusMessage({
        type: "success",
        text: "Reset backend URL to default."
      });
    }
    loadConfig();
    if (onConfigSaved) onConfigSaved();
    setSavingUrl(false);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(3, 7, 18, 0.82)",
      backdropFilter: "blur(12px)",
      zIndex: 60,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 12
    }}>
      <div className="glass-panel" style={{
        width: "100%",
        maxWidth: 580,
        maxHeight: "94vh",
        overflowY: "auto",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.85)"
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10
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
              <Cpu size={18} color="#818cf8" />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, whiteSpace: "nowrap" }}>Scanner Engine Settings</h3>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Configure Neural Engine ML & Generative AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: "50%", width: 32, height: 32, minHeight: 32, padding: 0, flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "16px 20px" }}>
          {/* Status Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: 10,
            marginBottom: 16
          }}>
            {/* Apple Vision Engine */}
            <div style={{
              padding: 14,
              borderRadius: "var(--radius-md)",
              background: "rgba(99, 102, 241, 0.08)",
              border: "1px solid rgba(99, 102, 241, 0.25)"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>Apple Vision ML</span>
                <span className="badge badge-primary" style={{ fontSize: 10, padding: "2px 6px" }}>Active</span>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                Apple Neural Engine OCR with Metal GPU dewarping. 100% offline & zero cost.
              </p>
            </div>

            {/* Tesseract OCR Engine */}
            <div style={{
              padding: 14,
              borderRadius: "var(--radius-md)",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-subtle)"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>Tesseract OCR</span>
                <span className="badge" style={{ fontSize: 10, padding: "2px 6px" }}>Universal</span>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                Open-source fallback engine for Linux containers & Docker deployments.
              </p>
            </div>
          </div>

          {/* Status notification */}
          {statusMessage && (
            <div style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              marginBottom: 16,
              fontSize: 12,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: statusMessage.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
              color: statusMessage.type === "success" ? "#34d399" : "#fda4af",
              border: `1px solid ${statusMessage.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)"}`
            }}>
              {statusMessage.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Backend API Server URL Form (Especially for Vercel Deployments) */}
          <form onSubmit={handleSaveBackendUrl}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Link2 size={14} color="#34d399" />
                  Backend API URL (Render / ngrok / Tunnel)
                </span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Current: {getApiBase()}
                </span>
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="https://your-backend.onrender.com or https://xxxx.ngrok-free.dev"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  className="input-field"
                  style={{ fontFamily: "var(--font-mono)", fontSize: 12, flex: 1 }}
                />
                <button
                  type="submit"
                  disabled={savingUrl}
                  className="btn btn-secondary"
                  style={{ minWidth: 90 }}
                >
                  {savingUrl ? <RefreshCw size={13} className="spinner" /> : "Connect"}
                </button>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                Required when running on Vercel. Connects this browser to your live FastAPI backend.
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
