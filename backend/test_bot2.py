import os
import google.generativeai as genai

api_key = "AIzaSyAuFDoSFMkxylsvpzO10QKHlhFhyeL4gec"
genai.configure(api_key=api_key)

available_models = []
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        available_models.append(m.name)

from pprint import pprint
pprint(available_models)
