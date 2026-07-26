import os
import logging
import traceback
from typing import Any, Dict

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np


app = Flask(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
# Initialize CORS once on the Flask app (development: permissive)
CORS(app)
print("CORS ENABLED")


def load_artifacts(base_dir: str) -> Dict[str, Any]:
    # Prefer improved v3 artifacts, then v2, then base
    model_v3 = os.path.join(base_dir, "models", "crime_prediction_model_v3.pkl")
    encoders_v3 = os.path.join(base_dir, "models", "label_encoders_v3.pkl")
    model_v2 = os.path.join(base_dir, "models", "crime_prediction_model_v2.pkl")
    encoders_v2 = os.path.join(base_dir, "models", "label_encoders_v2.pkl")
    if os.path.exists(model_v3):
        model_path = model_v3
    elif os.path.exists(model_v2):
        model_path = model_v2
    else:
        model_path = os.path.join(base_dir, "models", "crime_prediction_model.pkl")

    if os.path.exists(encoders_v3):
        encoders_path = encoders_v3
    elif os.path.exists(encoders_v2):
        encoders_path = encoders_v2
    else:
        encoders_path = os.path.join(base_dir, "models", "label_encoders.pkl")
    artifacts: Dict[str, Any] = {"model": None, "encoders": None}

    try:
        if os.path.exists(model_path):
            artifacts["model"] = joblib.load(model_path)
            logging.info("Loaded model from %s", model_path)
        else:
            logging.error("Model file not found: %s", model_path)

        if os.path.exists(encoders_path):
            artifacts["encoders"] = joblib.load(encoders_path)
            logging.info("Loaded encoders from %s", encoders_path)
        else:
            logging.error("Encoders file not found: %s", encoders_path)

    except Exception:
        logging.error("Failed to load artifacts: %s", traceback.format_exc())

    return artifacts


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS = load_artifacts(BASE_DIR)


def transform_with_fallback(le, value: str) -> int:
    try:
        # If value seen during training
        if value in le.classes_:
            return int(le.transform([value])[0])
    except Exception:
        # defensive: fall through to fallback logic
        pass

    # Prefer using the explicit missing token if available
    try:
        if "__MISSING__" in le.classes_:
            return int(le.transform(["__MISSING__"])[0])
    except Exception:
        pass

    # As a last resort, return the first class index
    try:
        return int(0)
    except Exception:
        raise


def map_to_encoder_class(le, value: str) -> str:
    """Map an input string to the best matching encoder class (case-insensitive).
    Returns a class string that exists in `le.classes_`.
    If no reasonable match found, returns '__MISSING__' if present, else first class.
    """
    if le is None:
        return value

    # Normalize
    val = value.strip()
    if val == "":
        # empty -> prefer explicit missing token
        if "__MISSING__" in le.classes_:
            return "__MISSING__"
        return le.classes_[0]

    # Exact match
    try:
        if val in le.classes_:
            return val
    except Exception:
        pass

    # Case-insensitive exact match
    lower_map = {c.lower(): c for c in le.classes_}
    if val.lower() in lower_map:
        return lower_map[val.lower()]

    # Substring matching (user token within encoder class or vice-versa)
    vlow = val.lower()
    for c in le.classes_:
        clow = c.lower()
        if vlow in clow or clow in vlow:
            return c

    # As a last attempt, prefer classes that share any word token
    v_tokens = set([t for t in vlow.split() if t])
    best = None
    best_score = 0
    for c in le.classes_:
        c_tokens = set([t for t in c.lower().split() if t])
        score = len(v_tokens & c_tokens)
        if score > best_score:
            best_score = score
            best = c
    if best is not None and best_score > 0:
        return best

    # Prefer explicit missing token if available
    if "__MISSING__" in le.classes_:
        return "__MISSING__"

    # Fall back to the first known class
    return le.classes_[0]


@app.route("/", methods=["GET"])
def health_check():
    return "KSP Crime Intelligence Nexus API Running"


# Temporary CORS test endpoint (top-level)
@app.route("/cors-test", methods=["GET"])
def cors_test():
    return jsonify({"status": "ok"})


@app.route("/predict", methods=["POST"])
def predict():
    if ARTIFACTS.get("model") is None or ARTIFACTS.get("encoders") is None:
        return jsonify({"status": "error", "message": "Model or encoders not loaded on server."}), 500

    try:
        payload = request.get_json(force=True)
    except Exception:
        return jsonify({"status": "error", "message": "Invalid JSON payload."}), 400

    required_fields = ["FIR_YEAR", "FIR_MONTH", "District_Name", "CrimeHead_Name"]
    missing = [f for f in required_fields if f not in payload]
    if missing:
        return jsonify({"status": "error", "message": f"Missing fields: {', '.join(missing)}"}), 400

    try:
        fir_year = int(payload.get("FIR_YEAR"))
        fir_month = int(payload.get("FIR_MONTH"))
        district = str(payload.get("District_Name")) if payload.get("District_Name") is not None else "__MISSING__"
        crimehead = str(payload.get("CrimeHead_Name")) if payload.get("CrimeHead_Name") is not None else "__MISSING__"

        # Normalize whitespace
        district = district.strip()
        crimehead = crimehead.strip()

        encoders = ARTIFACTS["encoders"]
        # Map to best-matching encoder class (case-insensitive) before encoding
        district_mapped = map_to_encoder_class(encoders.get("District_Name"), district) if encoders.get("District_Name") is not None else district
        crimehead_mapped = map_to_encoder_class(encoders.get("CrimeHead_Name"), crimehead) if encoders.get("CrimeHead_Name") is not None else crimehead

        # Transform categorical fields with safe fallback for unseen values
        district_enc = transform_with_fallback(encoders.get("District_Name"), district_mapped) if encoders.get("District_Name") is not None else 0
        crimehead_enc = transform_with_fallback(encoders.get("CrimeHead_Name"), crimehead_mapped) if encoders.get("CrimeHead_Name") is not None else 0

        # Logging for debugging
        print("District:", district)
        print("District Mapped:", district_mapped)
        print("District Encoded:", district_enc)

        print("Crime Head:", crimehead)
        print("Crime Head Mapped:", crimehead_mapped)
        print("Crime Head Encoded:", crimehead_enc)

        # Build feature vector in the order expected by the model
        X = np.array([[fir_year, fir_month, district_enc, crimehead_enc]])

        model = ARTIFACTS["model"]
        pred_enc = model.predict(X)

        # Compute confidence if model supports predict_proba
        confidence_pct = None
        try:
            if hasattr(model, "predict_proba"):
                proba = model.predict_proba(X)
                # model.classes_ are the encoded target labels
                # find the column index matching pred_enc[0]
                col_idx = int(np.where(model.classes_ == pred_enc.astype(int)[0])[0][0])
                confidence = float(proba[0, col_idx])
                confidence_pct = round(confidence * 100, 2)
        except Exception:
            confidence_pct = None

        target_le = encoders.get("CrimeGroup_Name")
        if target_le is not None:
            try:
                pred_label = str(target_le.inverse_transform(pred_enc.astype(int))[0])
            except Exception:
                pred_label = str(pred_enc[0])
        else:
            pred_label = str(pred_enc[0])

        resp = {"predicted_crime_group": pred_label, "status": "success"}
        if confidence_pct is not None:
            resp["confidence_pct"] = confidence_pct

        return jsonify(resp), 200

    except ValueError as ve:
        logging.error("Value error in prediction: %s", ve)
        return jsonify({"status": "error", "message": "Invalid input types."}), 400
    except Exception as exc:
        logging.error("Unexpected error during prediction: %s", traceback.format_exc())
        return jsonify({"status": "error", "message": "Prediction failed."}), 500


# Add an endpoint to expose encoder lists for frontend dropdowns
@app.route("/encoders", methods=["GET"])
def encoders_list():
    enc = ARTIFACTS.get("encoders")
    if not enc:
        return jsonify({"status": "error", "message": "Encoders not loaded"}), 500

    # Prefer the loaded encoders, but if District_Name has very few classes
    # (e.g. v3 trimmed encoders), try to fall back to v2 or base encoders on disk
    ch = enc.get("CrimeHead_Name")
    dn = enc.get("District_Name")

    district_list = list(dn.classes_) if dn is not None else []

    # If district list seems too small, attempt to load alternate encoders from disk
    try:
        if len(district_list) < 10:
            base_dir = BASE_DIR
            candidates = [
                os.path.join(base_dir, "models", "label_encoders_v2.pkl"),
                os.path.join(base_dir, "models", "label_encoders.pkl"),
            ]
            for cand in candidates:
                if os.path.exists(cand):
                    try:
                        loaded = joblib.load(cand)
                        alt_dn = loaded.get("District_Name")
                        if alt_dn is not None and len(getattr(alt_dn, "classes_", [])) > len(district_list):
                            district_list = list(alt_dn.classes_)
                            # prefer crimehead from this loaded encoder if it's larger
                            alt_ch = loaded.get("CrimeHead_Name")
                            if alt_ch is not None and ch is not None and len(getattr(alt_ch, "classes_", [])) > len(getattr(ch, "classes_", [])):
                                ch = alt_ch
                            break
                    except Exception:
                        continue
    except Exception:
        pass

    # Log total district count
    total = len(district_list)
    logging.info("Total districts loaded: %d", total)
    print("Total districts loaded:", total)

    return jsonify({
        "CrimeHead_Name": list(ch.classes_) if ch is not None else [],
        "District_Name": district_list
    }), 200


if __name__ == "__main__":
    # Diagnostics + quick tests (no server startup) — prints encoder contents, mapping checks and example predictions.
    encoders = ARTIFACTS.get("encoders")
    model = ARTIFACTS.get("model")

    if encoders is None:
        print("No encoders loaded. Please ensure the encoder file exists in backend/models.")
    else:
        ch = encoders.get("CrimeHead_Name")
        dn = encoders.get("District_Name")

        if ch is not None:
            classes = list(ch.classes_)
            print("\nCrimeHead_Name classes (first 200):")
            for i, c in enumerate(classes[:200]):
                print(f"{i+1:03d}: {c}")
        else:
            print("CrimeHead_Name encoder not found.")

        if dn is not None:
            dclasses = list(dn.classes_)
            print("\nDistrict_Name classes:")
            for c in dclasses:
                print(c)
        else:
            print("District_Name encoder not found.")

        # Compare against frontend-provided values
        compare_vals = ["Murder", "Theft", "Cyber Crime", "Kidnapping", "Rape", "Robbery", "Belagavi", "Bangalore Urban", "Hubli", "Mysore"]
        print("\nComparison against frontend values:")
        for v in compare_vals:
            found = False
            suggested = None
            if ch is not None and v in list(ch.classes_):
                found = True
            if not found and ch is not None:
                # try case-insensitive / district mapping depending on which encoder is relevant
                suggested = map_to_encoder_class(ch, v)
                if suggested in list(ch.classes_):
                    # If suggested changed, we consider it NOT FOUND but with suggestion
                    found = (v == suggested)
            # Also try district encoder if value looks like a district
            if not found and dn is not None and v in list(dn.classes_):
                found = True
            if not found and dn is not None and suggested is None:
                suggested = map_to_encoder_class(dn, v)

            status = "FOUND" if found else "NOT FOUND"
            if suggested is not None and suggested != v:
                print(f"{v} -> {status} (suggested: {suggested})")
            else:
                print(f"{v} -> {status}")

    # Run quick prediction tests if model loaded
    if model is None or encoders is None:
        print("\nSkipping prediction tests because model or encoders are not loaded.")
    else:
        tests = [("Belagavi", "Murder"), ("Belagavi", "Theft"), ("Belagavi", "Robbery"), ("Belagavi", "Rape")]
        print("\nRunning example predictions:")
        for district_raw, crime_raw in tests:
            district = district_raw.strip()
            crime = crime_raw.strip()
            district_mapped = map_to_encoder_class(encoders.get("District_Name"), district)
            crime_mapped = map_to_encoder_class(encoders.get("CrimeHead_Name"), crime)
            district_enc = transform_with_fallback(encoders.get("District_Name"), district_mapped)
            crime_enc = transform_with_fallback(encoders.get("CrimeHead_Name"), crime_mapped)
            X = np.array([[2022, 5, district_enc, crime_enc]])
            try:
                pred_enc = model.predict(X)
                target_le = encoders.get("CrimeGroup_Name")
                if target_le is not None:
                    pred_label = str(target_le.inverse_transform(pred_enc.astype(int))[0])
                else:
                    pred_label = str(pred_enc[0])
            except Exception as e:
                pred_label = f"PREDICTION_FAILED: {e}"

            print("\nInput:", district_raw, ",", crime_raw)
            print("Mapped:", district_mapped, ",", crime_mapped)
            print("Encoded:", district_enc, ",", crime_enc)
            print("Prediction:", pred_label)
    # Start Flask normally for API usage
    # Print registered routes for verification before startup
    print("Registered routes:", app.url_map)
    print("Starting Flask API on 0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000)
