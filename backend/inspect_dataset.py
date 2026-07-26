import os
import sys
import logging
from typing import Optional

import pandas as pd
import numpy as np


def inspect_dataset(csv_path: Optional[str] = None) -> None:
    """Read a CSV and print dataset inspection summaries.

    If `csv_path` is None, the function looks for the CSV at
    backend/data/FIR_Details_Data.csv relative to this script.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if csv_path is None:
        csv_path = os.path.join(base_dir, "data", "FIR_Details_Data.csv")

    logging.info("Using CSV path: %s", csv_path)

    if not os.path.exists(csv_path):
        logging.error("CSV file not found: %s", csv_path)
        sys.exit(1)

    try:
        df = pd.read_csv(csv_path)
    except Exception as exc:  # pragma: no cover - simple runtime guard
        logging.exception("Failed to read CSV file: %s", exc)
        sys.exit(1)

    rows, cols = df.shape
    print(f"Total rows: {rows}")
    print(f"Total columns: {cols}")

    print("\nColumn names:")
    for col in df.columns:
        print(f"- {col}")

    print("\nFirst 5 records:")
    # Use to_string to keep output compact and readable in terminals
    print(df.head(5).to_string(index=False))

    print("\nMissing value counts:")
    missing = df.isnull().sum()
    print(missing.to_string())


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    csv_arg = sys.argv[1] if len(sys.argv) > 1 else None
    inspect_dataset(csv_arg)


if __name__ == "__main__":
    main()
