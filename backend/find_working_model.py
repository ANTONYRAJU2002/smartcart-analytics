
import google.generativeai as genai
import os

def test_models():
    api_key = "AIzaSyAvWXsAU3j_L5fSkB1pfkSeVABDM8J-XCA"
    genai.configure(api_key=api_key)
    
    models_to_try = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-pro",
        "gemini-1.0-pro"
    ]
    
    for model_name in models_to_try:
        try:
            print(f"Testing model: {model_name}...")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Hi")
            print(f"SUCCESS with {model_name}: {response.text}")
            return
        except Exception as e:
            print(f"FAILED with {model_name}: {e}")

if __name__ == "__main__":
    test_models()
