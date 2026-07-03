"""
Rice Leaf Disease Classification - Flask Backend
Production-Quality AI Application
Powered by YOLOv8 Classification
"""

import os
import base64
from datetime import datetime
from pathlib import Path
from io import BytesIO

from flask import Flask, render_template, request, jsonify
from PIL import Image
from ultralytics import YOLO

# ==========================================================
# BASE DIRECTORY
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent

# ==========================================================
# INITIALIZE FLASK
# ==========================================================

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB

app.logger.setLevel("INFO")

# ==========================================================
# UPLOAD DIRECTORY
# ==========================================================

UPLOAD_FOLDER = BASE_DIR / "static" / "uploads"
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

app.config["UPLOAD_FOLDER"] = str(UPLOAD_FOLDER)

# ==========================================================
# GLOBAL VARIABLES
# ==========================================================

model = None
model_loaded = False


# ==========================================================
# LOAD MODEL
# ==========================================================

def load_model():
    """Load YOLOv8 Classification Model"""

    global model
    global model_loaded

    try:

        model_path = BASE_DIR / "best.pt"

        if not model_path.exists():
            raise FileNotFoundError(
                f"Model tidak ditemukan: {model_path}"
            )

        print(f"[INFO] Loading model dari: {model_path}")

        model = YOLO(str(model_path))

        model_loaded = True

        print("[SUCCESS] YOLOv8 berhasil dimuat")

        return True

    except Exception as e:

        print(f"[ERROR] {e}")

        model_loaded = False

        return False


# ==========================================================
# LOAD MODEL WHEN APP STARTS
# ==========================================================

load_model()


# ==========================================================
# IMAGE CLASSIFICATION
# ==========================================================

def classify_image(image_path):

    if not model_loaded or model is None:

        return {
            "success": False,
            "error": "Model AI gagal dimuat."
        }

    try:

        results = model(image_path)

        if len(results) == 0:
            return {
                "success": False,
                "error": "Tidak dapat melakukan klasifikasi."
            }

        result = results[0]

        probs = result.probs

        class_id = int(probs.top1)

        confidence = float(probs.top1conf) * 100

        class_name = result.names[class_id]

        all_probs = (probs.data.cpu().numpy() * 100).tolist()

        class_names = list(result.names.values())

        probabilities = dict(zip(class_names, all_probs))

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        return {

            "success": True,

            "disease": class_name,

            "confidence": round(confidence, 2),

            "probabilities": probabilities,

            "image": image_path.replace("\\", "/"),

            "timestamp": timestamp

        }

    except Exception as e:

        print(f"[ERROR] {e}")

        return {

            "success": False,

            "error": "Terjadi kesalahan saat klasifikasi."

        }


# ==========================================================
# SAVE FILE UPLOAD
# ==========================================================

def save_uploaded_file(file):

    try:

        if file.filename == "":
            return False, None, "Tidak ada file dipilih."

        allowed_extensions = {
            "png",
            "jpg",
            "jpeg",
            "gif",
            "webp"
        }

        extension = file.filename.rsplit(".", 1)[1].lower()

        if extension not in allowed_extensions:

            return False, None, "Format file tidak didukung."

        filename = f"upload_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{extension}"

        filepath = UPLOAD_FOLDER / filename

        file.save(filepath)

        img = Image.open(filepath)

        img.verify()

        return True, f"static/uploads/{filename}", None

    except Exception as e:

        if filepath.exists():
            filepath.unlink()

        return False, None, str(e)


# ==========================================================
# SAVE CAMERA IMAGE
# ==========================================================

def save_base64_image(image_data):

    try:

        if "," in image_data:
            image_data = image_data.split(",")[1]

        image_bytes = base64.b64decode(image_data)

        image = Image.open(BytesIO(image_bytes))

        filename = f"camera_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"

        filepath = UPLOAD_FOLDER / filename

        image.save(filepath)

        return True, f"static/uploads/{filename}", None

    except Exception as e:

        return False, None, str(e)


# ==========================================================
# ROUTES
# ==========================================================

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():

    try:

        file_path = None

        if "file" in request.files:

            success, file_path, error = save_uploaded_file(
                request.files["file"]
            )

            if not success:
                return jsonify({
                    "success": False,
                    "error": error
                }), 400

        elif request.is_json:

            data = request.get_json()

            if "image" in data:

                success, file_path, error = save_base64_image(
                    data["image"]
                )

                if not success:
                    return jsonify({
                        "success": False,
                        "error": error
                    }), 400

        if not file_path:

            return jsonify({

                "success": False,

                "error": "Silakan upload gambar."

            }), 400

        result = classify_image(file_path)

        if result["success"]:
            return jsonify(result)

        return jsonify(result), 400

    except Exception as e:

        print(e)

        return jsonify({

            "success": False,

            "error": "Internal Server Error"

        }), 500


@app.route("/health")
def health():

    return jsonify({

        "status": "ready",

        "model_loaded": model_loaded,

        "model": "YOLOv8",

        "timestamp": datetime.now().isoformat()

    })


# ==========================================================
# ERROR HANDLERS
# ==========================================================

@app.errorhandler(413)
def request_entity_too_large(error):

    return jsonify({

        "success": False,

        "error": "Ukuran file maksimal 50MB."

    }), 413


@app.errorhandler(500)
def internal_error(error):

    return jsonify({

        "success": False,

        "error": "Internal Server Error"

    }), 500


# ==========================================================
# RUN LOCAL
# ==========================================================

if __name__ == "__main__":

    port = int(os.environ.get("PORT", 5000))

    app.run(

        host="0.0.0.0",

        port=port,

        debug=False

    )