import random
import hashlib
import json

def mock_face_embedding(image_base64: str) -> str:
    """
    Mock face embedding generation using deterministic hashing.
    In production, this would use a real ML model (FaceNet, ArcFace, etc.)
    Returns a JSON string representing a 128-dimensional embedding vector.
    """
    # Generate a deterministic but unique embedding based on image hash
    image_hash = hashlib.sha256(image_base64.encode()).hexdigest()
    
    # Create a mock embedding vector (128 dimensions)
    embedding = []
    for i in range(128):
        # Use portions of the hash to generate float values between 0 and 1
        hash_slice = image_hash[(i * 2) % len(image_hash):(i * 2 + 4) % len(image_hash)]
        value = int(hash_slice, 16) / 65535.0  # Normalize to 0-1
        embedding.append(value)
    
    return json.dumps(embedding)

def mock_face_match(embedding1: str, embedding2: str) -> dict:
    """
    Mock face matching using cosine similarity.
    In production, this would use proper vector similarity metrics.
    Returns: {'match': bool, 'confidence': float, 'explanation': str}
    """
    try:
        vec1 = json.loads(embedding1)
        vec2 = json.loads(embedding2)
        
        # Calculate cosine similarity
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = sum(a * a for a in vec1) ** 0.5
        norm2 = sum(b * b for b in vec2) ** 0.5
        
        similarity = dot_product / (norm1 * norm2) if norm1 and norm2 else 0.0
        confidence = float(abs(similarity))
        
        # Threshold for match (0.85 = 85% similarity)
        is_match = confidence > 0.85
        
        return {
            'match': is_match,
            'confidence': confidence,
            'explanation': f"Face {'matched' if is_match else 'did not match'} with {confidence:.2%} confidence"
        }
    except Exception as e:
        return {
            'match': False,
            'confidence': 0.0,
            'explanation': f"Error comparing embeddings: {str(e)}"
        }

def mock_fraud_score(user_data: dict) -> dict:
    score = random.uniform(0, 100)
    risk = "LOW"
    if score > 50: risk = "MEDIUM"
    if score > 80: risk = "HIGH"
    return {
        "score": score,
        "risk_level": risk,
        "explanation": ["IP address mismatch", "Unusual booking time"] if score > 50 else ["Clean history"]
    }

def mock_anomaly_detection(data: dict) -> dict:
    is_anomaly = random.choice([True, False])
    return {
        "anomaly": is_anomaly,
        "confidence": random.uniform(0.6, 0.95),
        "explanation": ["Spike in requests"] if is_anomaly else ["Normal pattern"]
    }

def mock_recommendations(user_id: int) -> list:
    options = ["Spa Package", "Late Checkout", "City Tour", "Room Upgrade"]
    return random.sample(options, 2)
