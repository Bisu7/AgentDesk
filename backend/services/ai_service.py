import os
import random
from openai import OpenAI

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

def run_ai_completion(messages, sys_prompt="You are a helpful customer support AI."):
    if not client.api_key:
        return None
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": sys_prompt},
                *messages
            ],
            max_tokens=250,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"AI Service Error: {e}")
        return None


def generate_ai_reply(ticket_title, ticket_desc, history):
    """Generates a suggested reply for the agent to send to the customer"""
    if not client.api_key:
        return "[Mocked AI Suggestion] Based on this issue, I recommend asking the user to provide their account number and explaining the standard procedure."
        
    messages = [
        {"role": "user", "content": f"Ticket Title: {ticket_title}\nDescription: {ticket_desc}\n\nRecent History:\n" + "\n".join(history) + "\n\nSuggest a polite, helpful reply from the Agent to the Customer:"}
    ]
    reply = run_ai_completion(messages, "You are an expert customer support agent assistant. Your goal is to draft exact replies that an agent can send.")
    return reply or "I'm sorry, I couldn't generate a suggestion at this time."

def analyze_sentiment(message_text):
    """Analyzes sentiment of a message. Returns a score from -1.0 (negative) to 1.0 (positive)"""
    if not client.api_key:
        # mock random sentiment around neutral
        return round(random.uniform(-0.5, 0.5), 2)
        
    prompt = f"Analyze the sentiment of the following customer message and return ONLY a float number from -1.0 to 1.0 where -1.0 is extremely angry/negative and 1.0 is highly positive/happy.\n\nMessage: '{message_text}'"
    messages = [{"role": "user", "content": prompt}]
    result = run_ai_completion(messages)
    
    try:
        return float(result)
    except:
        return 0.0

def classify_ticket(title, description):
    """Automatically classifies a new ticket and estimates priority"""
    if not client.api_key:
        return {"category": "General", "priority": "medium", "confidence": 0.5}
        
    sys_prompt = "You are an AI Ticket router. Return JSON format strictly with keys 'category' (string), 'priority' (string: low, medium, high, critical), and 'confidence' (float 0.0-1.0)."
    messages = [
        {"role": "user", "content": f"Title: {title}\nDescription: {description}"}
    ]
    
    # Needs basic json parsing
    import json
    res = run_ai_completion(messages, sys_prompt)
    try:
        data = json.loads(res)
        return data
    except:
        return {"category": "General", "priority": "medium", "confidence": 0.0}
