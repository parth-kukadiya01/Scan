"use client";

import React from "react";
import { Zap, Sparkles, Sliders, Settings, ScanLine, Check } from "lucide-react";

export default function EngineSelectorBar({
  selectedEngine,
  onSelectEngine,
  autoDewarp,
  onToggleDewarp,
  onOpenSettings,
  geminiAvailable
}) {
  const engines = [
    {
      id: "apple_vision",
      name: "Apple Vision ML",
      badge: "Neural Engine",
      icon: Zap,
      accent: "#818cf8",
      desc: "Instant macOS Neural OCR + Metal GPU Dewarp"
    },
    {
      id: "gemini",
      name: "Google Gemini AI",
      badge: geminiAvailable ? "Configured" : "Key Needed",
      icon: Sparkles,
      accent: "#34d399",
      desc: "Multimodal Generative Vision LLM"
    },
    {
      id: "tesseract",
      name: "Tesseract OCR",
      badge: "Legacy",
      icon: Sliders,
      accent: "#94a3b8",
      desc: "Standard Open-Source OCR Engine"
    }
  ];

  return (
    <div className="glass-panel" style={{
      padding: "12px 16px",
      marginBottom: 20,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12
    }}>
      {/* Left: Engine pills */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        width: "100%",
        maxWidth: "100%"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            ML Engine:
          </span>

          {/* Quick Dewarp & Settings row on small devices */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              userSelect: "none",
              fontSize: 11,
              fontWeight: 600,
              color: autoDewarp ? "#34d399" : "var(--text-muted)",
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
              background: autoDewarp ? "rgba(16, 185, 129, 0.08)" : "transparent",
              border: `1px solid ${autoDewarp ? "rgba(16, 185, 129, 0.3)" : "var(--border-subtle)"}`,
              transition: "all 0.2s ease"
            }}>
              <ScanLine size={13} color={autoDewarp ? "#34d399" : "currentColor"} />
              <span className="hide-on-small-mobile">Auto-</span>Dewarp
              <input
                type="checkbox"
                checked={autoDewarp}
                onChange={(e) => onToggleDewarp(e.target.checked)}
                style={{ marginLeft: 2, cursor: "pointer", accentColor: "#10b981" }}
              />
            </label>

            <button
              onClick={onOpenSettings}
              className="btn btn-secondary btn-sm"
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", minHeight: 30, fontSize: 11 }}
              title="Engine & API Key Settings"
            >
              <Settings size={13} />
              <span className="hide-on-small-mobile">Settings</span>
            </button>
          </div>
        </div>

        {/* Engine selector pills list */}
        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            background: "rgba(255, 255, 255, 0.04)",
            padding: 3,
            borderRadius: "var(--radius-md)",
            gap: 4,
            width: "100%",
            overflowX: "auto"
          }}
        >
          {engines.map((eng) => {
            const Icon = eng.icon;
            const isSelected = selectedEngine === eng.id;
            return (
              <button
                key={eng.id}
                onClick={() => onSelectEngine(eng.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "6px 10px",
                  borderRadius: "var(--radius-sm)",
                  background: isSelected ? "rgba(99, 102, 241, 0.25)" : "transparent",
                  border: isSelected ? "1px solid rgba(99, 102, 241, 0.5)" : "1px solid transparent",
                  color: isSelected ? "#ffffff" : "var(--text-muted)",
                  fontSize: 12,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  flex: "1 1 auto",
                  whiteSpace: "nowrap",
                  minHeight: 34
                }}
                title={eng.desc}
              >
                <Icon size={14} color={isSelected ? eng.accent : "currentColor"} />
                <span>{eng.name}</span>
                <span
                  className="hide-on-small-mobile"
                  style={{
                    fontSize: 9,
                    padding: "1px 5px",
                    borderRadius: 4,
                    background: isSelected ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.05)",
                    color: isSelected ? "#ffffff" : "var(--text-dim)"
                  }}
                >
                  {eng.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
