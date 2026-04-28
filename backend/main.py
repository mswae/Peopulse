import uvicorn
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

    if file.content_type != 'text/csv':
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV file.")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # column parser and merger algorithms
        feedback_columns = get_feedback_column(df)
        merged_feedback_df = merge_feedback_columns(df, feedback_columns)

        """
        Call the LLM Analytics function here
        """
        
        return {
            "status": "success",
            "filename": file.filename,
            "rows_detected": len(df),
            "message": "File is ready for the heuristic parser!"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)