from typing import Union, List
from fastapi import FastAPI, Query, Response
from collections import Counter
from fast_alpr import ALPR
import fastapi
import requests
from PIL import Image
from io import BytesIO
import numpy as np
import re

alpr = ALPR(
    detector_model="yolo-v9-s-608-license-plate-end2end",
    ocr_model="global-plates-mobile-vit-v2-model",
)

app = FastAPI()


@app.get("/")
def read_root():
    return {"status": "online", "service": "ALPR API"}


@app.get("/recognize_plate", status_code=fastapi.status.HTTP_200_OK)
def recognize_plate(response: Response, image_path: List[str] = Query(...)):
    plate_counts = Counter()

    for path in image_path:
        try:
            http_response = requests.get(path)
            img = Image.open(BytesIO(http_response.content))
            img_np = np.array(img)
            alpr_results = alpr.predict(img_np)
            for result in alpr_results:
                pattern = re.compile(r'(?i)\b[a-z]{3}\d{3}\b')
                plate = result.ocr.text.strip()
                confidence = result.ocr.confidence
                if plate and re.search(pattern, plate) and confidence > 0.85:
                    plate_counts[plate] += 1
        except:
            continue

    if not plate_counts:
        response.status_code = fastapi.status.HTTP_404_NOT_FOUND
        return {"message": "No plates found"}

    max_count = max(plate_counts.values())
    most_common_plates = [p for p, c in plate_counts.items() if c == max_count]

    return {
        "plates": most_common_plates,
    }
