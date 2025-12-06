from sqlalchemy.orm import Session
from app.models.all_models import FaceEmbedding
from typing import Tuple
import json
import base64
import numpy as np  # NumPy is always required for embeddings

# OpenCV is optional and may fail in headless environments
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("⚠ OpenCV not available. Face services will operate in mock mode.")

# Global InsightFace app instance (lazy loaded)
_face_app = None

def get_face_app():
    """
    Lazy load InsightFace FaceAnalysis app (singleton pattern).
    This avoids loading the model on every function call.
    """
    global _face_app
    if _face_app is None:
        try:
            from insightface.app import FaceAnalysis
            _face_app = FaceAnalysis(providers=['CPUExecutionProvider'])
            _face_app.prepare(ctx_id=0, det_size=(640, 640))
            print("✓ InsightFace model loaded successfully")
        except Exception as e:
            print(f"⚠ InsightFace failed to load: {e}")
            print("⚠ Falling back to mock face recognition")
            _face_app = "mock"  # Use string to indicate fallback
    return _face_app

def base64_to_image(base64_str: str):
    """
    Convert base64 string to OpenCV image (numpy array).
    Handles both data URI and raw base64.
    """
    if not CV2_AVAILABLE:
        raise ImportError("OpenCV is not available")

    # Remove data URI prefix if present
    if ',' in base64_str:
        base64_str = base64_str.split(',')[1]
    
    # Decode base64
    img_data = base64.b64decode(base64_str)
    nparr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise ValueError("Failed to decode image from base64")
    
    return img

def generate_face_embedding(image_base64: str) -> str:
    """
    Generate face embedding from base64 image using InsightFace.
    Returns a JSON string of the 512-dimensional embedding vector.
    Falls back to mock implementation if InsightFace unavailable.
    """
    app = get_face_app()
    
    # Fallback to mock if InsightFace failed to load OR OpenCV is missing
    if app == "mock" or not CV2_AVAILABLE:
        print("⚠ Using Mock Face Embedding (CV2/InsightFace unavailable)")
        return _generate_mock_embedding(image_base64)
    
    try:
        # Convert base64 to image
        img = base64_to_image(image_base64)
        
        # Detect faces and get embeddings
        faces = app.get(img)
        
        if len(faces) == 0:
            raise ValueError("No face detected in image")
        
        if len(faces) > 1:
            print(f"⚠ Multiple faces detected ({len(faces)}), using the largest face")
        
        # Use the face with the largest bounding box (most prominent)
        face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
        
        # Get the 512-dimensional embedding
        embedding = face.embedding.tolist()
        
        return json.dumps(embedding)
        
    except Exception as e:
        print(f"⚠ InsightFace embedding generation failed: {e}")
        print("⚠ Falling back to mock embedding")
        return _generate_mock_embedding(image_base64)

def _generate_mock_embedding(image_base64: str) -> str:
    """
    Fallback mock embedding generation using deterministic hashing.
    """
    import hashlib
    
    # Generate a longer hash to avoid wrap-around issues
    image_hash = hashlib.sha256(image_base64.encode()).hexdigest()
    # Double it to ensure we have enough characters
    extended_hash = image_hash + image_hash
    
    # Create a mock 512-dimensional embedding (matching InsightFace dimension)
    embedding = []
    for i in range(512):
        # Get 4 characters for each dimension (ensures valid hex)
        start = (i * 4) % len(image_hash)
        hash_slice = extended_hash[start:start + 4]
        value = int(hash_slice, 16) / 65535.0  # Normalize to 0-1
        embedding.append(value)
    
    return json.dumps(embedding)

def compare_embeddings(embedding1: str, embedding2: str) -> Tuple[bool, float]:
    """
    Compare two face embeddings using cosine similarity.
    Returns: (is_match: bool, confidence: float)
    """
    try:
        vec1 = np.array(json.loads(embedding1))
        vec2 = np.array(json.loads(embedding2))
        
        # Cosine similarity
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        similarity = dot_product / (norm1 * norm2) if norm1 and norm2 else 0.0
        confidence = float(abs(similarity))
        
        # Threshold for match (0.4-0.6 is typical for ArcFace embeddings)
        # InsightFace embeddings are normalized, so similarity > 0.4 is a good match
        is_match = confidence > 0.4
        
        return is_match, confidence
        
    except Exception as e:
        print(f"⚠ Embedding comparison failed: {e}")
        return False, 0.0

def check_duplicate_face(embedding: str, db: Session, exclude_user_id: int = None) -> Tuple[bool, int]:
    """
    Check if face embedding matches any existing user's face.
    Returns: (is_duplicate: bool, matched_user_id: int or None)
    """
    all_embeddings = db.query(FaceEmbedding).all()
    
    for face_emb in all_embeddings:
        # Skip if this is the same user (for updates)
        if exclude_user_id and face_emb.user_id == exclude_user_id:
            continue
            
        is_match, confidence = compare_embeddings(embedding, face_emb.embedding_data)
        
        # Stricter threshold for duplicate detection (0.6 = 60% similarity)
        if is_match and confidence > 0.6:
            print(f"⚠ Duplicate face detected: User {face_emb.user_id} with {confidence:.2%} confidence")
            return True, face_emb.user_id
    
    return False, None

def save_face_embedding(user_id: int, embedding: str, db: Session) -> FaceEmbedding:
    """
    Save or update face embedding for a user.
    """
    existing = db.query(FaceEmbedding).filter(FaceEmbedding.user_id == user_id).first()
    
    if existing:
        existing.embedding_data = embedding
        existing.is_duplicate = False
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new_embedding = FaceEmbedding(
            user_id=user_id,
            embedding_data=embedding,
            is_duplicate=False
        )
        db.add(new_embedding)
        db.commit()
        db.refresh(new_embedding)
        return new_embedding
