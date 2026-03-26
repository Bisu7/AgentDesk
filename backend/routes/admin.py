from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from models import Ticket, User, TicketAudit, db
from . import admin_bp

@admin_bp.before_request
@jwt_required()
def require_admin():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user or user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403

@admin_bp.route('/analytics', methods=['GET'])
def get_analytics():
    total_tickets = Ticket.query.count()
    open_tickets = Ticket.query.filter_by(status='open').count()
    resolved_tickets = Ticket.query.filter_by(status='resolved').count()
    escalated_tickets = Ticket.query.filter_by(is_escalated=True).count()
    
    # Calculate average resolution time
    resolved_query = Ticket.query.filter(Ticket.status == 'resolved', Ticket.resolved_at != None).all()
    if resolved_query:
        total_seconds = sum((t.resolved_at - t.created_at).total_seconds() for t in resolved_query)
        avg_seconds = total_seconds / len(resolved_query)
        hours = int(avg_seconds // 3600)
        minutes = int((avg_seconds % 3600) // 60)
        avg_resolution_time = f"{hours}h {minutes}m"
    else:
        avg_resolution_time = "N/A"
    
    return jsonify({
        'total_tickets': total_tickets,
        'open_tickets': open_tickets,
        'resolved_tickets': resolved_tickets,
        'escalated_tickets': escalated_tickets,
        'avg_resolution_time': avg_resolution_time
    }), 200

@admin_bp.route('/agents', methods=['GET'])
def get_agents():
    agents = User.query.filter_by(role='agent').all()
    
    results = []
    for a in agents:
        assigned = Ticket.query.filter_by(agent_id=a.id, status='open').count()
        resolved = Ticket.query.filter_by(agent_id=a.id, status='resolved').count()
        results.append({
            'id': a.id,
            'name': a.name,
            'email': a.email,
            'department': a.department,
            'performance_score': a.performance_score,
            'is_active': a.is_active,
            'active_tickets': assigned,
            'resolved_tickets': resolved
        })
        
    return jsonify(results), 200

@admin_bp.route('/assign-ticket', methods=['POST'])
def assign_ticket():
    data = request.get_json()
    ticket_id = data.get('ticket_id')
    agent_id = data.get('agent_id')
    
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({'message': 'Ticket not found'}), 404
         
    agent = User.query.get(agent_id)
    if not agent or agent.role not in ['agent', 'admin']:
        return jsonify({'message': 'Invalid Agent'}), 400
         
    ticket.agent_id = agent_id
    
    current_user_id = get_jwt_identity()
    audit = TicketAudit(ticket_id=ticket.id, action=f'assigned_to_{agent.id}', changed_by_id=int(current_user_id))
    db.session.add(audit)
    
    db.session.commit()
    
    return jsonify({'message': 'Ticket assigned successfully'}), 200

@admin_bp.route('/auto-route', methods=['POST'])
def auto_route():
    """Smart routing: Assigns open tickets to the best agent based on workload and department."""
    data = request.get_json()
    ticket_id = data.get('ticket_id')
    
    ticket = Ticket.query.get(ticket_id)
    if not ticket or ticket.agent_id:
        return jsonify({'message': 'Ticket not found or already assigned'}), 400
        
    # Find agents with least active tickets
    agents = User.query.filter_by(role='agent', is_active=True).all()
    if not agents:
        return jsonify({'message': 'No active agents available'}), 404
        
    # Basic scoring: pick the one with fewest open tickets
    best_agent = None
    min_workload = float('inf')
    
    for a in agents:
        # if category matches department, give priority. Simplified here:
        workload = Ticket.query.filter_by(agent_id=a.id, status='open').count()
        if workload < min_workload:
            min_workload = workload
            best_agent = a
            
    ticket.agent_id = best_agent.id
    
    current_user_id = get_jwt_identity()
    audit = TicketAudit(ticket_id=ticket.id, action=f'auto_assigned_to_{best_agent.id}', changed_by_id=int(current_user_id))
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({'message': f'Ticket intelligently routed to {best_agent.name}', 'agent_id': best_agent.id}), 200
