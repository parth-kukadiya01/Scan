import io
from PIL import Image, ImageDraw, ImageFont

SAMPLE_PRESETS = [
    {
        "id": "sample-1",
        "label": "Tech Executive",
        "name": "Alexander Wright",
        "title": "Chief Executive Officer",
        "company": "Nova Dynamics Inc.",
        "phone": "+1 (415) 890-2341",
        "email": "alex@novadynamics.io",
        "website": "www.novadynamics.io",
        "address": "500 Howard St, Suite 400, San Francisco, CA 94105",
        "bg_color": (15, 23, 42),
        "accent_color": (99, 102, 241),
        "text_color": (255, 255, 255),
        "sub_color": (148, 163, 184)
    },
    {
        "id": "sample-2",
        "label": "Medical Director",
        "name": "Dr. Elena Rostova, MD",
        "title": "Chief Cardiologist & Partner",
        "company": "Aura Health Partners LLC",
        "phone": "+1 (212) 555-0198",
        "email": "e.rostova@aurahealth.com",
        "website": "aurahealth.com",
        "address": "742 Park Avenue, New York, NY 10021",
        "bg_color": (255, 255, 255),
        "accent_color": (13, 148, 136),
        "text_color": (15, 23, 42),
        "sub_color": (71, 85, 105)
    },
    {
        "id": "sample-3",
        "label": "Design Principal",
        "name": "Marcus Chen",
        "title": "Principal Architect",
        "company": "Kroma Design Studio LLC",
        "phone": "+1 (312) 880-9942",
        "email": "marcus@kromadesign.com",
        "website": "www.kromadesign.com",
        "address": "1200 N Michigan Ave, Chicago, IL 60611",
        "bg_color": (24, 24, 27),
        "accent_color": (236, 72, 153),
        "text_color": (250, 250, 250),
        "sub_color": (161, 161, 170)
    }
]

def generate_sample_card_image(sample_id: str) -> bytes:
    """Renders a realistic business card image in memory and returns PNG bytes."""
    preset = next((p for p in SAMPLE_PRESETS if p["id"] == sample_id), SAMPLE_PRESETS[0])

    width, height = 1050, 600
    img = Image.new("RGB", (width, height), color=preset["bg_color"])
    draw = ImageDraw.Draw(img)

    # Accent side stripe
    draw.rectangle([0, 0, 28, height], fill=preset["accent_color"])

    # Load default or fallback font
    try:
        font_large = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 44)
        font_med = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 26)
        font_company = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 32)
        font_body = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 22)
    except Exception:
        font_large = ImageFont.load_default()
        font_med = font_large
        font_company = font_large
        font_body = font_large

    # Company name at top
    draw.rectangle([70, 60, 110, 100], fill=preset["accent_color"])
    draw.text((80, 64), preset["company"][0], fill=(255, 255, 255), font=font_med)
    draw.text((125, 65), preset["company"], fill=preset["text_color"], font=font_company)

    # Person Name
    draw.text((70, 220), preset["name"], fill=preset["text_color"], font=font_large)

    # Title
    draw.text((70, 280), preset["title"].upper(), fill=preset["accent_color"], font=font_med)

    # Horizontal rule
    draw.line([(70, 325), (980, 325)], fill=preset["sub_color"], width=2)

    # Contact Info
    draw.text((70, 370), f"Phone: {preset['phone']}", fill=preset["sub_color"], font=font_body)
    draw.text((70, 415), f"Email: {preset['email']}", fill=preset["sub_color"], font=font_body)
    draw.text((70, 460), f"Web: {preset['website']}", fill=preset["sub_color"], font=font_body)

    # Address
    draw.text((540, 370), "Office Address:", fill=preset["text_color"], font=font_body)
    parts = preset["address"].split(", ")
    draw.text((540, 415), ", ".join(parts[:2]), fill=preset["sub_color"], font=font_body)
    if len(parts) > 2:
        draw.text((540, 455), ", ".join(parts[2:]), fill=preset["sub_color"], font=font_body)

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()
