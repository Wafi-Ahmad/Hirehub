import os
import base64
import json
import requests
import logging
from pdf2image import convert_from_path
from PIL import Image
import io
from dotenv import load_dotenv
from django.conf import settings

# Setup logging
logger = logging.getLogger(__name__)

# Load environment variables (ensure .env is in a directory searched by load_dotenv)
load_dotenv() 

# --- Configuration ---
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
# Recommended model supporting function calling & vision - check OpenRouter for latest
LLM_MODEL = "google/gemma-3-27b-it:free" 
# Define the expected JSON structure for the LLM output
EXPECTED_JSON_STRUCTURE = {
    "candidate_name": "string",
    "email_address": "string",
    "phone_number": "string",
    "location": "string",
    "linkedin_url": "string",
    "summary": "string",
    "skills": ["list", "of", "strings"],
    "experience": [
        {
          "company": "string",
          "position": "string",
          "dates": "string",
          "description": "string"
        }
    ],
    "education": [
        {
          "institution": "string",
          "degree": "string",
          "dates": "string",
          "field_of_study": "string"
        }
    ],
    "certifications": ["list", "of", "strings"]
}

class LLMCVParser:

    def __init__(self):
        if not OPENROUTER_API_KEY:
            logger.error("OPENROUTER_API_KEY not found in environment variables.")
            raise ValueError("API key for OpenRouter not configured.")

    def _convert_pdf_to_images(self, file_path, max_pages=10, dpi=100):
        """Converts PDF pages to a list of base64 encoded image strings."""
        images_base64 = []
        try:
            # Convert PDF to a list of PIL Image objects
            images = convert_from_path(file_path, dpi=dpi, first_page=1, last_page=max_pages)
            
            for i, image in enumerate(images):
                # Convert PIL Image to PNG format in memory
                buffered = io.BytesIO()
                # Ensure image is in RGB mode for saving as PNG
                if image.mode == 'RGBA':
                    image = image.convert('RGB')
                elif image.mode == 'P': # Palette mode
                     image = image.convert('RGB')
                elif image.mode == 'LA': # Luminance Alpha
                    image = image.convert('RGB')

                image.save(buffered, format="PNG")
                # Encode the byte stream to base64
                img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
                images_base64.append(img_str)
                logger.debug(f"Converted page {i+1} to base64 PNG.")

            if len(images_base64) >= max_pages:
                 logger.warning(f"Reached maximum page limit ({max_pages}) for PDF conversion.")

        except Exception as e:
            logger.exception(f"Failed to convert PDF {os.path.basename(file_path)} to images: {e}")
            raise RuntimeError(f"Could not process PDF file: {e}")
            
        return images_base64

    def _build_llm_prompt(self, images_base64):
        """Builds the prompt payload for the LLM API."""
        
        # Construct the content list with text instructions and images
        content = [
            {
                "type": "text",
                "text": f"""\
Analyze the following CV images and extract the relevant information.
Return the information ONLY as a JSON object matching this exact structure:
```json
{json.dumps(EXPECTED_JSON_STRUCTURE, indent=2)}
```
- Ensure all field names and types match exactly.
- Extract information accurately from the text visible in the images.
- If a field is not found, use `null` or an empty string/list as appropriate based on the structure. For example, use `[]` for empty lists like skills, experience, education, certifications. Use `null` or "" for missing strings like linkedin_url or summary.
- Combine information seamlessly if it spans multiple pages.
- Do not add any extra text, explanations, or formatting outside the JSON object. Just return the JSON.
"""
            }
        ]
        
        # Add images to the content list
        # --- Modified to handle single image or list ---
        if isinstance(images_base64, list):
            # Original multi-image logic (might be used elsewhere later)
            for img_base64 in images_base64:
                content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{img_base64}"
                    }
                })
        elif isinstance(images_base64, str):
             # Logic for single image base64 string
             content.append({
                 "type": "image_url",
                 "image_url": {
                     "url": f"data:image/png;base64,{images_base64}"
                 }
             })
        # --- End Modification ---
            
        messages = [{"role": "user", "content": content}]
        return messages

    def _validate_llm_response(self, response_json):
        """Validates the structure of the JSON response from the LLM."""
        if not isinstance(response_json, dict):
            raise ValueError("LLM response is not a valid JSON object.")

        # Basic check for top-level keys (can be expanded for deeper validation)
        expected_keys = set(EXPECTED_JSON_STRUCTURE.keys())
        actual_keys = set(response_json.keys())

        if not expected_keys.issubset(actual_keys):
             missing_keys = expected_keys - actual_keys
             logger.warning(f"LLM response missing expected keys: {missing_keys}")
             # Decide if this is critical - perhaps fill missing keys with defaults?
             # For now, we'll allow it but log a warning.
             for key in missing_keys:
                 # Set default based on expected type
                 expected_type = type(EXPECTED_JSON_STRUCTURE[key])
                 if expected_type is list:
                     response_json[key] = []
                 else: # Assume string or allow null
                      response_json[key] = None 

        # Optional: Add more granular type checking for each field if needed
        # e.g., check if 'skills' is a list, 'experience' is a list of dicts, etc.

        return response_json

    def _merge_parsed_data(self, page_results):
        """Merges results from multiple pages into a single structured dictionary."""
        if not page_results:
            return None

        # Initialize with structure, using first page as a base for simple fields
        merged_data = page_results[0].copy() 
        # Ensure list fields are initialized if not present on first page
        for key, value in EXPECTED_JSON_STRUCTURE.items():
            if isinstance(value, list) and key not in merged_data:
                 merged_data[key] = []
            elif not isinstance(value, list) and key not in merged_data:
                 merged_data[key] = None

        # Iterate through subsequent pages (if any)
        for page_data in page_results[1:]:
            # Merge simple string fields (take first non-null/empty value found)
            for key in ["candidate_name", "email_address", "phone_number", "location", "linkedin_url", "summary"]:
                if not merged_data.get(key) and page_data.get(key):
                    merged_data[key] = page_data[key]
            
            # Concatenate list fields
            for key in ["skills", "experience", "education", "certifications"]:
                if key in page_data and isinstance(page_data[key], list):
                    if key not in merged_data or not isinstance(merged_data[key], list):
                         merged_data[key] = [] # Ensure it's a list
                    merged_data[key].extend(page_data[key])

        # --- Post-merge cleanup (optional but recommended) ---
        # Remove duplicates from simple lists like skills and certifications
        if isinstance(merged_data.get("skills"), list):
            merged_data["skills"] = sorted(list(set(merged_data["skills"])))
        if isinstance(merged_data.get("certifications"), list):
            merged_data["certifications"] = sorted(list(set(merged_data["certifications"])))
            
        # Consider adding duplicate removal logic for experience/education if needed,
        # but it's more complex (e.g., based on company+position or institution+degree)

        logger.info(f"Merged data from {len(page_results)} pages.")
        return merged_data
    
    def parse_cv(self, file_path):
        """Parses a CV file using an LLM API, processing pages sequentially."""
        logger.info(f"Starting LLM CV parsing for: {os.path.basename(file_path)}")
        
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == '.pdf':
            logger.info("Converting PDF to images...")
            images_base64 = self._convert_pdf_to_images(file_path)
        # Add elif for .docx here if implementing DOCX support later
        # elif file_ext in ['.doc', '.docx']:
        #     logger.error("DOC/DOCX parsing is not implemented yet.")
        #     raise NotImplementedError("DOC/DOCX parsing not supported.")
        else:
            logger.error(f"Unsupported file type: {file_ext}")
            raise ValueError(f"Unsupported file type for parsing: {file_ext}")

        if not images_base64:
            logger.error("No images could be extracted from the file.")
            raise ValueError("Failed to extract content from the file.")

        logger.info(f"Successfully converted {len(images_base64)} page(s) to images.")

        # --- Process pages sequentially --- 
        page_results = []
        for i, img_base64 in enumerate(images_base64):
            page_num = i + 1
            logger.info(f"Processing page {page_num}/{len(images_base64)}...")

            # Build the prompt for a single page
            # Adjust text prompt slightly if needed (e.g., "Analyze this page...")
            messages = self._build_llm_prompt(img_base64) # Pass single image string
            
            # Prepare API request data
            payload = {
                "model": LLM_MODEL,
                "messages": messages,
                "max_tokens": 4096, # Might need adjustment per page
                #"response_format": {"type": "json_object"}, 
            }
            
            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            }

            # Make the API call for the current page
            logger.info(f"Sending request to OpenRouter API for page {page_num}...")
            try:
                response = requests.post(
                    OPENROUTER_API_ENDPOINT, 
                    headers=headers, 
                    json=payload,
                    timeout=180 
                )
                response.raise_for_status()  

            except requests.exceptions.RequestException as e:
                error_message = str(e)
                response_text = ""
                status_code = None
                if hasattr(e, 'response') and e.response is not None:
                     status_code = e.response.status_code
                     try:
                         response_text = e.response.text
                         logger.error(f"API request failed for page {page_num} with status {status_code}. Response text: {response_text}")
                         error_message = f"{error_message}. Response: {response_text[:500]}..."
                     except Exception as read_err:
                         logger.error(f"Failed to read response text for page {page_num}: {read_err}")
                
                logger.exception(f"API request failed for page {page_num}: {error_message}")
                # Decide how to handle page failure: continue, break, raise immediately?
                # Option: Continue to try other pages, log the error
                logger.error(f"Skipping page {page_num} due to API error.")
                continue # Skip to the next page
                # Option: Raise immediately
                # raise ConnectionError(f"Failed to connect to CV parsing service for page {page_num}: {error_message}")
            except Exception as e:
                 logger.exception(f"An unexpected error occurred during the API call for page {page_num}: {e}")
                 logger.error(f"Skipping page {page_num} due to unexpected error.")
                 continue # Skip to the next page

            logger.info(f"Received response from API for page {page_num}.")

            # Process the response for the current page
            try:
                result = response.json()
                if settings.DEBUG and result.get("choices"):
                    logger.debug(f"Raw LLM response content for page {page_num}: {result['choices'][0].get('message', {}).get('content')}")

                if not result.get("choices") or not result["choices"][0].get("message"):
                     logger.error(f"Unexpected API response format for page {page_num}: {result}")
                     logger.error(f"Skipping page {page_num} due to invalid format.")
                     continue

                llm_output_content = result["choices"][0]["message"].get("content", "")
                if not llm_output_content:
                     logger.error(f"LLM returned empty content for page {page_num}.")
                     logger.error(f"Skipping page {page_num} due to empty content.")
                     continue

                # Clean the response
                cleaned_content = llm_output_content.strip()
                if cleaned_content.startswith("```json"):
                    cleaned_content = cleaned_content[7:]
                if cleaned_content.startswith("```"):
                     cleaned_content = cleaned_content[3:]
                if cleaned_content.endswith("```"):
                    cleaned_content = cleaned_content[:-3]
                cleaned_content = cleaned_content.strip()
                
                if not cleaned_content:
                    logger.error(f"Cleaned content is empty for page {page_num}.")
                    continue

                # Attempt to parse the cleaned content
                logger.debug(f"Attempting to parse cleaned content for page {page_num}: {cleaned_content[:100]}...")
                parsed_json = json.loads(cleaned_content)

                # Validate the structure for the current page
                logger.info(f"Validating LLM JSON response structure for page {page_num}.")
                validated_data = self._validate_llm_response(parsed_json) 
                page_results.append(validated_data) # Add successful page result

            except json.JSONDecodeError as e:
                logger.exception(f"Failed to decode JSON response from LLM for page {page_num}: {e}")
                logger.error(f"Raw content that failed parsing for page {page_num}: {llm_output_content}")
                logger.error(f"Skipping page {page_num} due to JSON decode error.")
                continue # Skip page
            except (KeyError, IndexError, TypeError) as e:
                 logger.exception(f"Error accessing data in API response for page {page_num}: {e}")
                 logger.error(f"Full API Response: {result}")
                 logger.error(f"Skipping page {page_num} due to response format error.")
                 continue # Skip page
            except ValueError as e: 
                 logger.error(f"LLM Response validation failed for page {page_num}: {e}")
                 logger.error(f"Skipping page {page_num} due to invalid structure.")
                 continue # Skip page
            except Exception as e:
                logger.exception(f"An unexpected error occurred processing the API response for page {page_num}: {e}")
                logger.error(f"Skipping page {page_num} due to processing error.")
                continue # Skip page
        # --- End Sequential Processing Loop --- 

        # Merge results from all successfully processed pages
        if not page_results:
             logger.error("No pages were successfully processed.")
             raise ValueError("Failed to extract any information from the CV pages.")

        logger.info(f"Merging results from {len(page_results)} successfully parsed pages.")
        merged_data = self._merge_parsed_data(page_results)
        
        if not merged_data:
             logger.error("Failed to merge page results.")
             raise RuntimeError("An error occurred while combining page information.")

        logger.info("CV parsing and merging successful.")
        return merged_data 