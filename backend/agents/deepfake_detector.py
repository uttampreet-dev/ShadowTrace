from __future__ import annotations

import base64
import io
import logging
from dataclasses import asdict, dataclass
from typing import Any

import requests
from PIL import Image, ImageChops, ImageEnhance, ExifTags

logger = logging.getLogger(__name__)

REQUEST_TIMEOUT = 15


@dataclass(slots=True)
class DeepfakeDetectionResult:
    manipulation_probability: float
    ela_image_base64: str
    metadata_summary: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _download_image(image_url: str) -> Image.Image:
    response = requests.get(image_url, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    return Image.open(io.BytesIO(response.content)).convert("RGB")


def _read_exif_metadata(image: Image.Image) -> dict[str, Any]:
    summary: dict[str, Any] = {}
    try:
        exif = image.getexif()
    except Exception:
        exif = None
    if not exif:
        return summary
    for key, value in exif.items():
        name = ExifTags.TAGS.get(key, str(key))
        if isinstance(value, bytes):
            try:
                value = value.decode("utf-8", errors="ignore")
            except Exception:
                value = value.hex()
        summary[name] = value
    return summary


def _compute_ela(image: Image.Image, quality: int = 90) -> tuple[Image.Image, float]:
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=quality)
    buffer.seek(0)
    compressed = Image.open(buffer).convert("RGB")
    diff = ImageChops.difference(image, compressed)
    extrema = diff.getextrema()
    max_diff = max((pair[1] for pair in extrema), default=1) or 1
    scale = 255.0 / max_diff
    ela = ImageEnhance.Brightness(diff).enhance(scale)
    return ela, float(max_diff)


def _ela_to_base64(image: Image.Image) -> str:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("ascii")


def _manipulation_probability(exif_summary: dict[str, Any], ela_max_diff: float) -> float:
    score = 0.15
    if not exif_summary:
        score += 0.2
    if "Software" in exif_summary:
        score += 0.15
    if "DateTime" not in exif_summary:
        score += 0.05
    if ela_max_diff > 25:
        score += 0.25
    elif ela_max_diff > 10:
        score += 0.15
    return round(min(0.99, score), 4)


class DeepfakeDetector:
    def analyze(self, image_url: str) -> DeepfakeDetectionResult:
        try:
            image = _download_image(image_url)
            metadata_summary = _read_exif_metadata(image)
            ela_image, ela_max_diff = _compute_ela(image)
            return DeepfakeDetectionResult(
                manipulation_probability=_manipulation_probability(metadata_summary, ela_max_diff),
                ela_image_base64=_ela_to_base64(ela_image),
                metadata_summary=metadata_summary,
            )
        except Exception as exc:
            logger.exception("Deepfake analysis failed for %s: %s", image_url, exc)
            return DeepfakeDetectionResult(
                manipulation_probability=0.0,
                ela_image_base64="",
                metadata_summary={"error": str(exc)},
            )
