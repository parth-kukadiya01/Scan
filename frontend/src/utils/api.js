const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function fetchCards() {
  const res = await fetch(`${API_BASE}/api/cards`);
  if (!res.ok) throw new Error("Failed to load cards");
  return res.json();
}

export async function fetchConfig() {
  const res = await fetch(`${API_BASE}/api/config`);
  if (!res.ok) throw new Error("Failed to load system config");
  return res.json();
}

export async function updateConfig(data) {
  const res = await fetch(`${API_BASE}/api/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update config");
  return res.json();
}

export async function scanCardFile(file, engine = "auto", dewarp = true) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("engine", engine);
  formData.append("dewarp", String(dewarp));

  const res = await fetch(`${API_BASE}/api/scan`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Scan failed" }));
    throw new Error(err.detail || "Scan failed");
  }
  return res.json();
}

export async function scanCardBase64(base64Image, engine = "auto", dewarp = true) {
  const res = await fetch(`${API_BASE}/api/scan-base64`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: base64Image,
      engine: engine,
      dewarp: dewarp
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Scan failed" }));
    throw new Error(err.detail || "Scan failed");
  }
  return res.json();
}

export async function fetchSampleCards() {
  const res = await fetch(`${API_BASE}/api/sample-cards`);
  if (!res.ok) throw new Error("Failed to load samples");
  return res.json();
}

export async function scanSampleCard(sampleId, engine = "auto", dewarp = true) {
  const res = await fetch(`${API_BASE}/api/scan-sample/${sampleId}?engine=${engine}&dewarp=${dewarp}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to scan sample");
  return res.json();
}

export async function reparseCard(cardId, engine = "auto") {
  const res = await fetch(`${API_BASE}/api/cards/${cardId}/reparse?engine=${engine}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to re-analyze card");
  return res.json();
}

export async function updateCard(cardId, data) {
  const res = await fetch(`${API_BASE}/api/cards/${cardId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update card");
  return res.json();
}

export async function deleteCard(cardId) {
  const res = await fetch(`${API_BASE}/api/cards/${cardId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete card");
  return res.json();
}

export async function clearAllCards() {
  const res = await fetch(`${API_BASE}/api/cards`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to clear cards");
  return res.json();
}

export function getCSVDownloadUrl(cardIds = null) {
  if (cardIds && cardIds.length > 0) {
    return `${API_BASE}/api/export/csv?ids=${cardIds.join(",")}`;
  }
  return `${API_BASE}/api/export/csv`;
}

export function getSingleCardCSVUrl(cardId) {
  return `${API_BASE}/api/cards/${cardId}/csv`;
}

export function getImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}
