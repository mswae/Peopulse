import os
import anthropic
from dotenv import load_dotenv, find_dotenv

# load API keys from env file
load_dotenv(find_dotenv())

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
    
    # ======================================================
    # 1. Prepare the feedback data for LLM analysis
    # ======================================================
    
    feedback_entries = feedback_df["Merged Feedback"].tolist() # Convert the feedback DataFrame to a list of feedback entries
    feedback_text = " | ".join(feedback_entries) # convert the list to a large string for the LLM input
    
    # ======================================================
    # 2. Locate the prompt file
    # ======================================================

    current_dir = os.path.dirname(__file__)
    prompt_file_path = os.path.join(current_dir, "prompts", "llm_prompt.md")

    # ======================================================
    # 3. Load prompt file
    # ======================================================

    try:
        with open(prompt_file_path, "r", encoding="utf-8") as file:
            system_prompt = file.read()
    except FileNotFoundError:
        return Exception(f"Prompt file not found at path: {prompt_file_path}")
    
    # ======================================================
    # 4. API call to the LLM
    # ======================================================

    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            temperature=0.3,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": f"Here is the raw citizen feedback:\n\n{feedback_text}"
                }
            ]
        )

        return response.content[0].text

    except Exception as e:
        return f"{{'error': 'API connection failed: {str(e)}'}}"