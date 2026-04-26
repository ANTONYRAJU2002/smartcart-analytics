import sys
import os
from app import create_app
from app.chatbot import generate_support_reply

def run_diag(tid):
    app = create_app()
    with app.app_context():
        try:
            from app.models import SupportTicket
            all_tickets = SupportTicket.query.order_by(SupportTicket.id.desc()).all()
            print(f"DIAG: All Ticket IDs: {[t.id for t in all_tickets]}")
            ticket = SupportTicket.query.get(tid)
            if not ticket:
                print(f"DIAG: Ticket {tid} NOT FOUND in DB!")
                return
            
            print(f"DIAG: Found Ticket {tid}: {ticket.subject}")
            from app.chatbot import generate_support_reply
            reply = generate_support_reply(tid)
            print(f"DIAG: Result was: {reply}")
        except Exception as e:
            print(f"DIAG: Outer Exception: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    tid = int(sys.argv[1]) if len(sys.argv) > 1 else 41
    run_diag(tid)
