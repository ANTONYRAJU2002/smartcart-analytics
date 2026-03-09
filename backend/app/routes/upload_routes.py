import os
from flask import Blueprint, request, jsonify, current_app, url_for
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required

upload_bp = Blueprint('upload', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route('', methods=['POST'])
@upload_bp.route('/', methods=['POST'])
@jwt_required()
def upload_file():
    print(f"DEBUG: Upload request received. Files keys: {list(request.files.keys())}")
    if 'files[]' not in request.files:
        # Fallback for 'files' key
        if 'files' in request.files:
             files = request.files.getlist('files')
        else:
             return jsonify({'msg': f'No file part. Received keys: {list(request.files.keys())}'}), 400
    else:
        files = request.files.getlist('files[]')
    
    uploaded_urls = []
    
    for file in files:
        if file.filename == '':
            continue
            
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Make unique to prevent overwrite
            import uuid
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(file_path)
            
            # Generate URL
            # Assuming backend is serving static files from /static
            url = f"http://localhost:5000/static/uploads/{unique_filename}"
            uploaded_urls.append(url)
            
    return jsonify({'urls': uploaded_urls}), 201
