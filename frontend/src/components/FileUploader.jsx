"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Layers } from "lucide-react";
import { scanCardFile } from "../utils/api";
import { sounds } from "../utils/audio";

export default function FileUploader({
  onCardScanned,
  onError,
  engine = "auto",
  dewarp = true
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [queueInfo, setQueueInfo] = useState({ current: 0, total: 0, currentName: "" });

  const processFileList = async (files) => {
    const validFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif|bmp|tiff)$/i.test(file.name)
    );

    if (validFiles.length === 0) {
      if (onError) onError("Please upload valid image files (PNG, JPG, WEBP, HEIC)");
      return;
    }

    setProcessing(true);
    let successCount = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setQueueInfo({
        current: i + 1,
        total: validFiles.length,
        currentName: file.name
      });

      try {
        const result = await scanCardFile(file, engine, dewarp);
        sounds.playSuccess();
        successCount++;
        if (onCardScanned) {
          onCardScanned(result.card);
        }
      } catch (err) {
        console.error(`Failed to scan ${file.name}:`, err);
        if (onError) onError(`Failed to scan ${file.name}: ${err.message}`);
      }
    }

    setProcessing(false);
    setQueueInfo({ current: 0, total: 0, currentName: "" });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileList(e.target.files);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{
            width: 34,
            height: 34,
            minWidth: 34,
            borderRadius: "var(--radius-sm)",
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Upload size={18} color="#34d399" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap" }}>Batch Upload</h2>
              <span className="badge badge-emerald" style={{ fontSize: 10, padding: "1px 6px" }}>
                Multi-Card
              </span>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Upload single or multiple card photos
            </p>
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !processing && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? "var(--primary)" : "rgba(255, 255, 255, 0.16)"}`,
          borderRadius: "var(--radius-md)",
          padding: "24px 16px",
          textAlign: "center",
          background: isDragging ? "rgba(99, 102, 241, 0.08)" : "rgba(15, 23, 42, 0.4)",
          cursor: processing ? "wait" : "pointer",
          transition: "all 0.25s ease",
          position: "relative"
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*,.heic,.heif"
          style={{ display: "none" }}
        />

        {processing ? (
          <div>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(99, 102, 241, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px auto"
            }}>
              <RefreshCw size={22} color="#818cf8" className="spinner" />
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>
              Scanning Card {queueInfo.current} of {queueInfo.total}...
            </h4>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
              {queueInfo.currentName}
            </p>
            {/* Queue progress bar */}
            <div style={{
              width: "80%",
              maxWidth: 280,
              height: 5,
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: 3,
              margin: "14px auto 0 auto",
              overflow: "hidden"
            }}>
              <div style={{
                height: "100%",
                width: `${(queueInfo.current / queueInfo.total) * 100}%`,
                background: "linear-gradient(90deg, var(--primary), var(--accent-emerald))",
                transition: "width 0.3s ease"
              }} />
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 10px auto"
            }}>
              <FileText size={22} color="var(--text-muted)" />
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Tap to browse photos or drop cards here
            </p>
            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Select 1, 5, 10, or 50 card photos — processed in batch
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
