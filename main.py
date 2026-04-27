import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
from backend.data_pipeline import get_feedback_column, merge_feedback_columns

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

"""
    1. 'get' call of api
    2. 'post' call of api that accepts a CSV file, identifies feedback columns, and returns the merged feedback DataFrame.
    3. run the app with uvicorn.
"""