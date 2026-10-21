"use client";

import React, { useState } from "react";
import { Sparkles, Play, RefreshCw, UserCheck } from "lucide-react";
import { scanSampleCard } from "../utils/api";
import { sounds } from "../utils/audio";

const PRESETS = [
  {
    id: "sample-1",
    label: "Tech Executive",
    name: "Alexander Wright",
    company: "Nova Dynamics Inc.",
    badgeColor: "rgba(99, 102, 241, 0.2)"
  },
  {
    id: "sample-2",
    label: "Medical Director",
    name: "Dr. Elena Rostova, MD",
    company: "Aura Health Partners",
    badgeColor: "rgba(16, 185, 129, 0.2)"
  },
  {
    id: "sample-3",
    label: "Design Principal",
    name: "Marcus Chen",
    company: "Kroma Design Studio",
    badgeColor: "rgba(236, 72, 153, 0.2)"
  }
];

export default function SampleCardsBanner({
  onCardScanned,
  onError,
  engine = "auto",
  dewarp = true
}) {
  const [loadingId, setLoadingId] = useState(null);

  const handleTestScan = async (sampleId) => {
    setLoadingId(sampleId);
    try {
      const res = await scanSampleCard(sampleId, engine, dewarp);
      sounds.playSuccess();
      if (onCardScanned) {
        onCardScanned(res.card);
      }
    } catch (err) {
      if (onError) onError(err.message || "Failed to scan sample card");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12,
      padding: "12px 16px",
      background: "rgba(30, 41, 59, 0.4)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      marginBottom: 20
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Sparkles size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>
            Instant Demo:
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 6 }}>
            Test OCR & CSV export with 1-click sample cards
          </span>
        </div>
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        width: "100%",
        maxWidth: 500
      }}>
        {PRESETS.map((p) => {
          const isLoading = loadingId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handleTestScan(p.id)}
              disabled={loadingId !== null}
              className="btn btn-secondary btn-sm"
              style={{
                background: "rgba(15, 23, 42, 0.8)",
                borderColor: "rgba(255, 255, 255, 0.12)",
                padding: "6px 10px",
                flex: "1 1 auto",
                justifyContent: "center",
                minHeight: 34
              }}
            >
              {isLoading ? (
                <RefreshCw size={13} className="spinner" />
              ) : (
                <Play size={11} fill="currentColor" color="var(--primary)" />
              )}
              <span style={{ fontWeight: 600, fontSize: 12 }}>{p.label}</span>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>({p.name.split(" ")[0]})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
