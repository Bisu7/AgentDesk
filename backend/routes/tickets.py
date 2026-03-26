from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Ticket, Category, User, TicketAudit, db
from . import tickets_bp
from datetime import datetime, timedelta

@tickets_bp.route('/', methods=['POST'])
@jwt_required()
def create_ticket():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('title') or not data.get('description'):
        return jsonify({'message': 'Title and description required'}), 400
    
    category = None
    if data.get('category'):
        category = Category.query.filter_by(name=data['category']).first()
        if not category:
            category = Category(name=data['category'])
            db.session.add(category)
            db.session.commit()
            
    # Default SLA (e.g. 24 hours for normal tickets, 4 hours for high priority)
    priority = data.get('priority', 'medium')
    sla_hours = 4 if priority == 'high' or priority == 'critical' else 24
    sla_deadline = datetime.utcnow() + timedelta(hours=sla_hours)
            
    new_ticket = Ticket(
        title=data['title'],
        description=data['description'],
        user_id=int(user_id),
        category_id=category.id if category else None,
        priority=priority,
        status='open',
        sla_deadline=sla_deadline
    )
    db.session.add(new_ticket)
    db.session.commit()
    
    # Audit trail
    audit = TicketAudit(ticket_id=new_ticket.id, action='created', changed_by_id=int(user_id))
    db.session.add(audit)
    db.session.commit()
    
    from services.ai_service import classify_ticket
    import threading
    
    def process_ai_classification(ticket_id, title, desc):
        with db.app.app_context():
            ticket = Ticket.query.get(ticket_id)
            if not ticket:
                return
            
            ai_data = classify_ticket(title, desc)
            ticket.priority = ai_data.get('priority', 'medium')
            ticket.ai_priority_score = ai_data.get('confidence', 0.5)
            
            cat_name = ai_data.get('category', 'General')
            cat = Category.query.filter_by(name=cat_name).first()
            if not cat:
                cat = Category(name=cat_name)
                db.session.add(cat)
                db.session.commit()
            
            ticket.category_id = cat.id
            db.session.commit()
            
            # Additional logic: if priority is critical, auto-escalate
            if ticket.priority == 'critical':
                ticket.is_escalated = True
                db.session.commit()
                
    # Run AI Classification in background
    threading.Thread(target=process_ai_classification, args=(new_ticket.id, new_ticket.title, new_ticket.description)).start()
    
    return jsonify({
        'message': 'Ticket created successfully', 
        'ticket': {
            'id': new_ticket.id,
            'title': new_ticket.title,
            'status': new_ticket.status,
            'priority': new_ticket.priority,
            'created_at': new_ticket.created_at.isoformat()
        }
    }), 201

@tickets_bp.route('/', methods=['GET'])
@jwt_required()
def get_tickets():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    role = user.role
    
    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Filtering
    status = request.args.get('status')
    priority = request.args.get('priority')
    search = request.args.get('search')
    
    query = Ticket.query
    
    if role == 'customer':
        query = query.filter_by(user_id=int(user_id))
    elif role == 'agent':
        query = query.filter_by(agent_id=int(user_id))
    # admin sees all

    if status:
        query = query.filter_by(status=status)
    if priority:
        query = query.filter_by(priority=priority)
    if search:
        query = query.filter(Ticket.title.ilike(f'%{search}%') | Ticket.description.ilike(f'%{search}%'))
        
    # Sorting
    query = query.order_by(Ticket.created_at.desc())
        
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    tickets = pagination.items
        
    return jsonify({
        'tickets': [{
            'id': t.id,
            'title': t.title,
            'status': t.status,
            'priority': t.priority,
            'created_at': t.created_at.isoformat(),
            'sla_deadline': t.sla_deadline.isoformat() if t.sla_deadline else None,
            'category': t.category.name if t.category else None,
            'user_id': t.user_id,
            'agent_id': t.agent_id
        } for t in tickets],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200

@tickets_bp.route('/<int:ticket_id>', methods=['GET'])
@jwt_required()
def get_ticket(ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    return jsonify({
        'id': ticket.id,
        'title': ticket.title,
        'description': ticket.description,
        'status': ticket.status,
        'priority': ticket.priority,
        'created_at': ticket.created_at.isoformat(),
        'sla_deadline': ticket.sla_deadline.isoformat() if ticket.sla_deadline else None,
        'resolved_at': ticket.resolved_at.isoformat() if ticket.resolved_at else None,
        'category': ticket.category.name if ticket.category else None,
        'user_id': ticket.user_id,
        'user_name': ticket.user.name,
        'agent_id': ticket.agent_id,
        'agent_name': ticket.agent.name if ticket.agent else None
    }), 200

@tickets_bp.route('/<int:ticket_id>', methods=['PUT'])
@jwt_required()
def update_ticket(ticket_id):
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user or user.role not in ['agent', 'admin']:
        return jsonify({'message': 'Unauthorized'}), 403
        
    data = request.get_json()
    ticket = Ticket.query.get_or_404(ticket_id)
    
    old_status = ticket.status
    if 'status' in data and data['status'] in ['open', 'in-progress', 'resolved', 'closed']:
        ticket.status = data['status']
        if ticket.status == 'resolved' and old_status != 'resolved':
            ticket.resolved_at = datetime.utcnow()
            
    if 'priority' in data:
        ticket.priority = data['priority']
        
    if 'agent_id' in data:
        agent = User.query.get(data['agent_id'])
        if agent and agent.role in ['agent', 'admin']:
            ticket.agent_id = agent.id
            audit = TicketAudit(ticket_id=ticket.id, action=f'assigned_to_{agent.id}', changed_by_id=int(user_id))
            db.session.add(audit)
            
    db.session.commit()
    
    if ticket.status != old_status:
        audit = TicketAudit(ticket_id=ticket.id, action=f'status_changed_to_{ticket.status}', changed_by_id=int(user_id))
        db.session.add(audit)
        db.session.commit()
        
    return jsonify({
        'message': 'Ticket updated successfully',
        'status': ticket.status,
        'priority': ticket.priority,
        'agent_id': ticket.agent_id
    })
