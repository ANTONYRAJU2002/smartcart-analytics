import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

try:
    from fpdf import FPDF
except ImportError:
    print("Installing fpdf2...")
    os.system(f"{sys.executable} -m pip install fpdf2")
    from fpdf import FPDF

from app import create_app, db
from app.models import Product

def safe_text(text):
    if not text:
        return "N/A"
    return text.encode('latin-1', 'replace').decode('latin-1')

def generate():
    app = create_app()
    with app.app_context():
        products = Product.query.order_by(Product.category, Product.sub_category).all()
        
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        
        pdf.set_font("helvetica", "B", 16)
        pdf.cell(0, 10, "SmartCart Product Dataset", ln=True, align='C')
        pdf.ln(10)
        
        pdf.set_font("helvetica", "B", 12)
        pdf.cell(0, 10, f"Total Products: {len(products)}", ln=True)
        pdf.ln(5)
        
        for p in products:
            pdf.set_font("helvetica", "B", 11)
            pdf.cell(0, 8, safe_text(f"Name: {p.name}"), ln=True)
            
            pdf.set_font("helvetica", "", 10)
            brand = safe_text(p.brand) if p.brand else "Unknown"
            pdf.cell(0, 6, safe_text(f"Company/Brand: {brand}    |    Price: Rs. {p.price}"), ln=True)
            pdf.cell(0, 6, safe_text(f"Category: {p.category}    |    Sub-category: {p.sub_category}"), ln=True)
            
            pdf.set_font("helvetica", "I", 9)
            description = p.description if p.description else "No description provided."
            pdf.multi_cell(0, 5, safe_text(f"Description: {description}"))
            pdf.ln(5)
            
        output_path = r"c:\Users\anton\OneDrive\Desktop\smart\Product_Dataset.pdf"
        pdf.output(output_path)
        print(f"Successfully created PDF at {output_path}")

if __name__ == '__main__':
    generate()
