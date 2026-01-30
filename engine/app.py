import os
import base64
import json
import tempfile
from datetime import datetime
from flask import Flask, request, jsonify
from openai import OpenAI
from dotenv import load_dotenv
import fitz  # PyMuPDF
from PIL import Image
 
# ----------------------------
# APP + CLIENT INIT
# ----------------------------
load_dotenv()
 
app = Flask(__name__)
 
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
 
# ----------------------------
# UTILS
# ----------------------------
def encode_image_base64(file_path):
    with open(file_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")
 
 
def pdf_to_images(pdf_path):
    """Convert PDF pages to list of image file paths."""
    doc = fitz.open(pdf_path)
    image_paths = []
   
    for page_num in range(len(doc)):
        page = doc[page_num]
        # Render page to image (pixmap)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better quality
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
       
        # Save to temporary file
        tmp_img = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
        img.save(tmp_img.name, "PNG")
        image_paths.append(tmp_img.name)
   
    doc.close()
    return image_paths
 
 
def parse_document_with_vision(image_path, page_num=None):
    current_date = datetime.today().strftime("%Y-%m-%d")
    b64_image = encode_image_base64(image_path)
 
    page_context = f" (Page {page_num + 1})" if page_num is not None else ""
   
    prompt = f"""
You are a LegalTech AI specialized in identity document understanding.
 
TODAY'S DATE: {current_date}
 
YOUR TASK:
1. Read the entire document image{page_context} (OCR internally).
2. Identify DOCUMENT TYPE strictly as:
   ["passport", "national_id", "driving_license", "other"]
 
3. Extract ALL visible information:
   - Names
   - Numbers
   - Dates
   - Addresses
   - Authorities
   - Codes
   - Machine-readable zones
   - Any labeled data
 
4. Structure output by DOCUMENT HEADINGS or logical sections.
 
5. Normalize dates to YYYY-MM-DD when possible.
6. Use null if unreadable.
7. Identify inconsistencies.
 
OUTPUT STRICT JSON ONLY.
 
REQUIRED JSON FORMAT:
{{
  "document_type": "passport | national_id | driving_license | other",
  "extracted_sections": {{
    "<Heading or Section Name>": {{
      "<Field Label>": "<Value or null>"
    }}
  }},
  "inconsistencies": ["string"],
  "confidence_indication": "high | medium | low"
}}
 
RULES:
- Do not invent fields
- No explanations
- No markdown
"""
 
    response = client.responses.create(
        model="gpt-4o-mini",
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": prompt},
                    {
                        "type": "input_image",
                        "image_url": f"data:image/png;base64,{b64_image}"
                    }
                ],
            }
        ],
        temperature=0.05,
    )
 
    raw_output = response.output_text
 
    try:
        return json.loads(raw_output)
    except Exception:
        return {
            "document_type": "other",
            "extracted_sections": {},
            "inconsistencies": ["Failed to parse JSON"],
            "confidence_indication": "low",
            "raw_output": raw_output
        }
 
 
# ----------------------------
# FLASK ROUTE
# ----------------------------
@app.route("/api/parse-document", methods=["POST"])
def parse_document():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
 
    file = request.files["file"]
 
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400
 
    # Determine file type
    filename = file.filename.lower()
    is_pdf = filename.endswith(".pdf")
   
    # Save temporarily
    suffix = ".pdf" if is_pdf else ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name
 
    temp_image_paths = []
   
    try:
        if is_pdf:
            # Convert PDF to images
            temp_image_paths = pdf_to_images(tmp_path)
           
            if not temp_image_paths:
                return jsonify({"error": "Failed to extract pages from PDF"}), 400
           
            # Process all pages and combine results
            all_results = []
            for idx, img_path in enumerate(temp_image_paths):
                page_result = parse_document_with_vision(img_path, page_num=idx)
                all_results.append({
                    "page": idx + 1,
                    "result": page_result
                })
           
            # Combine results from all pages
            if len(all_results) == 1:
                # Single page - return directly
                result = all_results[0]["result"]
                result["total_pages"] = 1
            else:
                # Multiple pages - merge results
                # Use the document type from the first page
                result = {
                    "document_type": all_results[0]["result"].get("document_type", "other"),
                    "extracted_sections": {},
                    "inconsistencies": [],
                    "confidence_indication": "medium",
                    "total_pages": len(all_results),
                    "pages": all_results
                }
               
                # Merge sections from all pages
                for page_data in all_results:
                    page_result = page_data["result"]
                    if "extracted_sections" in page_result:
                        for section, fields in page_result["extracted_sections"].items():
                            if section not in result["extracted_sections"]:
                                result["extracted_sections"][section] = {}
                            result["extracted_sections"][section].update(fields)
                   
                    if "inconsistencies" in page_result:
                        result["inconsistencies"].extend(page_result["inconsistencies"])
           
            return jsonify(result)
        else:
            # Process as image
            result = parse_document_with_vision(tmp_path)
            result["total_pages"] = 1
            return jsonify(result)
    finally:
        # Clean up all temporary files
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        for img_path in temp_image_paths:
            if os.path.exists(img_path):
                os.remove(img_path)
 
 
# ----------------------------
# RUN
# ----------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
 