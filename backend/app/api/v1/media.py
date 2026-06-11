"""
Media API — generic admin image uploads for CMS content (home sections, banners).

Slides/cards live in JSONB section config (no owning row), so the admin first
uploads an image here, gets back a URL, then stores that URL in the section.
"""
from fastapi import APIRouter, Depends, UploadFile, File

from app.core.dependencies import require_role
from app.models.user import User
from app.services.uploads import save_image_upload

router = APIRouter(prefix="/media", tags=["Media (CMS)"])

# Restrict the destination folder to a safe allow-list (no path traversal).
ALLOWED_SUBDIRS = {"home", "banners", "sections"}


@router.post("/image", summary="Upload a CMS image")
async def upload_image(
    image: UploadFile = File(...),
    subdir: str = "home",
    current_user: User = Depends(require_role(["admin", "manager"])),
):
    """Admin/manager: upload an image and get its public URL for section config."""
    safe_subdir = subdir if subdir in ALLOWED_SUBDIRS else "home"
    url = await save_image_upload(image, safe_subdir)
    return {"url": url}
