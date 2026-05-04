import os
import google.generativeai as genai
from app.models import TicketMessage, SupportTicket
from datetime import datetime

# Keep track of configuration state
_is_configured = False

def configure_genai():
    global _is_configured
    if not _is_configured:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key or not str(api_key).strip():
            api_key = os.environ.get("GEMINI_API_KEY", "AIzaSyAvWXsAU3j_L5fSkB1pfkSeVABDM8J-XCA") # Recommended: Use env var
            
        genai.configure(api_key=api_key)
        _is_configured = True
    return True

def generate_support_reply(ticket_id):
    """
    Generates an AI reply for a given SupportTicket based on its message history.
    It returns the generated message string, or None if the AI decides not to reply
    or if an error occurs.
    """
    if not configure_genai():
        return None

    # Retrieve the ticket and its messages
    ticket = SupportTicket.query.get(ticket_id)
    if not ticket:
        return None

    # Get chronological message history
    messages = ticket.messages.order_by(TicketMessage.created_at.asc()).all()
    
    # Building conversation history for Gemini
    history = []
    for msg in messages:
        # Check if message is from the user (ticket owner)
        role = "user" if msg.sender_id == ticket.user_id else ("model" if msg.message.startswith("[AI Support]") else "model")
        
        # Clean up the message if it has prefix
        clean_msg = msg.message
        if clean_msg.startswith("[AI Support]"):
            clean_msg = clean_msg.replace("[AI Support]", "").strip()
        elif clean_msg.startswith("[SYSTEM]"):
            clean_msg = clean_msg.replace("[SYSTEM]", "").strip()
            
        history.append({
            "role": role,
            "parts": [clean_msg]
        })

    # System prompt to define the AI persona
    system_instruction = (
        "You are an AI Customer Support Assistant for SmartCart, an e-commerce platform. "
        "Your goal is to provide polite, helpful, and concise answers to customer inquiries. "
        "For 'General Question' inquiries, attempt to answer based on common e-commerce policies. "
        "For 'Refund Request' or 'Complaint', offer a sympathetic and helpful response acknowledging "
        "the issue and stating that a human staff member will review their specific case shortly. "
        "Do not invent facts about specific orders unless they are provided in the context."
    )

    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_instruction
        )
        
        # We need to start a chat with the history up to the last message, 
        # but the last message is from the user, so we take history[:-1] for context, 
        # and send the last message text as the prompt?
        # Actually `history` format allows creating a ChatSession.
        
        if len(history) == 0:
            return None
            
        # The last message is what we are responding to
        last_message_text = history[-1]["parts"][0]
        
        previous_history = history[:-1] if len(history) > 1 else []
        chat = model.start_chat(history=previous_history)
        
        try:
            response = chat.send_message(last_message_text)
            return response.text.strip()
        except Exception as e:
            # Fallback to gemini-pro if 2.0-flash fails
            print(f"Gemini 2.0-flash failed, trying gemini-pro: {e}")
            model_fallback = genai.GenerativeModel("gemini-pro")
            chat_fallback = model_fallback.start_chat(history=previous_history)
            response = chat_fallback.send_message(last_message_text)
            return response.text.strip()
        
    except Exception as e:
        import sys
        err_msg = str(e)
        if "429" in err_msg or "quota" in err_msg.lower():
            print(f"Gemini Quota Exhausted: {err_msg}", file=sys.stderr)
            return "QUOTA_EXHAUSTED"
        print(f"Error generating Gemini response: {e}", file=sys.stderr)
        return None

def generate_stateless_reply(history_array, new_message):
    """
    Generates a stateless AI reply using history directly from the frontend.
    history_array: [{'role': 'user'|'model', 'parts': ['msg']}, ...]
    new_message: string
    """
    if not configure_genai():
        return None

    system_instruction = (
        "You are the SmartCart AI Assistant, a helpful customer support bot for an electronics e-commerce site. "
        "Keep your responses concise, friendly, and helpful. "
        "If they need account specific help, tell them to open a Support Ticket or contact support@smartcart.com."
    )

    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_instruction
        )
        
        # history_array excludes the latest message being sent
        chat = model.start_chat(history=history_array)
        response = chat.send_message(new_message)
        
        return response.text.strip()
    except Exception as e:
        err_msg = str(e)
        if "429" in err_msg or "quota" in err_msg.lower():
            print(f"Stateless Gemini Quota Exhausted: {err_msg}")
            return "QUOTA_EXHAUSTED"
        print(f"Error generating stateless Gemini response: {e}")
        return None
