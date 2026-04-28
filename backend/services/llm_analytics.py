import os
import anthropic
from dotenv import load_dotenv

# oad API keys from env file
load_dotenv()

# initialize anthropic client
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def analyze_feedback(feedback_df) -> dict:
    """
    Analyzes the feedback data using a large language model (LLM) to extract insights and trends.
    
    Parameters:
    feedback_df: DataFrame containing the merged feedback data.
    
    Returns:
    dict: A dictionary containing the analysis results, such as common themes, sentiment analysis, and actionable insights.
    """
    
    # Convert the feedback DataFrame to a list of feedback entries
    feedback_entries = feedback_df['Merged Feedback'].tolist()

    # convert the list to a large string for the LLM input
    feedback_text = " | ".join(feedback_entries)
    
    # Prepare the prompt for the LLM
    