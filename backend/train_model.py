import os
import sys
import logging
from typing import Optional, Dict

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib


def reduce_memory_usage(df: pd.DataFrame) -> pd.DataFrame:
    for col in df.columns:
        col_type = df[col].dtype
        if pd.api.types.is_integer_dtype(col_type):
            df[col] = pd.to_numeric(df[col], downcast="integer")
        elif pd.api.types.is_float_dtype(col_type):
            df[col] = pd.to_numeric(df[col], downcast="float")
        elif pd.api.types.is_object_dtype(col_type):
            num_unique_values = df[col].nunique(dropna=False)
            num_total_values = len(df[col])
            if num_total_values > 0 and (num_unique_values / num_total_values) < 0.5:
                df[col] = df[col].astype("category")
    return df


def find_column(df: pd.DataFrame, keywords):
    for kw in keywords:
        for col in df.columns:
            if kw in col.lower():
                return col
    return None


def prepare_features(df: pd.DataFrame) -> (pd.DataFrame, pd.Series, Dict[str, LabelEncoder]):
    # Locate columns flexibly
    year_col = find_column(df, ["fir_year", "_eda_year", "year"])
    month_col = find_column(df, ["fir_month", "_eda_month", "month"])
    district_col = find_column(df, ["district_name", "district", "districtname"])
    crimegroup_col = find_column(df, ["crimegroup_name", "crime_group", "crimegroup", "crimegroupname", "crimegroupname"])
    crimehead_col = find_column(df, ["crimehead_name", "crime_head", "crimehead", "offence", "offense"])

    if crimegroup_col is None:
        logging.error("Target column for CrimeGroup_Name not found in dataset.")
        sys.exit(1)

    # Ensure columns exist and fill missing
    if year_col is None:
        df["FIR_YEAR"] = pd.to_datetime(df.iloc[:, 0], errors="coerce").dt.year
        year_col = "FIR_YEAR"
    if month_col is None:
        df["FIR_MONTH"] = pd.to_datetime(df.iloc[:, 0], errors="coerce").dt.month
        month_col = "FIR_MONTH"

    # Rename chosen columns to standard names for clarity
    df = df.rename(columns={year_col: "FIR_YEAR", month_col: "FIR_MONTH", district_col: "District_Name", crimegroup_col: "CrimeGroup_Name", crimehead_col: "CrimeHead_Name"})

    # Keep only relevant columns
    use_cols = [c for c in ["FIR_YEAR", "FIR_MONTH", "District_Name", "CrimeGroup_Name", "CrimeHead_Name"] if c in df.columns]
    df = df[use_cols].copy()

    # Ensure target is plain string to avoid categorical fill/assignment issues
    if "CrimeGroup_Name" in df.columns:
        df["CrimeGroup_Name"] = df["CrimeGroup_Name"].astype(str)

    # Fill missing
    df["FIR_YEAR"] = pd.to_numeric(df.get("FIR_YEAR"), errors="coerce").fillna(df["FIR_YEAR"].median()).astype(int)
    df["FIR_MONTH"] = pd.to_numeric(df.get("FIR_MONTH"), errors="coerce").fillna(0).astype(int)

    # Categorical fill
    for col in ["District_Name", "CrimeHead_Name"]:
        if col in df.columns:
            # If column is categorical, convert to string first to avoid adding new categories via fillna
            if pd.api.types.is_categorical_dtype(df[col]):
                df[col] = df[col].astype(str)
            df[col] = df[col].fillna("__MISSING__").astype(str)

    # Reduce memory usage
    df = reduce_memory_usage(df)

    # Ensure target remains a plain string (reduce_memory_usage may convert object cols to categorical)
    if "CrimeGroup_Name" in df.columns:
        df["CrimeGroup_Name"] = df["CrimeGroup_Name"].astype(str)

    # Encode categorical features using LabelEncoder
    encoders: Dict[str, LabelEncoder] = {}
    X = pd.DataFrame()

    X["FIR_YEAR"] = df["FIR_YEAR"].astype(int)
    X["FIR_MONTH"] = df["FIR_MONTH"].astype(int)

    for col in ["District_Name", "CrimeHead_Name"]:
        if col in df.columns:
            le = LabelEncoder()
            X[col] = le.fit_transform(df[col])
            encoders[col] = le

    # Target
    y = df["CrimeGroup_Name"].fillna("__MISSING__").astype(str)
    target_le = LabelEncoder()
    y_enc = target_le.fit_transform(y)
    encoders["CrimeGroup_Name"] = target_le

    return X, y_enc, encoders


def train_and_save(input_csv: Optional[str] = None, model_path: Optional[str] = None, encoders_path: Optional[str] = None, n_estimators: int = 100):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if input_csv is None:
        input_csv = os.path.join(base_dir, "data", "FIR_Details_Cleaned.csv")
    if model_path is None:
        model_path = os.path.join(base_dir, "models", "crime_prediction_model.pkl")
    if encoders_path is None:
        encoders_path = os.path.join(base_dir, "models", "label_encoders.pkl")

    os.makedirs(os.path.dirname(model_path), exist_ok=True)

    if not os.path.exists(input_csv):
        logging.error("Input CSV not found: %s", input_csv)
        sys.exit(1)

    # Read data
    df = pd.read_csv(input_csv, low_memory=False)

    print(f"Loaded data with shape: {df.shape}")

    X, y, encoders = prepare_features(df)

    print(f"Feature matrix shape: {X.shape}")

    # Train/test split — only stratify if all classes have at least 2 samples
    unique, counts = np.unique(y, return_counts=True)
    if counts.min() >= 2:
        stratify_arg = y
    else:
        stratify_arg = None
        logging.warning("Some classes have fewer than 2 samples — proceeding without stratified split.")

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=stratify_arg)

    # Detect severe class imbalance and choose class_weight if needed
    imbalance_ratio = float(counts.max()) / max(float(counts.min()), 1.0)
    use_class_weight = False
    if imbalance_ratio > 10.0:
        use_class_weight = True
        print(f"Detected severe class imbalance (max/min ratio={imbalance_ratio:.1f}). Using class_weight='balanced'.")

    # Train model
    clf = RandomForestClassifier(n_estimators=n_estimators, n_jobs=-1, random_state=42, class_weight=('balanced' if use_class_weight else None))
    clf.fit(X_train, y_train)

    # Evaluate
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {acc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, zero_division=0))

    # Save model and encoders
    joblib.dump(clf, model_path)
    joblib.dump(encoders, encoders_path)

    print(f"Saved model to: {model_path}")
    print(f"Saved encoders to: {encoders_path}")


def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    input_arg = sys.argv[1] if len(sys.argv) > 1 else None
    model_arg = sys.argv[2] if len(sys.argv) > 2 else None
    encoders_arg = sys.argv[3] if len(sys.argv) > 3 else None
    n_estimators = int(sys.argv[4]) if len(sys.argv) > 4 else 100
    # Quick v3 mode: `python train_model.py v3`
    if input_arg == 'v3':
        model_out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models', 'crime_prediction_model_v3.pkl') if model_arg is None else model_arg
        enc_out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models', 'label_encoders_v3.pkl') if encoders_arg is None else encoders_arg
        train_quick_v3(input_csv=None, model_path=model_out, encoders_path=enc_out, n_rows=100000, min_count=100)
    else:
        train_and_save(input_arg, model_arg, encoders_arg, n_estimators)


def train_quick_v3(input_csv: Optional[str] = None, model_path: Optional[str] = None, encoders_path: Optional[str] = None, n_rows: int = 100000, min_count: int = 100):
    """Quick retrain for v3: filter rare classes (<min_count), train on first n_rows rows, save v3 artifacts."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if input_csv is None:
        input_csv = os.path.join(base_dir, "data", "FIR_Details_Cleaned.csv")
    if model_path is None:
        model_path = os.path.join(base_dir, "models", "crime_prediction_model_v3.pkl")
    if encoders_path is None:
        encoders_path = os.path.join(base_dir, "models", "label_encoders_v3.pkl")

    os.makedirs(os.path.dirname(model_path), exist_ok=True)

    if not os.path.exists(input_csv):
        logging.error("Input CSV not found: %s", input_csv)
        sys.exit(1)

    df = pd.read_csv(input_csv, low_memory=False)
    # Normalize target column name if needed
    cg_col = find_column(df, ["crimegroup_name", "crime_group", "crimegroup"])
    if cg_col is None:
        logging.error("CrimeGroup_Name column not found for v3 training.")
        sys.exit(1)
    df[cg_col] = df[cg_col].fillna('__MISSING__').astype(str)

    # Class counts before filtering
    counts = df[cg_col].value_counts()
    num_classes_before = counts.shape[0]
    print(f"Number of classes before filtering: {num_classes_before}")
    print("Top 20 class counts before filtering:")
    print(counts.head(20))

    # Filter classes with at least min_count records
    keep = counts[counts >= min_count].index
    df_filtered = df[df[cg_col].isin(keep)].copy()
    num_classes_after = df_filtered[cg_col].nunique()
    print(f"Number of classes after filtering (min_count={min_count}): {num_classes_after}")

    # Use first n_rows rows
    if len(df_filtered) > n_rows:
        df_train = df_filtered.iloc[:n_rows].copy()
        print(f"Using first {n_rows} rows from filtered data for training")
    else:
        df_train = df_filtered.copy()
        print(f"Filtered data smaller than {n_rows}, using all {len(df_train)} rows")

    # Prepare features and encoders
    X, y, encoders = prepare_features(df_train)

    # Print top 20 class counts after filtering
    le = encoders.get('CrimeGroup_Name')
    if le is not None:
        labels = le.inverse_transform(np.arange(len(le.classes_)))
        counts_after = pd.Series(y).map(lambda v: le.classes_[v]).value_counts()
        print("Top 20 class counts after filtering:")
        print(counts_after.head(20))

    print(f"Feature matrix shape for v3 training: {X.shape}")

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train with specified quick config
    clf = RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42, n_jobs=-1)
    print("Training v3 RandomForestClassifier...")
    clf.fit(X_train, y_train)

    # Evaluate
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"v3 Accuracy: {acc:.4f}")
    print("\nClassification Report v3:")
    print(classification_report(y_test, y_pred, zero_division=0))

    # Save artifacts
    joblib.dump(clf, model_path)
    joblib.dump(encoders, encoders_path)
    print(f"Saved v3 model to: {model_path}")
    print(f"Saved v3 encoders to: {encoders_path}")


if __name__ == "__main__":
    main()
