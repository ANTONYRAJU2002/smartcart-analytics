from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Review, Product, User
from app import db
import os
from werkzeug.utils import secure_filename
import uuid

reviews_bp = Blueprint('reviews', __name__)

@reviews_bp.route('/api/products/<int:product_id>/reviews', methods=['POST'])
@jwt_required()
def create_review(product_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    # Using request.form to support multipart/form-data for file uploads
    data = request.form
    rating = data.get('rating')
    comment = data.get('comment')
    image_url = None

    if not rating:
        return jsonify({'error': 'Rating is required'}), 400
        
    try:
        rating = int(rating)
        if rating < 1 or rating > 5:
            return jsonify({'error': 'Valid rating (1-5) is required'}), 400
    except ValueError:
        return jsonify({'error': 'Rating must be an integer'}), 400

    # Check for existing review
    existing_review = Review.query.filter_by(user_id=user_id, product_id=product_id).first()
    if existing_review:
        return jsonify({'error': 'You have already reviewed this product'}), 400

    if 'image' in request.files:
        file = request.files['image']
        if file and file.filename != '':
            filename = secure_filename(file.filename)
            ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
            if ext in {'png', 'jpg', 'jpeg', 'webp'}:
                new_filename = f"review_{uuid.uuid4().hex}.{ext}"
                upload_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'static', 'uploads')
                os.makedirs(upload_folder, exist_ok=True)
                filepath = os.path.join(upload_folder, new_filename)
                
                try:
                    file.save(filepath)
                    image_url = f"/static/uploads/{new_filename}"
                except Exception as e:
                    return jsonify({'error': f'Failed to save image: {str(e)}'}), 500
            else:
                return jsonify({'error': 'Invalid file type. Only png, jpg, jpeg, webp allowed.'}), 400

    new_review = Review(
        user_id=user_id,
        product_id=product_id,
        rating=rating,
        comment=comment,
        image_url=image_url
    )

    db.session.add(new_review)
    db.session.commit()

    return jsonify({
        'message': 'Review submitted successfully',
        'review': {
            'id': new_review.id,
            'rating': new_review.rating,
            'comment': new_review.comment,
            'image_url': new_review.image_url,
            'username': user.username,
            'created_at': new_review.created_at.isoformat() if new_review.created_at else None
        }
    }), 201

@reviews_bp.route('/api/products/<int:product_id>/reviews', methods=['GET'])
def get_product_reviews(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    reviews = Review.query.filter_by(product_id=product_id).order_by(Review.created_at.desc()).all()
    review_list = []
    avg_rating = 0
    
    for r in reviews:
        review_list.append({
            'id': r.id,
            'user_id': r.user_id,
            'username': r.user.username if r.user else 'Unknown',
            'rating': r.rating,
            'comment': r.comment,
            'image_url': r.image_url,
            'admin_comment': r.admin_comment,
            'created_at': r.created_at.isoformat() if r.created_at else None
        })
        
    if reviews:
        avg_rating = sum(r.rating for r in reviews) / len(reviews)

    return jsonify({
        'reviews': review_list,
        'average_rating': round(avg_rating, 1),
        'total_reviews': len(reviews)
    }), 200

@reviews_bp.route('/api/admin/reviews', methods=['GET'])
@jwt_required()
def admin_get_all_reviews():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role not in ['admin', 'staff']:
        return jsonify({'error': 'Unauthorized'}), 403

    reviews = Review.query.order_by(Review.created_at.desc()).all()
    review_list = []
    for r in reviews:
        review_list.append({
            'id': r.id,
            'product_id': r.product_id,
            'product_name': r.product.name if r.product else 'Unknown Product',
            'product_image': r.product.image_url if r.product else None,
            'user_id': r.user_id,
            'username': r.user.username if r.user else 'Unknown',
            'rating': r.rating,
            'comment': r.comment,
            'image_url': r.image_url,
            'admin_comment': r.admin_comment,
            'created_at': r.created_at.isoformat() if r.created_at else None
        })

    return jsonify({'reviews': review_list}), 200

@reviews_bp.route('/api/admin/reviews/<int:review_id>/comment', methods=['PUT'])
@jwt_required()
def admin_comment_review(review_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role not in ['admin', 'staff']:
        return jsonify({'error': 'Unauthorized'}), 403

    review = Review.query.get(review_id)
    if not review:
        return jsonify({'error': 'Review not found'}), 404

    data = request.json
    admin_comment = data.get('admin_comment')

    review.admin_comment = admin_comment
    db.session.commit()

    return jsonify({
        'message': 'Admin comment updated successfully',
        'review_id': review.id,
        'admin_comment': review.admin_comment
    }), 200
