import pandas as pd

def get_feedback_column(csv_file) -> tuple[str | None, int] | None:
    """
    Automatically identifies the most likely 'feedback' column in a DataFrame.
    
    Parameters:
    csv_file: The mess dataset.
    
    Returns:
    str: The name of the column with the highest heuristic score.
    score: The heuristic score
    """
    
    df = pd.read_csv(csv_file)

    best_col = None
    highest_score = -1

    # target keywords for the column name
    keywords = ["feedback", "comment", "remark", "suggestion", "description", "message"]

    # drop numerical columns because they're unneccesary
    text_cols = df.select_dtypes(include=["object", "string"]).columns

    for col in text_cols:
        score = 0

        # Sample up to 100 random rows to keep it fast
        sample = df[col].dropna().astype(str).sample(min(100, len(df[col].dropna())))

        # filter 1: Metadata Scoring
        col_lower = col.lower()
        if any(keyword in col_lower for keyword in keywords):
            score += 50  # Huge bonus for obvious names
        
        # filter 2: Statistical Scoring ---
        # A. Average String Length (Feedback is usually > 30 chars)
        avg_len = sample.str.len().mean()
        if avg_len > 30:
            score += 20
        elif avg_len < 15:
            score -= 20 # Penalize likely names/IDs
            
        # B. Cardinality / Uniqueness (Feedback is highly unique)
        uniqueness_ratio = sample.nunique() / len(sample)
        if uniqueness_ratio > 0.9:
            score += 20
        elif uniqueness_ratio < 0.2:
            score -= 30 # Penalize categorical data (e.g., "Male/Female", "Barangay")
            
        # C. Word Count / Spaces (Feedback has sentence structure)
        avg_spaces = sample.str.count(' ').mean()
        if avg_spaces > 5:
            score += 10
            
        # --- Keep track of the winner ---
        if score > highest_score:
            highest_score = score
            best_col = col

        return best_col, highest_score