import google.generativeai as genai
import os

genai.configure(api_key=os.environ.get("GOOGLE_GEMINI_API_KEY", "AIzaSyBUEqQKp8pAUPpB7ycjo6yf_6k1a-dnp2k"))
for m in genai.list_models():
    print(m.name, m.supported_generation_methods)
