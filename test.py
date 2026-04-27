"""
This script creates a Gradio interface to test the feedback column identification and merging functionality.
It allows users to upload a CSV file, identifies potential feedback columns, and then merges them into a single column for display.

HOW TO USE:
Simply RUN this script, and a Gradio interface will open in your browser. 
Upload a CSV file, click the "Analyze Button", and the identified feedback column(s) along with the merged feedback DataFrame will be displayed.
"""

import gradio as gr
from data_pipeline import get_feedback_column, merge_feedback_columns

with gr.Blocks() as demo:
    gr.Markdown("## Feedback Column Identifier")
    with gr.Row():
        with gr.Column():
            csv_input = gr.File(label="Upload your CSV file")
        with gr.Column():
            analyze_button = gr.Button("Analyze Button")

    with gr.Row():
        with gr.Column(scale=2):
            columns_output = gr.Textbox(label="Identified Feedback Column", lines=1)
        with gr.Column(scale=3):
            df_output = gr.DataFrame(label="Merged Feedback DataFrame", headers=["Merged Feedback"])

    analyze_button.click(
        fn=get_feedback_column,
        inputs=csv_input, 
        outputs=[columns_output]
    ).then(
        fn=merge_feedback_columns,
        inputs=[csv_input, columns_output],
        outputs=[df_output]
    )

demo.launch()