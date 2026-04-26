"""
Restore the 3 original products that were accidentally deleted.
This script ADDS products without deleting existing ones.
"""
from app import create_app, db
from app.models import Product

app = create_app()

ORIGINAL_PRODUCTS = [
    {
        "name": "Predator Helios 300",
        "category": "Laptops",
        "sub_category": "Gaming Laptops",
        "price": 139900.0,
        "mrp": 164900.0,
        "cost_price": 110000.0,
        "stock": 25,
        "sku": "LAP-PH300",
        "description": "Acer Predator Helios 300 Gaming Laptop with Intel i7, RTX 3060, 16GB RAM, 512GB SSD, 144Hz IPS display.",
        "image_url": "/static/uploads/products/gaming_desktops_subcategory_1775133166408_1775133131734.png",
        "brand": "Acer",
        "model_number": "PH315-55",
        "status": "active",
        "specifications": {"Processor": "Intel i7-12700H", "GPU": "RTX 3060 6GB", "RAM": "16GB DDR5", "Storage": "512GB NVMe SSD", "Display": "15.6 inch 144Hz IPS"},
        "warranty": "2 Years Manufacturer Warranty"
    },
    {
        "name": 'Samsung Odyssey G7 32"',
        "category": "Monitors",
        "sub_category": "Gaming Monitors",
        "price": 69999.0,
        "mrp": 84999.0,
        "cost_price": 45000.0,
        "stock": 40,
        "sku": "MON-OG732",
        "description": "Samsung Odyssey G7 32-inch WQHD curved gaming monitor with 240Hz refresh rate and 1ms response time.",
        "image_url": "/static/uploads/products/aio_pcs_subcategory_1775133206408_1775133163840.png",
        "brand": "Samsung",
        "model_number": "LC32G75T",
        "status": "active",
        "specifications": {"Size": "32 inch", "Resolution": "2560x1440 WQHD", "Refresh Rate": "240Hz", "Panel": "VA Curved 1000R", "Response": "1ms GTG"},
        "warranty": "3 Years Manufacturer Warranty"
    },
    {
        "name": "RTX 4080 Super",
        "category": "Computer Components",
        "sub_category": "Graphics Cards (GPUs)",
        "price": 129999.0,
        "mrp": 149999.0,
        "cost_price": 80000.0,
        "stock": 15,
        "sku": "GPU-4080S",
        "description": "NVIDIA GeForce RTX 4080 Super with 16GB GDDR6X, DLSS 3.0, and ray tracing for ultimate 4K gaming.",
        "image_url": "/static/uploads/products/gpus_subcategory_1775133096408_1775133077006.png",
        "brand": "NVIDIA",
        "model_number": "RTX4080S-16G",
        "status": "active",
        "specifications": {"VRAM": "16GB GDDR6X", "CUDA Cores": "10240", "Boost Clock": "2550 MHz", "TDP": "320W", "DLSS": "3.0 with Frame Generation"},
        "warranty": "3 Years Manufacturer Warranty"
    }
]

with app.app_context():
    restored = 0
    for pdata in ORIGINAL_PRODUCTS:
        existing = Product.query.filter_by(name=pdata["name"]).first()
        if existing:
            print(f"  Already exists: {pdata['name']}")
        else:
            p = Product(**pdata)
            db.session.add(p)
            restored += 1
            print(f"  Restored: {pdata['name']}")
    
    db.session.commit()
    total = Product.query.count()
    print(f"\nRestored {restored} original products. Total products now: {total}")
