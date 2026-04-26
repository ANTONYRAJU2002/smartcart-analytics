import os
import google.generativeai as genai
import sys

def test_ai():
    api_key = "AIzaSyAuFDoSFMkxylsvpzO10QKHlhFhyeL4gec"
    try:
        print(f"Configuring GenAI with key: {api_key[:10]}...")
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        print("Sending message 'Hello'...")
        response = model.generate_content("Hello")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_ai()
