import os
import google.generativeai as genai

def list_models():
    api_key = "AIzaSyAvWXsAU3j_L5fSkB1pfkSeVABDM8J-XCA"
    try:
        genai.configure(api_key=api_key)
        print("Supported Models:")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(m.name)
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    list_models()
