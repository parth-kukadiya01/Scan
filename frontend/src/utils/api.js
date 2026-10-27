export function getApiBase() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location.hostname) {
    // If running on localhost or phone network IP (e.g. 192.168.x.x:3001)
    return `${window.location.protocol}//${window.location.hostname}:8080`;
  }
  return "http://localhost:8080";
}

const defaultHeaders = {
  "ngrok-skip-browser-warning": "true",
};

export async function fetchCards() {
  const res = await fetch(`${getApiBase()}/api/cards`, { headers: defaultHeaders });
  if (!res.ok) throw new Error("Failed to load cards");
  return res.json();
}

export async function fetchConfig() {
  const res = await fetch(`${getApiBase()}/api/config`, { headers: defaultHeaders });
  if (!res.ok) throw new Error("Failed to load system config");
  return res.json();
}

export async function updateConfig(data) {
  const res = await fetch(`${getApiBase()}/api/config`, {
    method: "POST",
    headers: { ...defaultHeaders, "Content-Type": "application/json" },
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

  const res = await fetch(`${getApiBase()}/api/scan`, {
    method: "POST",
    headers: defaultHeaders,
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Scan failed" }));
    throw new Error(err.detail || "Scan failed");
  }
  return res.json();
}

export async function scanCardBase64(base64Image, engine = "auto", dewarp = true) {
  const res = await fetch(`${getApiBase()}/api/scan-base64`, {
    method: "POST",
    headers: { ...defaultHeaders, "Content-Type": "application/json" },
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
  const res = await fetch(`${getApiBase()}/api/sample-cards`, { headers: defaultHeaders });
  if (!res.ok) throw new Error("Failed to load samples");
  return res.json();
}

export async function scanSampleCard(sampleId, engine = "auto", dewarp = true) {
  const res = await fetch(`${getApiBase()}/api/scan-sample/${sampleId}?engine=${engine}&dewarp=${dewarp}`, {
    method: "POST",
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error("Failed to scan sample");
  return res.json();
}

export async function reparseCard(cardId, engine = "auto") {
  const res = await fetch(`${getApiBase()}/api/cards/${cardId}/reparse?engine=${engine}`, {
    method: "POST",
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error("Failed to re-analyze card");
  return res.json();
}

export async function updateCard(cardId, data) {
  const res = await fetch(`${getApiBase()}/api/cards/${cardId}`, {
    method: "PUT",
    headers: { ...defaultHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update card");
  return res.json();
}

export async function deleteCard(cardId) {
  const res = await fetch(`${getApiBase()}/api/cards/${cardId}`, {
    method: "DELETE",
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error("Failed to delete card");
  return res.json();
}

export async function clearAllCards() {
  const res = await fetch(`${getApiBase()}/api/cards`, {
    method: "DELETE",
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error("Failed to clear cards");
  return res.json();
}

export function getCSVDownloadUrl(cardIds = null) {
  if (cardIds && cardIds.length > 0) {
    return `${getApiBase()}/api/export/csv?ids=${cardIds.join(",")}`;
  }
  return `${getApiBase()}/api/export/csv`;
}

export function getSingleCardCSVUrl(cardId) {
  return `${getApiBase()}/api/cards/${cardId}/csv`;
}

export function getExcelDownloadUrl(cardIds = null) {
  if (cardIds && cardIds.length > 0) {
    return `${getApiBase()}/api/export/excel?ids=${cardIds.join(",")}`;
  }
  return `${getApiBase()}/api/export/excel`;
}

export function getSingleCardExcelUrl(cardId) {
  return `${getApiBase()}/api/cards/${cardId}/excel`;
}

export function getImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${getApiBase()}${path}`;
}
