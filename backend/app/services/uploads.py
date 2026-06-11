"""
Generic image upload helper for CMS content (home sections, banners, ...).

Mirrors the validation/persist pipeline of ProductService.upload_product_image
but is decoupled from any one entity, since slides live in JSONB config and have
no owning row id. Returns the public relative URL ("/uploads/<subdir>/<file>")
which nginx serves in prod and the app mounts at /uploads in DEBUG.
"""
import os
import uuid

from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import ValidationException

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB


async def save_image_upload(image: UploadFile, subdir: str = "home") -> str:
    """Validate an uploaded image and persist it under UPLOAD_DIR/<subdir>/."""
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise ValidationException(
            f"Invalid file type '{image.content_type}'. "
            f"Allowed: {', '.join(sorted(ALLOWED_IMAGE_TYPES))}"
        )

    contents = await image.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise ValidationException(
            f"File too large ({len(contents)} bytes). Maximum: {MAX_IMAGE_SIZE} bytes"
        )

    target_dir = os.path.join(settings.UPLOAD_DIR, subdir)
    os.makedirs(target_dir, exist_ok=True)

    safe_ext = os.path.splitext(image.filename or ".jpg")[1].lower()
    if safe_ext not in ALLOWED_EXTS:
        safe_ext = ".jpg"

    filename = f"{subdir}_{uuid.uuid4().hex}{safe_ext}"
    file_path = os.path.join(target_dir, filename)

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    # Forward slashes for the URL regardless of OS path separator.
    return f"/uploads/{subdir}/{filename}"
