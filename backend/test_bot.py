import os
import google.generativeai as genai
from app.chatbot import configure_genai, generate_stateless_reply

def test():
    print("Testing generate_stateless_reply...")
    try:
        reply = generate_stateless_reply([], "Hello, what lap is best?")
        print(f"Reply: {reply}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test()
