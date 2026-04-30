import uvicorn
import json
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
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
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        
        # ======================================================
        # call column parser and merger functions
        # ======================================================

        feedback_columns = get_feedback_column(df)
        merged_feedback_df = merge_feedback_columns(df, feedback_columns)

        # ======================================================
        # call LLM analytics function
        # ======================================================

        llm_analysis_results = analyze_feedback(merged_feedback_df) # Claude returns a plain string containing JSON structure

        # DEBUG: Print the raw output from the LLM to verify its structure before parsing
        print("RAW CLAUDE OUTPUT:\n", llm_analysis_results)

        final_results_dict = json.loads(llm_analysis_results) # convert the JSON string to a Python dictionary
        
        return {
            "status": "success",
            "filename": file.filename,
            "rows_detected": len(df),
            "analysis": final_results_dict
        }
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="The LLM failed to return a valid JSON format.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)