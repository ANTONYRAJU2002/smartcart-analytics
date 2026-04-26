from app import create_app, db
from app.models import Category, SubCategory

app = create_app()
with app.app_context():
    print("Seeding computer hardware categories and subcategories...")
    
    # Categories and their subcategories based on user-requested counts
    structure = {
        "Computer Accessories": [
            "Mouse Pads", "Webcams", "USB Hubs", "Cooling Pads", "Laptop Bags"
        ],
        "Computer Components": [
            "Processors (CPUs)", "Motherboards", "RAM (Memory)", 
            "Graphics Cards (GPUs)", "Power Supplies (PSUs)", "Cabinets"
        ],
        "Desktop PCs": [
            "Gaming Desktops", "Business PCs", "All-in-One PCs", "Workstations"
        ],
        "Keyboards & Mouse": [
            "Gaming Keyboards", "Optical Mouse", "Wireless Combos"
        ],
        "Laptops": [
            "Gaming Laptops", "Ultrabooks", "Workstation Laptops"
        ],
        "Monitors": [
            "4K UHD Monitors", "Gaming Monitors", "Curved Displays", "Ultrawide Monitors"
        ],
        "Networking Devices": [
            "Routers", "Network Switches", "Wi-Fi Adapters", "Ethernet Cables"
        ],
        "Storage Devices": [
            "Internal SSDs", "External Hard Drives", "NAS Drives", "NVMe SSDs"
        ]
    }
    
    for cat_name, subcats in structure.items():
        # Check or create primary category
        category = Category.query.filter_by(name=cat_name).first()
        if not category:
            category = Category(name=cat_name)
            db.session.add(category)
            db.session.flush() # To get the ID
            print(f"Created category: {cat_name}")
        
        # Add subcategories
        for sub_name in subcats:
            if not SubCategory.query.filter_by(category_id=category.id, name=sub_name).first():
                db.session.add(SubCategory(name=sub_name, category_id=category.id))
                print(f"  Added subcategory: {sub_name}")
    
    db.session.commit()
    print("Categories and subcategories seeded successfully.")
