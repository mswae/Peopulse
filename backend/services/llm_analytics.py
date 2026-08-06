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

def analyze_feedback(feedback_df) -> str:
    """
    Analyzes the feedback data using a large language model (LLM) to extract insights and trends.
    """
    
    # ======================================================
    # 1. Prepare the feedback data for LLM analysis
    # ======================================================
    
    feedback_entries = feedback_df["Merged Feedback"].tolist()
    feedback_string = " | ".join(feedback_entries)
    
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
        # CRITICAL FIX: Raise the exception so it doesn't get passed to the regex parser
        raise FileNotFoundError(f"Prompt file not found at path: {prompt_file_path}")
    
    # ======================================================
    # 4. API call to the LLM
    # ======================================================

    try:
        response = client.chat.completions.create(
            model="inclusionai/ling-3.0-flash:free", 
            max_tokens=1000,
            temperature=0.3,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Here is the raw citizen feedback:\n\n{feedback_string}"}
            ]
        )

        return response.choices[0].message.content

    except Exception as e:
        error_dict = {"error": f"(llm_analytics.py) API connection failed: {str(e)}"}
        return json.dumps(error_dict)