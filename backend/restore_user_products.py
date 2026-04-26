"""
Restore ALL user-uploaded products that were accidentally deleted.
Reconstructed from uploaded images in static/uploads/.
This script ADDS products without deleting existing ones.
"""
from app import create_app, db
from app.models import Product

app = create_app()

# Products reconstructed from user-uploaded images
USER_PRODUCTS = [
    # LAPTOPS
    {
        "name": "MSI Katana 15 Gaming Laptop",
        "category": "Laptops", "sub_category": "Gaming Laptops",
        "price": 94990, "mrp": 109990, "cost_price": 75000,
        "stock": 20, "sku": "LAP-MSI-K15", "brand": "MSI",
        "description": "MSI Katana 15 with Intel Core i9, NVIDIA GeForce RTX, 144Hz display, per-key RGB keyboard.",
        "image_url": "/static/uploads/a3ea523b60794a80949be9adaf2fb26e_MSI.jpg",
        "model_number": "Katana-15-B13V", "status": "active",
        "specifications": {"Processor": "Intel Core i9-13th Gen", "GPU": "NVIDIA GeForce RTX", "Display": "15.6 inch 144Hz", "RAM": "16GB DDR5"},
        "warranty": "2 Years MSI Warranty"
    },
    {
        "name": "HP Pavilion 15 Laptop",
        "category": "Laptops", "sub_category": "Ultrabooks",
        "price": 54990, "mrp": 64990, "cost_price": 42000,
        "stock": 30, "sku": "LAP-HP-PAV15", "brand": "HP",
        "description": "HP Pavilion 15 with AMD Ryzen 5 5000 Series, slim design, silver finish.",
        "image_url": "/static/uploads/ff99256800d340d8ab3fb0fc2e3f8723_HP.jpg",
        "model_number": "Pavilion-15-eh2024", "status": "active",
        "specifications": {"Processor": "AMD Ryzen 5 5625U", "RAM": "8GB DDR4", "Storage": "512GB SSD", "Display": "15.6 inch FHD IPS"},
        "warranty": "1 Year HP Warranty"
    },
    {
        "name": "ASUS Vivobook 15",
        "category": "Laptops", "sub_category": "Ultrabooks",
        "price": 45990, "mrp": 55990, "cost_price": 35000,
        "stock": 35, "sku": "LAP-ASUS-VB15", "brand": "ASUS",
        "description": "ASUS Vivobook 15 with vibrant OLED display, thin and light design.",
        "image_url": "/static/uploads/dbc3ac4585534d5cb5a1cb50104b60c2_VIVO.png",
        "model_number": "X1502ZA", "status": "active",
        "specifications": {"Processor": "Intel Core i5-12th Gen", "Display": "15.6 inch FHD", "Weight": "1.7kg", "Battery": "50Wh"},
        "warranty": "1 Year ASUS Warranty"
    },
    {
        "name": "ASUS ROG Strix G16",
        "category": "Laptops", "sub_category": "Gaming Laptops",
        "price": 164990, "mrp": 189990, "cost_price": 130000,
        "stock": 10, "sku": "LAP-ROG-G16", "brand": "ASUS",
        "description": "ASUS ROG Strix G16 with per-key RGB, ROG Strix branding, high-refresh gaming display.",
        "image_url": "/static/uploads/ffa248f0dfa5422abdb4a35995e82914_asus.webp",
        "model_number": "G614JV", "status": "active",
        "specifications": {"Processor": "Intel Core i9-13980HX", "GPU": "RTX 4060 8GB", "RAM": "16GB DDR5", "Display": "16 inch 240Hz"},
        "warranty": "2 Years ASUS ROG Warranty"
    },
    {
        "name": "Acer Predator Helios Neo AI Laptop",
        "category": "Laptops", "sub_category": "Gaming Laptops",
        "price": 129990, "mrp": 149990, "cost_price": 100000,
        "stock": 15, "sku": "LAP-PRED-NEO", "brand": "Acer",
        "description": "Acer Predator AI Laptop with Windows 11, Intel Core i7, NVIDIA GeForce RTX, RGB keyboard.",
        "image_url": "/static/uploads/edf8f38dbb0e438eafcaae054ace78f3_AA.jpg",
        "model_number": "PHN16-72", "status": "active",
        "specifications": {"Processor": "Intel Core i7-14th Gen", "GPU": "NVIDIA GeForce RTX", "OS": "Windows 11 Home", "Display": "16 inch 165Hz"},
        "warranty": "2 Years Acer Warranty"
    },
    {
        "name": "Dell Inspiron 15",
        "category": "Laptops", "sub_category": "Ultrabooks",
        "price": 42990, "mrp": 52990, "cost_price": 33000,
        "stock": 25, "sku": "LAP-DELL-I15", "brand": "Dell",
        "description": "Dell Inspiron 15 everyday laptop for students and professionals.",
        "image_url": "/static/uploads/6c13d816a4834c9a9ba1ba2df70ab4ab_Screenshot_2026-03-07_184730.png",
        "model_number": "Inspiron-3520", "status": "active",
        "specifications": {"Processor": "Intel Core i5", "RAM": "8GB", "Storage": "512GB SSD", "Display": "15.6 inch FHD"},
        "warranty": "1 Year Dell Warranty"
    },
    {
        "name": "Dell Latitude 5440",
        "category": "Laptops", "sub_category": "Workstation Laptops",
        "price": 89990, "mrp": 104990, "cost_price": 70000,
        "stock": 12, "sku": "LAP-DELL-L54", "brand": "Dell",
        "description": "Dell Latitude 5440 business laptop with robust build quality.",
        "image_url": "/static/uploads/5b5bd5117ef64bf694ffb3d41079526d_Screenshot_2026-03-07_185111.png",
        "model_number": "Latitude-5440", "status": "active",
        "specifications": {"Processor": "Intel Core i7-13th Gen", "RAM": "16GB", "Security": "TPM 2.0", "Display": "14 inch FHD"},
        "warranty": "3 Years Dell ProSupport"
    },
    {
        "name": "HP EliteBook 840 G9",
        "category": "Laptops", "sub_category": "Workstation Laptops",
        "price": 79990, "mrp": 94990, "cost_price": 62000,
        "stock": 18, "sku": "LAP-HP-EB840", "brand": "HP",
        "description": "HP EliteBook 840 G9 premium business ultrabook with sleek silver design.",
        "image_url": "/static/uploads/15938c5205914045aa25653054338e57_Screenshot_2026-03-07_185445.png",
        "model_number": "EliteBook-840-G9", "status": "active",
        "specifications": {"Processor": "Intel Core i7-12th Gen", "RAM": "16GB", "Display": "14 inch FHD", "Build": "Aluminum Chassis"},
        "warranty": "3 Years HP Care Pack"
    },
    {
        "name": "Lenovo ThinkPad E14 Gen 5",
        "category": "Laptops", "sub_category": "Workstation Laptops",
        "price": 68990, "mrp": 79990, "cost_price": 54000,
        "stock": 20, "sku": "LAP-LEN-TP14", "brand": "Lenovo",
        "description": "Lenovo ThinkPad E14 with iconic TrackPoint, spill-resistant keyboard, MIL-STD tested.",
        "image_url": "/static/uploads/0ef0225c453e4cabbdd50ed695936f1b_Screenshot_2026-03-07_182934.png",
        "model_number": "ThinkPad-E14-G5", "status": "active",
        "specifications": {"Processor": "Intel Core i7", "RAM": "16GB DDR5", "Security": "Fingerprint + IR Camera", "Display": "14 inch FHD IPS"},
        "warranty": "3 Years Lenovo Premier Support"
    },
    # MONITORS
    {
        "name": "ASUS TUF Gaming VG27AQ",
        "category": "Monitors", "sub_category": "Gaming Monitors",
        "price": 24990, "mrp": 32990, "cost_price": 18000,
        "stock": 30, "sku": "MON-TUF-27", "brand": "ASUS",
        "description": "ASUS TUF Gaming 27-inch WQHD monitor with ELMB Sync and 165Hz refresh rate.",
        "image_url": "/static/uploads/347ad83e5a854504a9c68ca202e51ecc_Screenshot_2026-03-07_190603.png",
        "model_number": "VG27AQ1A", "status": "active",
        "specifications": {"Size": "27 inch", "Resolution": "2560x1440 WQHD", "Refresh Rate": "165Hz", "Adaptive Sync": "G-Sync Compatible"},
        "warranty": "3 Years ASUS Warranty"
    },
    {
        "name": "Acer Nitro XV272U",
        "category": "Monitors", "sub_category": "Gaming Monitors",
        "price": 22990, "mrp": 29990, "cost_price": 16000,
        "stock": 25, "sku": "MON-NITRO-27", "brand": "Acer",
        "description": "Acer Nitro 27-inch WQHD gaming monitor with vivid colours and fast response time.",
        "image_url": "/static/uploads/bd42ebacbe14453e90526d93bd6464a2_Screenshot_2026-03-07_190950.png",
        "model_number": "XV272U-V", "status": "active",
        "specifications": {"Size": "27 inch", "Resolution": "2560x1440", "Refresh Rate": "170Hz", "Panel": "IPS"},
        "warranty": "3 Years Acer Warranty"
    },
    {
        "name": "LG UltraGear 27GP850",
        "category": "Monitors", "sub_category": "Gaming Monitors",
        "price": 29990, "mrp": 37990, "cost_price": 22000,
        "stock": 20, "sku": "MON-LG-UG27", "brand": "LG",
        "description": "LG UltraGear 27-inch Nano IPS gaming monitor with 1ms response time.",
        "image_url": "/static/uploads/eccc87e033d44c229ebfaded5e210773_Screenshot_2026-03-07_190909.png",
        "model_number": "27GP850-B", "status": "active",
        "specifications": {"Size": "27 inch", "Resolution": "2560x1440", "Response": "1ms GtG", "HDR": "HDR 400"},
        "warranty": "3 Years LG Warranty"
    },
    # ACCESSORIES - Headphones (Sony)
    {
        "name": "Sony ULT WEAR Headphones",
        "category": "Computer Accessories", "sub_category": "Webcams",
        "price": 17990, "mrp": 21990, "cost_price": 12000,
        "stock": 40, "sku": "ACC-SONY-ULT", "brand": "Sony",
        "description": "Sony ULT WEAR wireless headphones with Massive Bass, ULT Power Sound button, and ANC.",
        "image_url": "/static/uploads/4ea7cc53786547dd98703b081e3b6b98_Screenshot_2026-02-18_163747.png",
        "model_number": "WH-ULT900N", "status": "active",
        "specifications": {"Type": "Over-Ear Wireless", "ANC": "Digital Noise Cancelling", "Battery": "50 Hrs (ANC Off)", "Audio": "360 Reality Audio"},
        "warranty": "1 Year Sony Warranty"
    },
    {
        "name": "Sony WH-1000XM5",
        "category": "Computer Accessories", "sub_category": "Webcams",
        "price": 24990, "mrp": 34990, "cost_price": 18000,
        "stock": 30, "sku": "ACC-SONY-XM5", "brand": "Sony",
        "description": "Sony WH-1000XM5 industry-leading noise cancelling headphones with DSEE Extreme.",
        "image_url": "/static/uploads/6746ac5500a54acf9f6c47f32d60efeb_Screenshot_2026-02-18_163731.png",
        "model_number": "WH-1000XM5", "status": "active",
        "specifications": {"ANC": "Industry Leading", "Battery": "30 Hours", "Connectivity": "Multi Point", "Codec": "LDAC"},
        "warranty": "1 Year Sony Warranty"
    },
    {
        "name": "Sony ULT WEAR (Forest Gray)",
        "category": "Computer Accessories", "sub_category": "Webcams",
        "price": 15990, "mrp": 19990, "cost_price": 11000,
        "stock": 25, "sku": "ACC-SONY-ULTG", "brand": "Sony",
        "description": "Sony ULT WEAR wireless headphones in Forest Gray with Digital NC, DSEE Extreme, 360 Reality Audio.",
        "image_url": "/static/uploads/b4826c6273854d7e977969d80ba9c5df_Screenshot_2026-02-18_163817.png",
        "model_number": "WH-ULT900N-G", "status": "active",
        "specifications": {"Color": "Forest Gray", "Battery": "50 Hrs ANC Off / 30 Hrs ANC On", "App": "Sony Headphones Connect", "Assistant": "Google, Alexa, Siri"},
        "warranty": "1 Year Sony Warranty"
    },
    # ACCESSORIES - Cooling Pads
    {
        "name": "Gaming Cooling Pad Red LED",
        "category": "Computer Accessories", "sub_category": "Cooling Pads",
        "price": 1999, "mrp": 2999, "cost_price": 1200,
        "stock": 50, "sku": "ACC-COOL-RED", "brand": "SmartCart",
        "description": "5-fan gaming laptop cooling pad with red LED lights and adjustable height.",
        "image_url": "/static/uploads/9883631c0f1a4d539f238c08da102ca6_Screenshot_2026-03-21_135444.png",
        "model_number": "CP-RED-5F", "status": "active",
        "specifications": {"Fans": "5 x Red LED", "Max Laptop": "17.3 inch", "USB Ports": "2", "Tilt": "Adjustable"},
        "warranty": "6 Months Warranty"
    },
    {
        "name": "RGB Cooling Pad with Phone Holder",
        "category": "Computer Accessories", "sub_category": "Cooling Pads",
        "price": 2499, "mrp": 3499, "cost_price": 1500,
        "stock": 40, "sku": "ACC-COOL-RGB", "brand": "SmartCart",
        "description": "Dual-fan RGB cooling pad with phone holder stand and metal mesh.",
        "image_url": "/static/uploads/a992bbfd366d4a3ba88b45e721e21891_Screenshot_2026-03-21_135434.png",
        "model_number": "CP-RGB-2F", "status": "active",
        "specifications": {"Fans": "2 x RGB", "Phone Holder": "Yes", "Material": "Aluminum Mesh", "LED": "Rainbow RGB"},
        "warranty": "6 Months Warranty"
    },
    {
        "name": "Lapcare RGB Cooling Pad Pro",
        "category": "Computer Accessories", "sub_category": "Cooling Pads",
        "price": 2999, "mrp": 4299, "cost_price": 1800,
        "stock": 35, "sku": "ACC-LAP-COOLP", "brand": "Lapcare",
        "description": "Lapcare premium cooling pad with 6 fans, LCD display, RGB lighting, and phone holder.",
        "image_url": "/static/uploads/f50bb28cab07428ab7853e2f51baf1d3_Screenshot_2026-03-21_135455.png",
        "model_number": "LC-COOL-PRO", "status": "active",
        "specifications": {"Fans": "6 x Blue LED", "LCD Display": "Speed/Temp", "Phone Holder": "Built-in", "RGB": "Edge Lighting"},
        "warranty": "1 Year Lapcare Warranty"
    },
]

with app.app_context():
    restored = 0
    skipped = 0
    for pdata in USER_PRODUCTS:
        existing = Product.query.filter_by(name=pdata["name"]).first()
        if existing:
            print(f"  Already exists: {pdata['name']}")
            skipped += 1
        else:
            p = Product(**pdata)
            db.session.add(p)
            restored += 1
            print(f"  ✅ Restored: {pdata['name']}")
    
    db.session.commit()
    total = Product.query.count()
    print(f"\nRestored {restored} products, skipped {skipped}. Total products now: {total}")
