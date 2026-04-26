import csv
import xml.etree.ElementTree as ET
from xml.dom import minidom
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from app import create_app, db
from app.models import Product

def create_product_datasets():
    app = create_app()
    with app.app_context():
        products = Product.query.order_by(Product.category, Product.sub_category).all()
        
        # 1. Create CSV
        csv_path = r"c:\Users\anton\OneDrive\Desktop\smart\Product_Dataset.csv"
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Name', 'Description', 'Category', 'Sub-category', 'Price', 'Company Name'])
            for p in products:
                writer.writerow([
                    p.name,
                    p.description if p.description else '',
                    p.category,
                    p.sub_category,
                    p.price,
                    p.brand if p.brand else 'Unknown'
                ])
                
        # 2. Create XML
        xml_path = r"c:\Users\anton\OneDrive\Desktop\smart\Product_Dataset.xml"
        root = ET.Element("Products")
        
        for p in products:
            prod_element = ET.SubElement(root, "Product")
            
            name_el = ET.SubElement(prod_element, "Name")
            name_el.text = str(p.name)
            
            desc_el = ET.SubElement(prod_element, "Description")
            desc_el.text = str(p.description if p.description else '')
            
            cat_el = ET.SubElement(prod_element, "Category")
            cat_el.text = str(p.category)
            
            sub_cat_el = ET.SubElement(prod_element, "SubCategory")
            sub_cat_el.text = str(p.sub_category)
            
            price_el = ET.SubElement(prod_element, "Price")
            price_el.text = str(p.price)
            
            brand_el = ET.SubElement(prod_element, "CompanyName")
            brand_el.text = str(p.brand if p.brand else 'Unknown')
            
        # Pretty print XML
        xml_str = minidom.parseString(ET.tostring(root, encoding='utf-8')).toprettyxml(indent="    ")
        with open(xml_path, 'w', encoding='utf-8') as f:
            f.write(xml_str)
            
        print(f"Created {csv_path}")
        print(f"Created {xml_path}")

if __name__ == '__main__':
    create_product_datasets()
