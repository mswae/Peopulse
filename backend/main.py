import uvicorn
import json
import io
import time
import re
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

from services.data_pipeline import get_feedback_column, merge_feedback_columns
from services.llm_analytics import analyze_feedback

# initialize app
app = FastAPI(
    title="Feedback Column Identifier API",
    description="API to identify and merge feedback columns from uploaded CSV files.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"message": "API is running successfully!"}

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):

    if file.content_type != "text/csv":
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV file.")
    else:
        print("Parsed file content type:", file.content_type)

    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        
        # ======================================================
        # call column parser and merger functions
        # ======================================================

        feedback_columns = get_feedback_column(df)
        merged_feedback_df = merge_feedback_columns(df, feedback_columns)

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV file: {str(e)}")
    
    max_retries = 5

    for attempt in range(max_retries):

        # ======================================================
        # call LLM analytics function
        # ======================================================

        llm_analysis_results = analyze_feedback(merged_feedback_df) # Claude returns a plain string containing JSON structure

        # ======================================================
        # Bulletproof Regex Extractor
        # ======================================================

        match = re.search(r'\{.*\}', llm_analysis_results, re.DOTALL)
        
        if match:
            clean_json_string = match.group(0)
        else:
            # If there are no curly braces at all, default to an empty JSON string
            clean_json_string = "{}" 
            print("WARNING: No JSON brackets found in the LLM response.")
            
        # ======================================================

        try:
            final_results_dict = json.loads(clean_json_string) # convert the JSON string to a Python dictionary
            print("SUCCESSFULLY PARSED DICT:", final_results_dict)

        except json.JSONDecodeError:
            print("FAILED TO PARSE STRIPPED STRING:", clean_json_string)
            raise HTTPException(status_code=500, detail="The LLM failed to return a valid JSON format.")

        if "error" in final_results_dict:
            error_message = final_results_dict["error"]
        
            if "429" in error_message:
                print(f"Server busy. Retrying attempt {attempt + 1} of {max_retries}...")
                time.sleep(5)
                continue
            else:
                # If it's a different error (like a bad API key), fail immediately
                raise HTTPException(status_code=502, detail=error_message)
        
        return {
            "status": "success",
            "filename": file.filename,
            "rows_detected": len(df),
            "analysis": final_results_dict
        }            
    
    raise HTTPException(
        status_code=503, 
        detail="Service Unavailable: OpenRouter is experiencing heavy traffic. Please try again later."
    )
    
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)