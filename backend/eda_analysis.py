import os
import sys
import logging
from typing import Optional

import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


def find_column(df: pd.DataFrame, keywords):
    for kw in keywords:
        for col in df.columns:
            if kw in col.lower():
                return col
    return None


def safe_mkdir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def load_cleaned(input_csv: Optional[str] = None) -> pd.DataFrame:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if input_csv is None:
        input_csv = os.path.join(base_dir, "data", "FIR_Details_Cleaned.csv")

    if not os.path.exists(input_csv):
        logging.error("Cleaned CSV not found: %s", input_csv)
        sys.exit(1)

    df = pd.read_csv(input_csv, low_memory=False)
    return df


def generate_charts_and_summary(df: pd.DataFrame, reports_dir: str) -> list:
    safe_mkdir(reports_dir)
    generated_files = []

    # Detect likely columns
    district_col = find_column(df, ["district", "police_station", "ps"])
    crime_col = find_column(df, ["crime", "offence", "offense", "ipc", "crime_category", "crime_type"])
    date_col = find_column(df, ["date", "incident_date", "fir_date", "reported", "registered", "occurrence"])

    # Ensure date parsing if available
    if date_col is not None:
        df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
        # Derive year and month
        df["_eda_year"] = df[date_col].dt.year
        df["_eda_month"] = df[date_col].dt.month
    else:
        # Try to use existing year/month columns
        year_col = find_column(df, ["year", "yr"]) or None
        month_col = find_column(df, ["month"]) or None
        if year_col is not None:
            df["_eda_year"] = pd.to_numeric(df[year_col], errors="coerce").astype("Int64")
        if month_col is not None:
            df["_eda_month"] = pd.to_numeric(df[month_col], errors="coerce").astype("Int64")

    # Compute required summaries
    total_records = len(df)
    unique_districts = int(df[district_col].nunique()) if district_col is not None else None
    unique_crime_cats = int(df[crime_col].nunique()) if crime_col is not None else None

    year_values = df["_eda_year"].dropna().astype(int) if "_eda_year" in df.columns else pd.Series([], dtype=int)
    if not year_values.empty:
        year_min = int(year_values.min())
        year_max = int(year_values.max())
        year_range = (year_min, year_max)
    else:
        year_range = None

    print(f"Total records: {total_records}")
    print(f"Total districts: {unique_districts if unique_districts is not None else 'N/A'}")
    print(f"Total crime categories: {unique_crime_cats if unique_crime_cats is not None else 'N/A'}")
    print(f"Year range: {year_range if year_range is not None else 'N/A'}")

    # Top 10 districts
    top_districts = None
    if district_col is not None:
        top_districts = df[district_col].value_counts().head(10)
        print("\nTop 10 districts by crime count:")
        print(top_districts.to_string())
    else:
        print("\nTop 10 districts by crime count: N/A (no district column found)")

    # Top 10 crime categories
    top_crimes = None
    if crime_col is not None:
        top_crimes = df[crime_col].value_counts().head(10)
        print("\nTop 10 crime categories:")
        print(top_crimes.to_string())
    else:
        print("\nTop 10 crime categories: N/A (no crime column found)")

    # Crimes per year
    crimes_per_year = None
    if "_eda_year" in df.columns and not df["_eda_year"].dropna().empty:
        crimes_per_year = df.groupby("_eda_year").size().sort_index()
        print("\nCrimes per year:")
        print(crimes_per_year.to_string())
    else:
        print("\nCrimes per year: N/A")

    # Crimes per month (aggregate across years)
    crimes_per_month = None
    if "_eda_month" in df.columns and not df["_eda_month"].dropna().empty:
        crimes_per_month = df.groupby("_eda_month").size().reindex(range(1, 13), fill_value=0)
        print("\nCrimes per month (1=Jan ... 12=Dec):")
        print(crimes_per_month.to_string())
    else:
        print("\nCrimes per month: N/A")

    # Generate charts using matplotlib
    plt.style.use("ggplot")

    if top_districts is not None and not top_districts.empty:
        fig, ax = plt.subplots(figsize=(10, 6))
        top_districts.sort_values().plot(kind="barh", ax=ax, color="tab:blue")
        ax.set_title("Top 10 Districts by Crime Count")
        ax.set_xlabel("Number of Crimes")
        fig.tight_layout()
        out_path = os.path.join(reports_dir, "top_districts.png")
        fig.savefig(out_path)
        plt.close(fig)
        generated_files.append(out_path)

    if top_crimes is not None and not top_crimes.empty:
        fig, ax = plt.subplots(figsize=(10, 6))
        top_crimes.sort_values().plot(kind="barh", ax=ax, color="tab:orange")
        ax.set_title("Top 10 Crime Categories")
        ax.set_xlabel("Number of Crimes")
        fig.tight_layout()
        out_path = os.path.join(reports_dir, "crime_categories.png")
        fig.savefig(out_path)
        plt.close(fig)
        generated_files.append(out_path)

    if crimes_per_year is not None and not crimes_per_year.empty:
        fig, ax = plt.subplots(figsize=(10, 5))
        crimes_per_year.plot(kind="line", marker="o", ax=ax, color="tab:green")
        ax.set_title("Crimes Per Year")
        ax.set_xlabel("Year")
        ax.set_ylabel("Number of Crimes")
        fig.tight_layout()
        out_path = os.path.join(reports_dir, "yearly_trend.png")
        fig.savefig(out_path)
        plt.close(fig)
        generated_files.append(out_path)

    if crimes_per_month is not None and crimes_per_month.sum() > 0:
        fig, ax = plt.subplots(figsize=(10, 5))
        crimes_per_month.plot(kind="bar", ax=ax, color="tab:purple")
        ax.set_title("Crimes Per Month")
        ax.set_xlabel("Month")
        ax.set_ylabel("Number of Crimes")
        ax.set_xticks(range(0, 12))
        ax.set_xticklabels(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], rotation=45)
        fig.tight_layout()
        out_path = os.path.join(reports_dir, "monthly_trend.png")
        fig.savefig(out_path)
        plt.close(fig)
        generated_files.append(out_path)

    # Summary text
    summary_path = os.path.join(reports_dir, "eda_summary.txt")
    with open(summary_path, "w", encoding="utf-8") as fh:
        fh.write("EDA Summary\n")
        fh.write("==========\n\n")
        fh.write(f"Total records: {total_records}\n")
        fh.write(f"Total districts: {unique_districts if unique_districts is not None else 'N/A'}\n")
        fh.write(f"Total crime categories: {unique_crime_cats if unique_crime_cats is not None else 'N/A'}\n")
        fh.write(f"Year range: {year_range if year_range is not None else 'N/A'}\n\n")

        fh.write("Top 10 districts by crime count:\n")
        if top_districts is not None:
            fh.write(top_districts.to_string())
        else:
            fh.write("N/A\n")
        fh.write("\n\nTop 10 crime categories:\n")
        if top_crimes is not None:
            fh.write(top_crimes.to_string())
        else:
            fh.write("N/A\n")

        fh.write("\n\nCrimes per year:\n")
        if crimes_per_year is not None:
            fh.write(crimes_per_year.to_string())
        else:
            fh.write("N/A\n")

        fh.write("\n\nCrimes per month:\n")
        if crimes_per_month is not None:
            fh.write(crimes_per_month.to_string())
        else:
            fh.write("N/A\n")

    generated_files.append(summary_path)

    return generated_files


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    input_arg = sys.argv[1] if len(sys.argv) > 1 else None
    reports_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports")

    df = load_cleaned(input_arg)
    generated = generate_charts_and_summary(df, reports_dir)

    print("\nGenerated files:")
    for p in generated:
        print(p)


if __name__ == "__main__":
    main()
