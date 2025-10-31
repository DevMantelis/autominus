import logging
import os
import re
from collections import Counter
from io import BytesIO
from typing import List

import fastapi
import numpy as np
import requests
from fast_alpr import ALPR
from fastapi import FastAPI, Query, Response
from PIL import Image, UnidentifiedImageError

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("alpr")


def _get_float_env(name: str, default: str) -> float:
    value = os.getenv(name, default)
    try:
        return float(value)
    except ValueError:
        logger.warning("Invalid %s value (%s); falling back to %s", name, value, default)
        return float(default)

DEFAULT_DETECTOR_MODEL = os.getenv(
    "ALPR_DETECTOR_MODEL", "yolo-v9-s-608-license-plate-end2end"
)
DEFAULT_OCR_MODEL = os.getenv(
    "ALPR_OCR_MODEL", "global-plates-mobile-vit-v2-model"
)
CONFIDENCE_THRESHOLD = _get_float_env("ALPR_CONFIDENCE_THRESHOLD", "0.85")
REQUEST_TIMEOUT_SECONDS = _get_float_env("ALPR_REQUEST_TIMEOUT_SECONDS", "5")
LICENSE_PLATE_PATTERN = re.compile(r"(?i)\b[a-z]{3}\d{3}\b")

alpr = ALPR(
    detector_model=DEFAULT_DETECTOR_MODEL,
    ocr_model=DEFAULT_OCR_MODEL,
)

app = FastAPI(title="ALPR", version="1.0.0")


@app.get("/")
def read_root():
    return {"status": "online", "service": "ALPR API"}


@app.get("/recognize_plate", status_code=fastapi.status.HTTP_200_OK)
def recognize_plate(response: Response, image_path: List[str] = Query(...)):
    plate_counts = Counter()

    for path in image_path:
        try:
            http_response = requests.get(path, timeout=REQUEST_TIMEOUT_SECONDS)
            http_response.raise_for_status()
        except requests.RequestException as exc:
            logger.warning("Failed to fetch image %s: %s", path, exc)
            continue

        try:
            with Image.open(BytesIO(http_response.content)) as img:
                img_np = np.array(img.convert("RGB"))
        except (UnidentifiedImageError, OSError) as exc:
            logger.warning("Invalid image at %s: %s", path, exc)
            continue

        try:
            alpr_results = alpr.predict(img_np)
        except Exception as exc:  # noqa: BLE001
            logger.error("ALPR prediction failure for %s: %s", path, exc)
            continue

        for result in alpr_results:
            plate = result.ocr.text.strip()
            confidence = result.ocr.confidence
            if (
                plate
                and confidence >= CONFIDENCE_THRESHOLD
                and LICENSE_PLATE_PATTERN.search(plate)
            ):
                plate_counts[plate.upper()] += 1

    if not plate_counts:
        response.status_code = fastapi.status.HTTP_404_NOT_FOUND
        return {"message": "No plates found"}

    max_count = max(plate_counts.values())
    most_common_plates = [p for p, c in plate_counts.items() if c == max_count]

    return {
        "plates": most_common_plates,
    }
