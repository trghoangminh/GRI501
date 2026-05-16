import google.generativeai as genai
import os

genai.configure(api_key=os.environ.get("GOOGLE_GEMINI_API_KEY", ""))
for m in genai.list_models():
    print(m.name, m.supported_generation_methods)
