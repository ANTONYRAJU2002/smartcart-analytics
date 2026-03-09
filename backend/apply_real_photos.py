from app import create_app, db
from app.models import Product

def apply_real_photos():
    app = create_app()
    with app.app_context():
        print("Applying high-quality product photos...")
        
        # Mapping of categories to Unsplash premium tech photos
        category_photos = {
            'Mobiles': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=800',
            'Laptops': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800',
            'Audio': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
            'Wearables': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
            'Cameras': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
            'Gaming': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800',
            'Home Appliances': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
            'Accessories': 'https://images.unsplash.com/photo-1615526675159-e248b3021d3f?auto=format&fit=crop&q=80&w=800'
        }
        
        products = Product.query.all()
        updated_count = 0
        
        for p in products:
            if p.category in category_photos:
                p.image_url = category_photos[p.category]
                updated_count += 1
        
        db.session.commit()
        print(f"Successfully updated image URLs for {updated_count} products!")

if __name__ == '__main__':
    apply_real_photos()
