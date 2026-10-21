"use client";

import React from "react";
import { Download, CreditCard, Sparkles, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";
import { getCSVDownloadUrl } from "../utils/api";

export default function Navbar({ cardCount = 0, onRefresh, backendStatus = "checking" }) {
  const handleDownload = () => {
    if (cardCount === 0) return;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.2 },
      colors: ['#6366f1', '#10b981', '#06b6d4', '#f59e0b']
    });
    window.location.href = getCSVDownloadUrl();
  };

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(9, 13, 22, 0.90)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        gap: 8
      }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 36,
            height: 36,
            minWidth: 36,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
          }}>
            <CreditCard size={18} color="#ffffff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h1 style={{
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(to right, #ffffff, #cbd5e1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                whiteSpace: 'nowrap'
              }}>
                CardPulse
              </h1>
              <span className="badge badge-primary hide-on-small-mobile" style={{ fontSize: 10, padding: '1px 6px' }}>
                OCR ML
              </span>
            </div>
            <p className="hide-on-mobile" style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap' }}>
              Scan cards one by one • Preserve 100% raw text • Instant CSV export
            </p>
          </div>
        </div>

        {/* Status & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Backend Status Dot */}
          <div
            title={backendStatus === 'online' ? 'FastAPI Engine Active' : backendStatus === 'checking' ? 'Connecting...' : 'Backend Offline'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              fontSize: 12
            }}
          >
            <span style={{
              width: 8,
              height: 8,
              minWidth: 8,
              borderRadius: '50%',
              backgroundColor: backendStatus === 'online' ? '#10b981' : backendStatus === 'checking' ? '#f59e0b' : '#f43f5e',
              boxShadow: backendStatus === 'online' ? '0 0 8px #10b981' : 'none'
            }} />
            <span className="hide-on-mobile" style={{ color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
              {backendStatus === 'online' ? 'Engine Active' : backendStatus === 'checking' ? 'Connecting...' : 'Offline'}
            </span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="btn btn-secondary btn-sm"
            title="Refresh card list"
            style={{ padding: '6px 9px', minHeight: 34 }}
          >
            <RefreshCw size={14} />
          </button>

          {/* Download CSV Action */}
          <button
            onClick={handleDownload}
            disabled={cardCount === 0}
            className="btn btn-emerald btn-sm"
            id="download-csv-btn"
            style={{ padding: '6px 12px', minHeight: 34 }}
            title="Download CSV"
          >
            <Download size={15} />
            <span className="hide-on-small-mobile">CSV</span>
            {cardCount > 0 && (
              <span style={{
                background: 'rgba(255, 255, 255, 0.25)',
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                fontSize: 11,
                fontWeight: 700
              }}>
                {cardCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
