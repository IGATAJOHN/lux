import cloudinary
import cloudinary.uploader
from app.core.config import settings
import base64
import io

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

def upload_base64_image(base64_image: str, folder: str = "hotel_guests") -> str:
    """
    Upload a base64 encoded image to Cloudinary.
    Returns the secure URL of the uploaded image.
    """
    try:
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            base64_image,
            folder=folder,
            resource_type="image"
        )
        
        return result['secure_url']
    except Exception as e:
        print(f"Cloudinary upload failed: {str(e)}")
        # Fallback: return the base64 image if Cloudinary fails
        return base64_image

def delete_image(public_id: str) -> bool:
    """
    Delete an image from Cloudinary using its public ID.
    """
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result.get('result') == 'ok'
    except Exception as e:
        print(f"Cloudinary delete failed: {str(e)}")
        return False
