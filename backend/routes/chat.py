from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, decode_token
from flask_socketio import emit, join_room, leave_room
from models import Message, Ticket, User, db
from extensions import socketio
from services.ai_service import generate_ai_reply, analyze_sentiment
from . import chat_bp

# ----------------- HTTP ROUTES ----------------- #

@chat_bp.route('/<int:ticket_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(ticket_id):
    messages = Message.query.filter_by(ticket_id=ticket_id).order_by(Message.timestamp.asc()).all()
    return jsonify([{
        'id': m.id,
        'sender_id': m.sender_id,
        'sender_name': m.sender.name if m.sender else 'AI Assistant',
        'message': m.message,
        'is_ai': m.is_ai,
        'sentiment_score': m.sentiment_score,
        'timestamp': m.timestamp.isoformat()
    } for m in messages]), 200

@chat_bp.route('/<int:ticket_id>/suggest', methods=['GET'])
@jwt_required()
def suggest_reply(ticket_id):
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if user.role not in ['agent', 'admin']:
        return jsonify({'message': 'Unauthorized'}), 403
        
    ticket = Ticket.query.get_or_404(ticket_id)
    # Fetch recent conversation history
    messages = Message.query.filter_by(ticket_id=ticket_id).order_by(Message.timestamp.asc()).all()
    history = [f"{'Customer' if m.sender_id == ticket.user_id else 'Agent'}: {m.message}" for m in messages[-5:]]
    
    suggestion = generate_ai_reply(ticket.title, ticket.description, history)
    
    return jsonify({'suggestion': suggestion}), 200


# ----------------- WEBSOCKET ROUTES ----------------- #

@socketio.on('join_ticket')
def handle_join_ticket(data):
    # Data should contain ticket_id and token
    ticket_id = data.get('ticket_id')
    token = data.get('token')
    
    if not ticket_id or not token:
        return
        
    try:
        decoded = decode_token(token)
        user_id = decoded['sub']
    except Exception as e:
        return # Invalid token
        
    room = f"ticket_{ticket_id}"
    join_room(room)
    emit('status', {'msg': f"User {user_id} has entered the room."}, room=room)


@socketio.on('send_message')
def handle_send_message(data):
    ticket_id = data.get('ticket_id')
    token = data.get('token')
    message_text = data.get('message')
    
    if not ticket_id or not token or not message_text:
        return
        
    try:
        decoded = decode_token(token)
        user_id = decoded['sub']
    except Exception:
        return # Invalid token
        
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return
        
    sentiment = analyze_sentiment(message_text)
        
    new_message = Message(
        ticket_id=ticket_id,
        sender_id=int(user_id),
        message=message_text,
        is_ai=False,
        sentiment_score=sentiment
    )
    
    db.session.add(new_message)
    db.session.commit()
    
    room = f"ticket_{ticket_id}"
    sender = User.query.get(int(user_id))
    
    emit('new_message', {
        'id': new_message.id,
        'sender_id': new_message.sender_id,
        'sender_name': sender.name,
        'message': new_message.message,
        'is_ai': new_message.is_ai,
        'sentiment_score': sentiment,
        'timestamp': new_message.timestamp.isoformat()
    }, room=room)
