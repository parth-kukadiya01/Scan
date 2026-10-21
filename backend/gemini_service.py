import base64
import json
import os
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

def get_active_gemini_key() -> Optional[str]:
    """Retrieves the Gemini API key from environment or local config."""
    key = os.getenv("GEMINI_API_KEY")
    if key and key.strip():
        return key.strip()
    
    config_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "config.json")
    if os.path.exists(config_file):
        try:
            with open(config_file, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                return cfg.get("gemini_api_key", "").strip() or None
        except Exception:
            pass
    return None

def set_gemini_key(api_key: str) -> None:
    """Saves the Gemini API key to local config."""
    config_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "config.json")
    os.makedirs(os.path.dirname(config_file), exist_ok=True)
    cfg = {}
    if os.path.exists(config_file):
        try:
            with open(config_file, "r", encoding="utf-8") as f:
                cfg = json.load(f)
        except Exception:
            pass
    cfg["gemini_api_key"] = api_key.strip()
    with open(config_file, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)

def extract_card_with_gemini(image_bytes: bytes, api_key: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Extracts structured business card data using Google Gemini Multimodal Vision API.
    Returns parsed dictionary or None if Gemini call fails.
    """
    key = api_key or get_active_gemini_key()
    if not key:
        return None

    b64_image = base64.b64encode(image_bytes).decode("utf-8")

    prompt = (
        "You are an expert AI business card scanner. "
        "Analyze this business card image and extract all contact fields into valid JSON. "
        "Strictly adhere to this exact JSON schema:\n"
        "{\n"
        '  "name": "Full Person Name including credentials/honorifics if present (e.g. Dr. John Doe, MD)",\n'
        '  "title": "Exact job title, role, or designation",\n'
        '  "company": "Company, organization, clinic, or studio name",\n'
        '  "phone": "Phone number(s) comma-separated, formatted with country code if available",\n'
        '  "email": "Email address(es) comma-separated",\n'
        '  "website": "Clean website URL(s)",\n'
        '  "address": "Full physical office address (street, suite, city, state, postal code)",\n'
        '  "other_details": "Tagline, services, social media links (LinkedIn/Twitter), certifications, or notes",\n'
        '  "raw_text": "Complete unaltered verbatim text appearing on the card"\n'
        "}\n"
        "Return ONLY the raw JSON object."
    )

    models_to_try = [DEFAULT_GEMINI_MODEL, "gemini-1.5-flash", "gemini-1.5-pro"]

    for model in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": "image/png",
                            "data": b64_image
                        }
                    }
                ]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "response_mime_type": "application/json"
            }
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                candidates = data.get("candidates", [])
                if candidates:
                    content_parts = candidates[0].get("content", {}).get("parts", [])
                    if content_parts:
                        text_resp = content_parts[0].get("text", "").strip()
                        # Clean markdown json fences if any
                        if text_resp.startswith("```json"):
                            text_resp = text_resp[7:]
                        if text_resp.endswith("```"):
                            text_resp = text_resp[:-3]
                        parsed_json = json.loads(text_resp.strip())
                        return {
                            "name": parsed_json.get("name", "").strip(),
                            "title": parsed_json.get("title", "").strip(),
                            "company": parsed_json.get("company", "").strip(),
                            "phone": parsed_json.get("phone", "").strip(),
                            "email": parsed_json.get("email", "").strip(),
                            "website": parsed_json.get("website", "").strip(),
                            "address": parsed_json.get("address", "").strip(),
                            "other_details": parsed_json.get("other_details", "").strip(),
                            "raw_text": parsed_json.get("raw_text", "").strip(),
                            "confidence": 99,
                            "engine": f"gemini_ai ({model})"
                        }
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            print(f"[Gemini API HTTPError {e.code}]: {err_body}")
            continue
        except Exception as e:
            print(f"[Gemini API Exception]: {str(e)}")
            continue

    return None
