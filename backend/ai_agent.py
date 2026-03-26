# Simulated AI Agent Layer
import random

def analyze_ticket(title, description):
    """
    Mock AI classification for incoming tickets
    Normally this would call OpenAI or a local NLP model.
    """
    text = (title + " " + description).lower()
    
    # Priority prediction based on keywords
    if any(word in text for word in ['urgent', 'down', 'broken', 'emergency', 'crash']):
        priority = 'high'
    elif any(word in text for word in ['bug', 'error', 'issue']):
        priority = 'medium'
    else:
        priority = 'low'
        
    # Categorization based on keywords
    if 'billing' in text or 'refund' in text or 'charge' in text:
        category = 'Billing'
    elif 'login' in text or 'password' in text or 'account' in text:
        category = 'Account'
    else:
        category = 'General Support'
        
    return priority, category

def generate_smart_reply(ticket_description, chat_history=None):
    """
    Generates a smart reply suggestion for agents.
    """
    responses = [
        "Based on similar past tickets, resetting the router usually fixes this issue.",
        "I've initiated a partial refund as requested. Let me know if you need anything else.",
        "Our engineering team is currently looking into this bug. I will update you soon."
    ]
    return random.choice(responses)

def check_auto_resolve(title, description):
    """
    If the AI is highly confident (e.g. simple password reset request),
    it can return an auto-response.
    """
    text = (title + " " + description).lower()
    if 'how to reset password' in text:
        return True, "You can reset your password by going to the settings page and clicking 'Forgot Password'."
    return False, None
    
def summarize_conversation(chat_history):
    """
    Summarize long chat history into a brief TL;DR.
    """
    return "Customer reported a login issue. Guided them to clear cookies, which resolved the problem."
