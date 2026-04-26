import os
import shutil
from app import create_app, db
from app.models import Category, SubCategory, Product

# Define paths
ARTIFACT_DIR = r"C:\Users\anton\.gemini\antigravity\brain\4a43e5d6-9bb7-4a0f-86dd-75fe7f2eeea5"
TARGET_DIR = os.path.join("static", "uploads", "products")

# Mapping subcategories to image filenames (17 unique custom images)
IMAGE_MAP = {
    # Accessories
    "Mouse Pads": "mouse_pads_subcategory_1775132939243.png",
    "Webcams": "webcams_subcategory_1775132956504.png",
    "USB Hubs": "usb_hubs_subcategory_1775132974362.png",
    "Cooling Pads": "cooling_pads_subcategory_1775132989864.png",
    "Laptop Bags": "laptop_bags_subcategory_1775133006408.png",
    
    # Components
    "Processors (CPUs)": "processors_subcategory_1775133036408_1775133025486.png",
    "Motherboards": "motherboards_subcategory_1775133056408_1775133043594.png",
    "RAM (Memory)": "ram_subcategory_1775133076408_1775133058497.png",
    "Graphics Cards (GPUs)": "gpus_subcategory_1775133096408_1775133077006.png",
    "Power Supplies (PSUs)": "psus_subcategory_1775133116408_1775133096582.png",
    "Cabinets": "cabinets_subcategory_1775133146408_1775133116329.png",
    
    # Desktops
    "Gaming Desktops": "gaming_desktops_subcategory_1775133166408_1775133131734.png",
    "Business PCs": "business_pcs_subcategory_1775133186408_1775133145294.png",
    "All-in-One PCs": "aio_pcs_subcategory_1775133206408_1775133163840.png",
    "Workstations": "workstations_subcategory_1775133226408_1775133179495.png",
    
    # Input
    "Gaming Keyboards": "gaming_keyboard_sample_1775132716216.png",
    "Optical Mouse": "optical_mouse_subcategory_1775133329408_1775133197320.png",
    "Wireless Combos": "gaming_keyboard_sample_1775132716216.png",
    
    # Laptops (Reuse relevant)
    "Gaming Laptops": "gaming_desktops_subcategory_1775133166408_1775133131734.png",
    "Ultrabooks": "aio_pcs_subcategory_1775133206408_1775133163840.png",
    "Workstation Laptops": "workstations_subcategory_1775133226408_1775133179495.png",
    
    # Monitors (Reuse relevant)
    "4K UHD Monitors": "aio_pcs_subcategory_1775133206408_1775133163840.png",
    "Gaming Monitors": "aio_pcs_subcategory_1775133206408_1775133163840.png",
    "Curved Displays": "aio_pcs_subcategory_1775133206408_1775133163840.png",
    "Ultrawide Monitors": "aio_pcs_subcategory_1775133206408_1775133163840.png",
    
    # Networking (Reuse relevant)
    "Routers": "usb_hubs_subcategory_1775132974362.png",
    "Network Switches": "motherboards_subcategory_1775133056408_1775133043594.png",
    "Wi-Fi Adapters": "usb_hubs_subcategory_1775132974362.png",
    "Ethernet Cables": "usb_hubs_subcategory_1775132974362.png",
    
    # Storage (Reuse relevant)
    "Internal SSDs": "processors_subcategory_1775133036408_1775133025486.png",
    "External Hard Drives": "usb_hubs_subcategory_1775132974362.png",
    "NAS Drives": "cabinets_subcategory_1775133146408_1775133116329.png",
    "NVMe SSDs": "processors_subcategory_1775133036408_1775133025486.png"
}

# Rupee tiered pricing for every category/subcategory
PRODUCT_DATA = {
    "Computer Accessories": {
        "Mouse Pads": [
            ("Razer Strider Hybrid", 2499, "A stunning hybrid mouse pad for professional precision.", {"Size": "940x410mm", "Surface": "Hybrid Polyester"}),
            ("Logitech G440", 1499, "Hard gaming mouse pad for high-DPI gaming.", {"Friction": "Ultra-Low", "Base": "Stable Rubber"}),
            ("Standard Desk Mat", 799, "Minimalist desk mat for office productivity.", {"Waterproof": "Breathable Fabric"})
        ],
        "Webcams": [
            ("Logitech BRIO 4K", 19999, "Ultra-HD 4K webcam with RightLight 3 and HDR.", {"Resolution": "4K@30fps", "Digital Zoom": "5x"}),
            ("Razer Kiyo Pro", 14999, "High-performance adaptive light sensor for streaming.", {"Resolution": "1080p@60fps", "HDR": "Enabled"}),
            ("Generic Go Cam", 3499, "Affordable 1080p camera for remote learning.", {"Features": "Plug & Play"})
        ],
        "USB Hubs": [
            ("Anker 7-in-1 Hub", 4599, "Premium USB-C adapter with Power Delivery and HDMI.", {"Data": "5Gbps", "Charge": "PD 100W"}),
            ("TP-Link 4-Port 3.0", 1299, "Simple high-speed expansion for your desktop or laptop.", {"Speed": "5Gbps", "Warranty": "2 Years"}),
            ("CableMatters USB 4", 8999, "Next-gen docking station for dual-monitor setups.", {"Bandwidth": "40Gbps", "Displays": "Dual 4K"})
        ],
        "Cooling Pads": [
            ("Deepcool Multi Core X6", 3299, "Four internal fans for maximum airflow and cooling.", {"Fans": "4 x 140mm", "Tilt": "Adjustable"}),
            ("Cooler Master NotePal", 1999, "Silent and sleek cooling for long working hours.", {"Noise": "21 dBA", "Interface": "USB"}),
            ("Basic FrostPad", 999, "Double fan cooling for student laptops.", {"RPM": "1200", "Color": "Blue LED"})
        ],
        "Laptop Bags": [
            ("Samsonite Tech Backpack", 7499, "Ergonomic multi-pocket design for secure travel.", {"Material": "Ballistic Nylon", "Fit": "15.6 inch"}),
            ("Daily Carry Messenger", 2499, "Compact and stylish shoulder bag for work.", {"Waterproof": "Yes", "Brand": "InCase"}),
            ("Sleeve Pro Slim", 1299, "Shockproof protection for ultrabooks.", {"Padding": "High Density Foam"})
        ]
    },
    "Computer Components": {
        "Processors (CPUs)": [
            ("Intel Core i9-14900K", 58999, "24-core flagship for the ultimate power user.", {"Cores": "24", "Boost": "6.0GHz", "Cache": "36MB"}),
            ("AMD Ryzen 7 7800X3D", 36999, "The undisputed king of gaming processors.", {"Cores": "8", "L3 Cache": "96MB", "Socket": "AM5"}),
            ("Intel Core i5-13400F", 18499, "Efficient 10-core processing for work and play.", {"Budget": "Best Value", "TDP": "65W"})
        ],
        "Motherboards": [
            ("ASUS ROG Crosshair X670E", 64999, "Elite AM5 board for extreme overclocking.", {"RAM": "DDR5", "M.2": "5 Slots"}),
            ("MSI MAG B760 Tomahawk", 18999, "Robust performance for Intel 13th & 14th gen.", {"Audio": "Realtek ALC4080", "Ethernet": "2.5G"}),
            ("Gigabyte B550M DS3H", 8499, "Entry level AM4 board for budget gaming builds.", {"PCIe": "Gen4", "VRM": "5+3 Phases"})
        ],
        "RAM (Memory)": [
            ("Corsair Vengeance 32GB DDR5", 14999, "Lightning fast 6000MHz performance.", {"Speed": "6000MT/s", "Latency": "CL36"}),
            ("G.Skill Trident Z5 RGB", 12499, "Stunning lights and pro-grade speed.", {"Timing": "30-38-38-96", "Capacity": "32GB"}),
            ("Crucial 8GB DDR4 3200", 2499, "Essential upgrade for your home office PC.", {"Rank": "Single", "Voltage": "1.2V"})
        ],
        "Graphics Cards (GPUs)": [
            ("NVIDIA RTX 4090", 189999, "The absolute pinnacle of PC gaming.", {"VRAM": "24GB", "Architecture": "Ada Lovelace"}),
            ("AMD Radeon RX 7900 XTX", 104999, "Vast performance for 4K raytracing gaming.", {"VRAM": "24GB", "FSR": "3.0 Supported"}),
            ("NVIDIA RTX 4060 Ti", 38999, "Perfect 1080p and 1440p gaming companion.", {"Cores": "4352 CUDA", "Power": "160W"})
        ],
        "Power Supplies (PSUs)": [
            ("Corsair RM1000x Gold", 16999, "Legendary silent power and efficiency.", {"Rating": "80 Plus Gold", "Modular": "Full"}),
            ("Cooler Master MWE 750", 6499, "Reliable 750W energy for mid-range systems.", {"Bronze": "Efficiency", "Fan": "HDB"}),
            ("Ant Esports 500W", 2299, "Budget power for simple office computers.", {"Efficiency": "Standard", "Cables": "Sleeved"})
        ],
        "Cabinets": [
            ("Lian Li PC-O11 Dynamic", 14999, "The gold standard for enthusiast water cooling.", {"Glass": "Tempered x3", "Radiator": "360mm x3"}),
            ("NZXT H5 Flow", 7999, "Smart airflow mid-tower with angled fan design.", {"Pre-installed": "2 Fans", "Style": "Minimalist"}),
            ("Circle Gaming Case", 2999, "Basic RGB gaming case for budget enthusiasts.", {"Fans": "3 x RGB", "Side": "Acrylic"})
        ]
    },
    "Desktop PCs": {
        "Gaming Desktops": [
            ("Aegis X Pro", 249999, "A pre-built monster featuring RTX 4090 and i9.", {"RAM": "64GB DDR5", "SSD": "4TB Gen5"}),
            ("Vostro G-Series", 84999, "Balanced gaming and productivity tower.", {"GPU": "RTX 4060", "CPU": "i7-13700"}),
            ("Compact Sentry", 49999, "Thin and powerful mini-gaming desktop.", {"Size": "10L", "GPU": "GTX 1650"})
        ],
        "Business PCs": [
            ("Dell OptiPlex 7010", 72999, "Micro form-factor with enterprise security.", {"OS": "Win 11 Pro", "vPro": "Yes"}),
            ("HP ProDesk G9", 58999, "Reliable performance for high-traffic offices.", {"RAM": "16GB", "Storage": "512GB SSD"}),
            ("Lenovo ThinkCentre Neo", 38999, "Vertical tower for everyday business computing.", {"CPU": "Intel i5", "Expandable": "Yes"})
        ],
        "All-in-One PCs": [
            ("Mac-Style AIO 27", 129999, "Stunning 4K display and powerful internal hardware.", {"Screen": "27 inch 4K", "Audio": "Harman Kardon"}),
            ("HP Pavilion AIO", 74999, "Family-focused desktop with pop-up camera.", {"Storage": "1TB HDD + 256GB SSD", "Color": "Snow White"}),
            ("Lenovo IdeaCentre A3", 44999, "Entry level 21-inch AIO for basic study and web.", {"Screen": "21.5 inch", "Stand": "Phone Holder"})
        ],
        "Workstations": [
            ("NVIDIA RTX A6000 Rig", 699999, "Unparalleled power for AI training and rendering.", {"GPU": "RTX A6000 48GB", "RAM": "128GB ECC"}),
            ("Precision 7920 Dual-Xeon", 459999, "Serious multithreaded performance for rendering.", {"Cores": "56 Total", "CPU": "Dual Xeon"}),
            ("ThinkStation P360", 94999, "Certified workstation for CAD and modeling.", {"ISV": "Certified", "GPU": "T1000"})
        ]
    },
    "Keyboards & Mouse": {
        "Gaming Keyboards": [
            ("SteelSeries Apex Pro", 18999, "Adjustable switches for gaming and typing.", {"Response": "0.7ms", "OLED": "Smart Display"}),
            ("Razer Huntsman V2", 14999, "Optical switches for near-zero input lag.", {"Rate": "8000Hz", "Wrist Rest": "Plush"}),
            ("Redragon K552", 2999, "The best-selling budget mechanical keyboard.", {"Switches": "Blue", "Lighting": "Red LED"})
        ],
        "Optical Mouse": [
            ("Logitech G Pro Superlight", 12999, "The professional choice for esport icons.", {"Weight": "63g", "Sensor": "HERO 25K"}),
            ("Razer DeathAdder V3", 8499, "Ergonomic perfection meets 8K polling rate.", {"Grip": "Textured", "Buttons": "6"}),
            ("Zebronics Transformer", 599, "Cool RGB design for starting gamers.", {"DPI": "3200", "Cable": "Braided"})
        ],
        "Wireless Combos": [
            ("Logitech MX Master Desktop", 16999, "Elite productivity combo for designers.", {"Flow": "Across Devices", "Battery": "USB-C Rechargeable"}),
            ("HP Wireless Combo 800", 3499, "Quiet and slim desk set for professional offices.", {"Type": "Full Size", "Range": "10m"}),
            ("Dell Standard Combo", 1499, "Reliable everyday typing and clicking.", {"Battery": "AA included", "Design": "Spill-resistant"})
        ]
    },
    "Laptops": {
        "Gaming Laptops": [
            ("ASUS ROG Strix SCAR 18", 349999, "18-inch beast with i9 and RTX 4090.", {"Screen": "Mini-LED QHD", "Refresh": "240Hz"}),
            ("Acer Predator Helios Neo", 109999, "Highly popular value gaming king.", {"CPU": "i7-13700HX", "GPU": "RTX 4050"}),
            ("MSI Cyborg 15", 74999, "Transparent parts and high performance value.", {"Design": "Cyber-punk", "Weight": "1.98kg"})
        ],
        "Ultrabooks": [
            ("MacBook Air M3", 114900, "Thin, light, and amazingly powerful.", {"CPU": "Apple M3", "Battery": "18 Hours"}),
            ("Dell XPS 13 Plus", 149999, "Edge-to-edge glass and futuristic design.", {"Display": "OLED Touch", "Portability": "Extreme"}),
            ("Surface Laptop 5", 94999, "Elegant design with Alcantara premium finish.", {"Screen": "PixelSense 13.5", "Weight": "1.2kg"})
        ],
        "Workstation Laptops": [
            ("Precision 5480 Mobile", 259999, "ISV certified power in a 14-inch frame.", {"CPU": "Intel vPro", "GPU": "RTX 2000 Ada"}),
            ("ThinkPad P1 Gen 6", 219999, "Carbon fiber durability meet workstation power.", {"OS": "Ubuntu/Windows", "Display": "4K DreamColor"}),
            ("ZBook Studio G10", 179999, "Designed for creatives working on the move.", {"Color": "100% DCI-P3", "Audio": "B&O"})
        ]
    },
    "Monitors": {
        "4K UHD Monitors": [
            ("LG UltraFine 32", 64999, "Stunning Ergo stand and color accuracy.", {"Resolution": "4K", "Size": "31.5 inch"}),
            ("BenQ DesignVue", 48999, "Calibrated for photography and color work.", {"SRGB": "100%", "Mode": "Darkroom"}),
            ("Samsung ViewFinity", 29999, "Sharp office display with USB-C Hub.", {"Features": "HDR10", "Panel": "IPS"})
        ],
        "Gaming Monitors": [
            ("Samsung Odyssey G9", 129999, "Ultra-wide 49-inch curved futuristic screen.", {"Curve": "1000R", "Refresh": "240Hz"}),
            ("ASUS ROG Swift 360Hz", 54999, "The world's fastest esports monitor.", {"Size": "24.5 inch", "G-Sync": "Ultimate"}),
            ("LG UltraGear 144Hz", 18499, "High-value 1440p gaming experience.", {"Response": "1ms", "Sync": "FreeSync"})
        ],
        "Curved Displays": [
            ("Dell UltraSharp 38 Curved", 94999, "Wider view for ultimate productivity.", {"Aspect": "21:9", "Ports": "RJ45 included"}),
            ("Gigabyte G27QC", 22999, "A balanced curved monitor for immersive gaming.", {"Size": "27 inch", "Refresh": "165Hz"}),
            ("MSI Optix Curved", 14999, "Budget immersion for entry-level setups.", {"Curve": "1500R", "Response": "1ms"})
        ],
        "Ultrawide Monitors": [
            ("LG 49WL95C", 114999, "Replaces dual 27-inch monitors perfectly.", {"Size": "49 inch", "Resolution": "5120x1440"}),
            ("Gigabyte M34WQ", 44999, "A flat ultrawide with integrated KVM switch.", {"Sync": "FreeSync Premium", "Refresh": "144Hz"}),
            ("Acer CB292CU", 18999, "Spacious 29-inch layout for multitasking.", {"Height": "Adjustable", "IPS": "Display"})
        ]
    },
    "Networking Devices": {
        "Routers": [
            ("TP-Link Archer AX6000", 24999, "Next-gen Wi-Fi 6 with extreme speed.", {"Speed": "6Gbps", "Antennas": "8"}),
            ("Netgear Nighthawk", 12999, "Gaming-grade router with low latency tech.", {"Features": "Gaming Dashboard", "Tri-band": "No"}),
            ("Mercusys Basic WiFi", 1299, "Simple internet for small homes.", {"Standard": "Wi-Fi 5", "Coverage": "Standard"})
        ],
        "Network Switches": [
            ("Ubiquiti UniFi 24-Port", 34999, "Managed enterprise-grade networking switch.", {"PoE": "Support", "Layer": "L2/L3"}),
            ("D-Link 8-Port Gigabit", 1299, "Simple, fast expansion for wired devices.", {"Build": "Metal", "Power": "Energy Efficient"}),
            ("Tenda 5-Port 10/100", 599, "The most affordable wired connection fix.", {"Speed": "100Mbps", "Type": "Plastic"})
        ],
        "Wi-Fi Adapters": [
            ("TP-Link TX401", 6499, "Full 10Gbps PCI-E Wi-Fi 6 network card.", {"Antennas": "External High Gain", "Sync": "Bluetooth 5"}),
            ("Netgear Nighthawk USB", 3499, "The world's fastest Wi-Fi 6 USB adapter.", {"Speed": "AX1200", "Range": "Extended"}),
            ("D-Link Nano USB", 499, "Smallest possible Wi-Fi adapter for laptops.", {"Standard": "150Mbps", "Driver": "Auto-install"})
        ],
        "Ethernet Cables": [
            ("Cat 8 Braided 25ft", 1499, "Future-proof high-speed 40Gbps cable.", {"Shield": "SSTP", "End": "Gold Plated"}),
            ("Cat 6 Flat Cable 10m", 699, "Hide your network under carpets easily.", {"Type": "Flat", "Color": "White"}),
            ("AmazonBasics Cat 5e 3ft", 199, "Essential patch cable for routers.", {"Length": "1m", "Color": "Gray"})
        ]
    },
    "Storage Devices": {
        "Internal SSDs": [
            ("Samsung 990 Pro 2TB", 18999, "The ultimate PCIe Gen5 gaming SSD.", {"Speed": "7450MB/s", "NVMe": "2.0"}),
            ("Crucial P3 1TB", 5499, "NVMe performance at SATA price points.", {"Value": "Excellent", "Speed": "3500MB/s"}),
            ("Western Digital Blue 500GB", 3299, "Reliable storage for everyday systems.", {"Grade": "Home/Office", "Warranty": "5 Years"})
        ],
        "External Hard Drives": [
            ("LaCie Rugged 4TB", 14999, "Legendary drop and water resistance for pros.", {"Port": "USB-C", "Shock": "Military Grade"}),
            ("WD My Passport 1TB", 4899, "Secure and portable personal storage.", {"Backup": "Automatic Software", "Style": "Slim"}),
            ("Seagate Expansion 2TB", 5999, "Massive storage in a simple compact box.", {"Setup": "Drag & Drop", "Size": "2.5 inch"})
        ],
        "NAS Drives": [
            ("Seagate IronWolf 12TB", 28999, "Designed for 24/7 NAS performance.", {"Workload": "300TB/year", "AgileArray": "Yes"}),
            ("WD Red Plus 4TB", 10499, "NAS-optimized storage for home servers.", {"Rotational": "5400RPM", "Cache": "128MB"}),
            ("Synology Generic NAS Drive", 6999, "Reliable drive for Synology enclosures.", {"Noise": "Low", "Reliability": "Enterprise"})
        ],
        "NVMe SSDs": [
            ("FireCuda 540 Gen5 2TB", 26999, "Unleash extreme Gen5 storage speeds.", {"Read": "10000MB/s", "Write": "10000MB/s"}),
            ("TeamGroup T-Force 1TB", 7499, "Cool design with large aluminum heatsink.", {"Style": "Gamer", "Temp": "Reduced by 15C"}),
            ("Lexar NM790 1TB", 5999, "High speed efficiency for enthusiast PCs.", {"Speed": "7400MB/s", "Tech": "HMB 3.0"})
        ]
    }
}

def seed():
    app = create_app()
    with app.app_context():
        print("Cleaning old product data to apply fresh Rupee prices...")
        db.session.query(Product).delete()
        
        product_count = 0
        for cat_name, subcats in PRODUCT_DATA.items():
            for sub_name, products in subcats.items():
                image_file = IMAGE_MAP.get(sub_name, "aio_pcs_subcategory_1775133206408_1775133163840.png")
                image_url = f"/static/uploads/products/{image_file}"
                
                for p_info in products:
                    name, price, desc, specs = p_info
                    
                    # Create Product object
                    p = Product(
                        name=name,
                        category=cat_name,
                        sub_category=sub_name,
                        price=float(price),
                        mrp=float(price * 1.35), # Auto-generate MRP with 35% margin
                        cost_price=float(price * 0.75),
                        stock=100,
                        sku=f"{cat_name[:2]}{sub_name[:2]}{product_count:03d}".upper().replace(" ", ""),
                        description=desc,
                        image_url=image_url,
                        brand="SmartCart" if "Brand" not in specs else specs["Brand"],
                        model_number=f"SC-{product_count:04d}",
                        status="active",
                        specifications=specs,
                        warranty="2 Years Manufacturer Warranty"
                    )
                    db.session.add(p)
                    product_count += 1
        
        db.session.commit()
        print(f"Grand Total: {product_count} products refined and seeded successfully with Rupee values!")

if __name__ == "__main__":
    print("Starting DB refinement...")
    seed()
