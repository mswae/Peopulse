import os
import json
from openai import OpenAI
from dotenv import load_dotenv, find_dotenv

# load API keys from env file
load_dotenv(find_dotenv())

# initialize OpenAI client
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ.get("OPENROUTER_API_KEY")
)

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
    feedback_string = " | ".join(feedback_entries) # convert the list to a large string for the LLM input
    
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
        
        response = client.chat.completions.create(
            model="openrouter/owl-alpha",
            max_tokens=1000,
            temperature=0.3,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Here is the raw citizen feedback:\n\n{feedback_string}"}
            ]
        )

        return response.choices[0].message.content
        
        """
        # Return a hardcoded string that perfectly matches your expected JSON schema
        # Uncomment this once you have the actual LLM integration working, to test the rest of your pipeline without making real API calls
        mock_claude_response = """
        {
            "top_praises": [
                "The new digital queuing system is helpful", 
                "Front desk staff were highly accommodating"
            ],
            "top_complaints": [
                "Ventilation in the main hall is very poor", 
                "Waiting times for document processing exceed 2 hours"
            ],
            "actionable_recommendations": [
                "Deploy portable industrial fans in the main waiting area",
                "Open a dedicated 'Express Lane' for simple document pickups to reduce bottleneck"
            ]
        }
        """

        return mock_claude_response
        """

    except Exception as e:
        error_dict = {"error": f"(llm_analytics.py) API connection failed: {str(e)}"}

        return json.dumps(error_dict)