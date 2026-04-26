from flask import Blueprint, jsonify, request
from app import db
from app.models import Product, User, Review, Category
from flask_jwt_extended import jwt_required, get_jwt_identity

products_bp = Blueprint('products', __name__)

@products_bp.route('', methods=['GET'])
@products_bp.route('/', methods=['GET'])
def get_products():
    query = Product.query
    
    # Filter by Category
    category = request.args.get('category')
    if category:
        query = query.filter_by(category=category)

    # Filter by Brand
    brand = request.args.get('brand')
    if brand:
        query = query.filter_by(brand=brand)

    # Filter by Price Range
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    # Search by Name
    search_term = request.args.get('q')
    if search_term:
        query = query.filter(Product.name.ilike(f'%{search_term}%'))

    products = query.all()
    
    # Filter by Rating (Post-query for simplicity, or we could use subquery)
    min_rating = request.args.get('min_rating', type=float)
    
    result = []
    for p in products:
        # Calculate Average Rating
        reviews = p.reviews
        avg_rating = sum(r.rating for r in reviews) / len(reviews) if reviews else 0
        
        if min_rating and avg_rating < min_rating:
            continue

        result.append({
            'id': p.id,
            'name': p.name,
            'category': p.category,
            'sub_category': p.sub_category,
            'brand': p.brand,
            'price': p.price,
            'mrp': p.mrp,
            'discount': p.discount,
            'image_url': p.image_url,
            'stock': p.stock,
            'sku': p.sku,
            'model_number': p.model_number,
            'cost_price': p.cost_price,
            'status': p.status,
            'description': p.description,
            'warranty': p.warranty,
            'specifications': p.specifications,
            'image_gallery': [img.image_url for img in p.images.all()],
            'variants': p.variants or [],
            'serial_numbers': p.serial_numbers if hasattr(p, 'serial_numbers') else [],
            'avg_rating': round(avg_rating, 1),
            'review_count': len(reviews)
        })
    return jsonify(result), 200

@products_bp.route('', methods=['POST'])
@products_bp.route('/', methods=['POST'])
@jwt_required()
def add_product():
    try:
        # Check if admin
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        if not current_user or current_user.role not in ['admin', 'staff']:
            return jsonify({"msg": "Admins or Staff only!"}), 403

        data = request.get_json()
        print(f"DEBUG: add_product data: {data}")

        new_product = Product(
            name=data['name'],
            category=data['category'],
            sub_category=data.get('sub_category'),
            price=float(data['price']) if data.get('price') else 0.0,
            mrp=float(data.get('mrp', 0.0)),
            discount=float(data.get('discount', 0.0)),
            cost_price=float(data['cost_price']) if data.get('cost_price') else 0.0,
            stock=int(data['stock']) if data.get('stock') else 0,
            sku=data.get('sku'),
            image_url=data.get('image_url'),
            description=data.get('description', ''),
            warranty=data.get('warranty', ''),
            brand=data.get('brand', ''),
            model_number=data.get('model_number', ''),
            status=data.get('status', 'active'),
            specifications=data.get('specifications', {}),
            variants=data.get('variants', []),
            serial_numbers=data.get('serial_numbers', [])
        )
        db.session.add(new_product)
        db.session.commit()

        # Handle additional images
        gallery = data.get('image_gallery', [])
        for img_url in gallery:
            from app.models import ProductImage
            new_img = ProductImage(product_id=new_product.id, image_url=img_url)
            db.session.add(new_img)
        db.session.commit()

        return jsonify({"msg": "Product added"}), 201
    except Exception as e:
        import traceback
        with open('backend_error.log', 'w') as f:
            f.write(traceback.format_exc())
        return jsonify({"msg": f"Server Error: {str(e)}"}), 500

@products_bp.route('/<int:id>', methods=['GET'])
def get_product(id):
    product = Product.query.get_or_404(id)
    images = [img.image_url for img in product.images.all()]
    
    can_review = False
    try:
        # Check if JWT is present manually since endpoint is public
        # This is a bit hacky but avoids making the whole endpoint protected
        # Better approach: frontend calls a separate /can-review endpoint or we handle optional auth
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
        
        if current_user_id:
            current_user_id = int(current_user_id)
            from app.models import Order, OrderItem, Review
            
            # Check purchase
            has_purchased = db.session.query(Order).join(OrderItem).filter(
                Order.user_id == current_user_id,
                OrderItem.product_id == id,
                Order.status == 'delivered'
            ).first()
            
            # Check existing review
            has_reviewed = Review.query.filter_by(user_id=current_user_id, product_id=id).first()
            
            if has_purchased and not has_reviewed:
                can_review = True
    except:
        pass # Not logged in or invalid token
        
    return jsonify({
        'id': product.id,
        'name': product.name,
        'category': product.category,
        'sub_category': product.sub_category,
        'price': product.price,
        'mrp': product.mrp,
        'discount': product.discount,
        'stock': product.stock,
        'sku': product.sku,
        'image_url': product.image_url,
        'image_gallery': images,
        'cost_price': product.cost_price,
        'description': product.description,
        'warranty': product.warranty,
        'brand': product.brand,
        'model_number': product.model_number,
        'status': product.status,
        'specifications': product.specifications,
        'variants': product.variants,
        'can_review': can_review
    }), 200

@products_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_product(id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role not in ['admin', 'staff']:
        return jsonify({"msg": "Admin or Staff only!"}), 403
    
    product = Product.query.get_or_404(id)
    data = request.get_json()
    
    product.name = data.get('name', product.name)
    product.category = data.get('category', product.category)
    product.sub_category = data.get('sub_category', product.sub_category)
    product.price = float(data['price']) if data.get('price') else product.price
    product.mrp = float(data.get('mrp', product.mrp))
    product.discount = float(data.get('discount', product.discount))
    product.cost_price = float(data['cost_price']) if data.get('cost_price') else product.cost_price
    product.stock = int(data['stock']) if data.get('stock') else product.stock
    product.sku = data.get('sku', product.sku)

    product.image_url = data.get('image_url', product.image_url)
    product.description = data.get('description', product.description)
    product.warranty = data.get('warranty', product.warranty)
    product.brand = data.get('brand', product.brand)
    product.model_number = data.get('model_number', product.model_number)
    product.status = data.get('status', product.status)
    product.specifications = data.get('specifications', product.specifications)
    product.variants = data.get('variants', product.variants)
    product.serial_numbers = data.get('serial_numbers', product.serial_numbers)
    
    # Update gallery: Clear existing and add new
    if 'image_gallery' in data:
        from app.models import ProductImage
        # Delete existing
        ProductImage.query.filter_by(product_id=id).delete()
        # Add new
        for img_url in data['image_gallery']:
            new_img = ProductImage(product_id=id, image_url=img_url)
            db.session.add(new_img)

    db.session.commit()
    return jsonify({"msg": "Product updated"}), 200

@products_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_product(id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({"msg": "Admins only!"}), 403

    product = Product.query.get_or_404(id)
    db.session.delete(product)
    db.session.commit()
    return jsonify({"msg": "Product deleted"}), 200

@products_bp.route('/wishlist', methods=['GET'])
@jwt_required()
def get_wishlist():
    current_user_id = int(get_jwt_identity())
    from app.models import Wishlist
    items = Wishlist.query.filter_by(user_id=current_user_id).all()
    
    result = []
    for item in items:
        p = item.product
        if not p:
            continue # Skip ghost/deleted products
            
        result.append({
            'id': p.id,
            'name': p.name,
            'price': p.price,
            'image_url': p.image_url,
            'category': p.category
        })
    return jsonify(result), 200

@products_bp.route('/<int:id>/wishlist', methods=['POST'])
@jwt_required()
def add_to_wishlist(id):
    current_user_id = int(get_jwt_identity())
    from app.models import Wishlist
    
    existing = Wishlist.query.filter_by(user_id=current_user_id, product_id=id).first()
    if existing:
        return jsonify({"msg": "Already in wishlist"}), 200
        
    new_item = Wishlist(user_id=current_user_id, product_id=id)
    db.session.add(new_item)
    db.session.commit()
    return jsonify({"msg": "Added to wishlist"}), 201

@products_bp.route('/<int:id>/wishlist', methods=['DELETE'])
@jwt_required()
def remove_from_wishlist(id):
    current_user_id = int(get_jwt_identity())
    from app.models import Wishlist
    
    item = Wishlist.query.filter_by(user_id=current_user_id, product_id=id).first()
    if not item:
        return jsonify({"msg": "Item not in wishlist"}), 404
        
    db.session.delete(item)
    db.session.commit()
    return jsonify({"msg": "Removed from wishlist"}), 200

# Category Management Routes

@products_bp.route('/categories', methods=['GET'])
def get_categories():
    from app.models import SubCategory

    # Get formally-defined categories from the Category model
    formal_cats = Category.query.all()
    cat_map = {}
    for c in formal_cats:
        cat_map[c.name] = {
            'id': c.id,
            'name': c.name,
            'subcategories': [{'id': sc.id, 'name': sc.name} for sc in c.subcategories.all()]
        }

    # Also pull unique category strings from products (in case Category model is empty/partial)
    product_cats = db.session.query(Product.category, Product.sub_category)\
        .filter(Product.category != None, Product.category != '')\
        .distinct().all()

    for cat_str, sub_str in product_cats:
        if cat_str not in cat_map:
            # Create a virtual (db-only) entry for this category
            cat_map[cat_str] = {'id': cat_str, 'name': cat_str, 'subcategories': []}
        # Add sub-category if not already present
        if sub_str:
            existing_subs = [s['name'] for s in cat_map[cat_str]['subcategories']]
            if sub_str not in existing_subs:
                cat_map[cat_str]['subcategories'].append({'id': sub_str, 'name': sub_str})

    result = sorted(cat_map.values(), key=lambda x: x['name'])
    return jsonify(result), 200


@products_bp.route('/categories', methods=['POST'])
@jwt_required()
def add_category():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({"msg": "Admins only!"}), 403

    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({"msg": "Name is required"}), 400

    if Category.query.filter_by(name=data['name']).first():
        return jsonify({"msg": "Category already exists"}), 400

    new_category = Category(name=data['name'])
    db.session.add(new_category)
    db.session.commit()

    return jsonify({"msg": "Category added", "id": new_category.id}), 201

@products_bp.route('/categories/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_category(id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({"msg": "Admins only!"}), 403

    category = Category.query.get_or_404(id)
    db.session.delete(category)
    db.session.commit()

    return jsonify({"msg": "Category deleted"}), 200

# SubCategory Management Routes

@products_bp.route('/categories/<int:category_id>/subcategories', methods=['POST'])
@jwt_required()
def add_subcategory(category_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({"msg": "Admins only!"}), 403

    category = Category.query.get_or_404(category_id)
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({"msg": "Name is required"}), 400

    from app.models import SubCategory
    if SubCategory.query.filter_by(category_id=category_id, name=data['name']).first():
        return jsonify({"msg": "Subcategory already exists in this category"}), 400

    new_sub = SubCategory(name=data['name'], category_id=category_id)
    db.session.add(new_sub)
    db.session.commit()

    return jsonify({"msg": "Subcategory added", "id": new_sub.id}), 201

@products_bp.route('/subcategories/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_subcategory(id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({"msg": "Admins only!"}), 403

    from app.models import SubCategory
    sub = SubCategory.query.get_or_404(id)
    db.session.delete(sub)
    db.session.commit()

    return jsonify({"msg": "Subcategory deleted"}), 200

@products_bp.route('/<int:id>/notify', methods=['POST'])
@jwt_required()
def notify_on_stock(id):
    current_user_id = int(get_jwt_identity())
    product = Product.query.get_or_404(id)
    
    if product.stock > 0:
        return jsonify({"msg": "Product is in stock"}), 400
    
    from app.models import StockNotification
    existing = StockNotification.query.filter_by(user_id=current_user_id, product_id=id, is_notified=False).first()
    if existing:
        return jsonify({"msg": "Already registered for notification"}), 400
        
    new_notif = StockNotification(user_id=current_user_id, product_id=id)
    db.session.add(new_notif)
    db.session.commit()
    
    return jsonify({"msg": "Notification registered"}), 201

@products_bp.route('/<int:id>/related', methods=['GET'])
def get_related_products(id):
    product = Product.query.get_or_404(id)
    
    from app.analytics.market_basket import perform_market_basket_analysis
    from app.analytics.data_loader import load_order_items_data
    import pandas as pd
    from mlxtend.preprocessing import TransactionEncoder

    try:
        transactions = load_order_items_data()
        if not transactions:
            raise Exception("No transactions")

        te = TransactionEncoder()
        te_ary = te.fit(transactions).transform(transactions)
        df = pd.DataFrame(te_ary, columns=te.columns_)
        
        rules = perform_market_basket_analysis(df, min_support=0.01)
        
        related_names = []
        if not rules.empty:
            for _, row in rules.iterrows():
                if product.name in row['antecedents']:
                    related_names.extend(list(row['consequents']))
        
        if not related_names:
            related_products = Product.query.filter(
                Product.category == product.category,
                Product.id != id
            ).limit(4).all()
        else:
            related_names = list(set(related_names))
            related_products = Product.query.filter(
                Product.name.in_(related_names),
                Product.id != id
            ).limit(4).all()
    except Exception:
        related_products = Product.query.filter(
            Product.category == product.category,
            Product.id != id
        ).limit(4).all()

    result = []
    for p in related_products:
        result.append({
            'id': p.id,
            'name': p.name,
            'price': p.price,
            'image_url': p.image_url,
            'category': p.category
        })
    
    return jsonify(result), 200
