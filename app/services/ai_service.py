from app.utils.ai_mock import mock_fraud_score, mock_anomaly_detection, mock_recommendations

def get_fraud_score():
    return mock_fraud_score({})

def detect_anomaly():
    return mock_anomaly_detection({})

def get_recommendations(guest_id: int):
    return mock_recommendations(guest_id)

def get_id_fraud_score():
    return {
        "score": 15,
        "riskLevel": "LOW",
        "details": "ID valid, Face match confirmed"
    }

def get_churn_prediction(guest_id: int):
    return {
        "churn_probability": 0.15,
        "risk_level": "LOW"
    }
