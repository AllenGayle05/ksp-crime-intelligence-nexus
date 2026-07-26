import os
import sys
import logging
from typing import Optional

import pandas as pd
import numpy as np


def reduce_memory_usage(df: pd.DataFrame) -> pd.DataFrame:
    """Downcast numeric types and convert low-cardinality objects to categories to save memory."""
    start_mem = df.memory_usage(deep=True).sum() / 1024 ** 2
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
    end_mem = df.memory_usage(deep=True).sum() / 1024 ** 2
    logging.info("Memory usage reduced from %.2f MB to %.2f MB", start_mem, end_mem)
    return df


def inspect_missing(df: pd.DataFrame) -> pd.Series:
    """Return missing value counts per column."""
    return df.isnull().sum()


def clean_dataset(input_csv: Optional[str] = None, output_csv: Optional[str] = None) -> None:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if input_csv is None:
        input_csv = os.path.join(base_dir, "data", "FIR_Details_Data.csv")
    if output_csv is None:
        output_csv = os.path.join(base_dir, "data", "FIR_Details_Cleaned.csv")

    logging.info("Input CSV: %s", input_csv)
    logging.info("Output CSV: %s", output_csv)

    if not os.path.exists(input_csv):
        logging.error("Input CSV not found: %s", input_csv)
        sys.exit(1)

    # Read with low_memory=False to get better type inference, then optimize
    try:
        df = pd.read_csv(input_csv, low_memory=False)
    except Exception as exc:
        logging.exception("Failed to read CSV: %s", exc)
        sys.exit(1)

    # Initial diagnostics
    original_shape = df.shape
    print(f"Original shape: {original_shape[0]} rows, {original_shape[1]} columns")

    missing_before = inspect_missing(df)
    print("\nMissing values before cleaning (non-zero only):")
    nonzero_missing = missing_before[missing_before > 0]
    if nonzero_missing.empty:
        print("None")
    else:
        print(nonzero_missing.to_string())

    # Reduce memory usage before processing
    df = reduce_memory_usage(df)

    # Remove duplicates
    dup_count = df.duplicated().sum()
    if dup_count > 0:
        df = df.drop_duplicates()
    print(f"\nNumber of duplicate rows removed: {dup_count}")

    # Fill missing values
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()

    # Numeric: fill with median
    for col in numeric_cols:
        if df[col].isnull().any():
            median_val = df[col].median()
            df[col].fillna(median_val, inplace=True)

    # Categorical: fill with mode (most frequent). handle empty mode
    for col in categorical_cols:
        if df[col].isnull().any():
            modes = df[col].mode(dropna=True)
            if not modes.empty:
                df[col].fillna(modes.iloc[0], inplace=True)
            else:
                # If entire column is NaN, fill with empty string
                df[col].fillna("", inplace=True)

    # Normalize column names
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    # Final diagnostics
    final_shape = df.shape
    missing_after = inspect_missing(df)

    print(f"\nFinal shape: {final_shape[0]} rows, {final_shape[1]} columns")
    print("\nMissing values after cleaning (non-zero only):")
    nonzero_missing_after = missing_after[missing_after > 0]
    if nonzero_missing_after.empty:
        print("None")
    else:
        print(nonzero_missing_after.to_string())

    # Save cleaned dataset
    try:
        df.to_csv(output_csv, index=False)
    except Exception as exc:
        logging.exception("Failed to write cleaned CSV: %s", exc)
        sys.exit(1)

    print(f"\nSaved cleaned dataset to: {output_csv}")


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    input_arg = sys.argv[1] if len(sys.argv) > 1 else None
    output_arg = sys.argv[2] if len(sys.argv) > 2 else None
    clean_dataset(input_arg, output_arg)


if __name__ == "__main__":
    main()
