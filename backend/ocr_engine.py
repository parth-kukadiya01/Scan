import io
import json
import os
import shutil
import subprocess
import tempfile
from typing import Tuple, Dict, Any, Optional
from PIL import Image, ImageEnhance, ImageOps
import pytesseract

from card_parser import parse_card_text

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCANNER_TOOL_BIN = os.path.join(BASE_DIR, "scanner_tool")

# Configure tesseract binary path if needed
TESSERACT_CANDIDATES = [
    "/opt/homebrew/bin/tesseract",
    "/usr/local/bin/tesseract",
    "/usr/bin/tesseract",
    shutil.which("tesseract")
]

for candidate in TESSERACT_CANDIDATES:
    if candidate and shutil.which(candidate):
        pytesseract.pytesseract.tesseract_cmd = candidate
        break

def preprocess_image_for_tesseract(img: Image.Image) -> Image.Image:
    """Preprocesses image specifically for Tesseract OCR."""
    try:
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass

    if img.mode != 'RGB':
        img = img.convert('RGB')

    min_width = 1400
    if img.width < min_width:
        ratio = min_width / float(img.width)
        new_height = int(float(img.height) * ratio)
        img = img.resize((min_width, new_height), Image.Resampling.LANCZOS)

    gray = ImageOps.grayscale(img)
    enhancer_contrast = ImageEnhance.Contrast(gray)
    contrasted = enhancer_contrast.enhance(1.8)
    enhancer_sharpness = ImageEnhance.Sharpness(contrasted)
    sharpened = enhancer_sharpness.enhance(1.5)

    return sharpened

def run_tesseract_ocr(image_bytes: bytes) -> Dict[str, Any]:
    """Runs Tesseract OCR with multi-segmentation fallbacks."""
    try:
        raw_img = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        raise ValueError(f"Invalid image data: {str(e)}")

    enhanced = preprocess_image_for_tesseract(raw_img)
    custom_config = r'--oem 3 --psm 6'

    try:
        data = pytesseract.image_to_data(enhanced, config=custom_config, output_type=pytesseract.Output.DICT)
        confidences = [int(c) for c in data.get('conf', []) if c != '-1' and int(c) >= 0]
        avg_conf = int(sum(confidences) / len(confidences)) if confidences else 75
        raw_text = pytesseract.image_to_string(enhanced, config=custom_config)
    except Exception:
        raw_text = pytesseract.image_to_string(enhanced)
        avg_conf = 70

    if len(raw_text.strip()) < 15:
        try:
            alt_text = pytesseract.image_to_string(enhanced, config=r'--oem 3 --psm 11')
            if len(alt_text.strip()) > len(raw_text.strip()):
                raw_text = alt_text
        except Exception:
            pass

    parsed = parse_card_text(raw_text.strip())
    parsed["confidence"] = avg_conf
    parsed["engine"] = "tesseract"
    parsed["card_detected"] = False
    parsed["dewarped_image_bytes"] = None
    return parsed

def run_apple_vision_scanner(image_bytes: bytes, dewarp: bool = True) -> Dict[str, Any]:
    """
    Executes native Apple Vision ML scanner tool with Metal GPU perspective dewarping
    and Neural Engine text recognition.
    """
    if not os.path.exists(SCANNER_TOOL_BIN):
        # Fallback to Tesseract if scanner_tool binary missing
        return run_tesseract_ocr(image_bytes)

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as in_file:
        in_file.write(image_bytes)
        in_path = in_file.name

    out_dewarp_path = in_path + "_dewarped.png"

    try:
        args = [SCANNER_TOOL_BIN, in_path]
        if dewarp:
            args.append(out_dewarp_path)

        proc = subprocess.run(args, capture_output=True, text=True, timeout=12)
        if proc.returncode != 0 or not proc.stdout.strip():
            # Fallback to tesseract
            return run_tesseract_ocr(image_bytes)

        output_data = json.loads(proc.stdout)
        full_text = output_data.get("full_text", "").strip()
        confidence = output_data.get("confidence", 95)
        lines = output_data.get("lines", [])
        card_detected = output_data.get("card_detected", False)

        dewarped_bytes = None
        if os.path.exists(out_dewarp_path) and card_detected:
            try:
                with open(out_dewarp_path, "rb") as df:
                    dewarped_bytes = df.read()
            except Exception:
                pass

        parsed = parse_card_text(full_text, lines_data=lines)
        parsed["confidence"] = confidence
        parsed["engine"] = "apple_vision_ml"
        parsed["card_detected"] = card_detected
        parsed["dewarped_image_bytes"] = dewarped_bytes
        return parsed

    except Exception as e:
        print(f"[Apple Vision Error]: {str(e)} -> falling back to Tesseract")
        return run_tesseract_ocr(image_bytes)
    finally:
        if os.path.exists(in_path):
            try:
                os.remove(in_path)
            except Exception:
                pass
        if os.path.exists(out_dewarp_path):
            try:
                os.remove(out_dewarp_path)
            except Exception:
                pass

def run_card_scanner(
    image_bytes: bytes,
    engine: str = "auto",
    dewarp: bool = True
) -> Dict[str, Any]:
    """
    Master Scanner & ML Pipeline:
    - engine='apple_vision': Calls Apple Vision ML (Neural Engine + Metal GPU dewarp).
    - engine='tesseract': Calls Tesseract OCR.
    - engine='auto': Uses Apple Vision ML if available, else Tesseract OCR.
    """
    # Default to Apple Vision ML if available, else Tesseract
    if engine in ["auto", "apple_vision"] and os.path.exists(SCANNER_TOOL_BIN):
        return run_apple_vision_scanner(image_bytes, dewarp=dewarp)
    else:
        return run_tesseract_ocr(image_bytes)

def run_ocr_on_image(image_bytes: bytes) -> Tuple[str, int]:
    """
    Backward-compatible wrapper for existing code.
    Returns (raw_text, confidence_score).
    """
    result = run_card_scanner(image_bytes)
    return result.get("raw_text", ""), result.get("confidence", 90)
