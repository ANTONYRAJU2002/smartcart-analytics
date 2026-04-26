from app import create_app, db
from app.models import SupportTicket, TicketMessage
app = create_app()
with app.app_context():
    tickets = SupportTicket.query.order_by(SupportTicket.id.desc()).all()
    for t in tickets:
        messages = TicketMessage.query.filter_by(ticket_id=t.id).order_by(TicketMessage.created_at.asc()).all()
        has_ai = any(m.sender_id is None for m in messages)
        print(f"Ticket ID: {t.id}, Subject: {t.subject}, Status: {t.status}, Has AI: {has_ai}")
        if has_ai:
            for m in messages:
                sender = m.sender.username if m.sender else "AI Support"
                print(f"  [{sender}] {m.message[:100]}...")
