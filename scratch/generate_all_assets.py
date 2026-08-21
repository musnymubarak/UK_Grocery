import os
import json
from PIL import Image

ROOT = "/var/www/UK_Grocery"
SOURCE_LOGO_PATH = os.path.join(ROOT, "logo.png")

print(f"Loading master logo from {SOURCE_LOGO_PATH}...")
master = Image.open(SOURCE_LOGO_PATH).convert("RGBA")
width, height = master.size

# Function to create padded square image
def create_square(img, target_size, padding_ratio=0.08, bg_color=None):
    """Places img inside a target_size x target_size canvas with given padding."""
    if bg_color is None:
        canvas = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    else:
        canvas = Image.new("RGBA", (target_size, target_size), bg_color)
    
    # Calculate fit size with padding
    usable_size = int(target_size * (1.0 - 2 * padding_ratio))
    aspect = img.width / img.height
    if aspect >= 1.0:
        w = usable_size
        h = int(usable_size / aspect)
    else:
        h = usable_size
        w = int(usable_size * aspect)
    
    resized = img.resize((w, h), Image.Resampling.LANCZOS)
    x = (target_size - w) // 2
    y = (target_size - h) // 2
    canvas.paste(resized, (x, y), resized if resized.mode == "RGBA" else None)
    return canvas

def make_jpeg(rgba_img, bg_color=(255, 255, 255)):
    rgb = Image.new("RGB", rgba_img.size, bg_color)
    rgb.paste(rgba_img, (0, 0), rgba_img)
    return rgb

# 1. Root assets
print("1. Generating Root Directory Assets...")
# Standard app_logo (1024x1024 transparent)
app_logo_1024 = create_square(master, 1024, padding_ratio=0.05)
app_logo_1024.save(os.path.join(ROOT, "app_logo.png"), "PNG")
app_logo_1024.save(os.path.join(ROOT, "Logo_latest.png"), "PNG")
app_logo_1024.save(os.path.join(ROOT, "Logo_transparent.png"), "PNG")
app_logo_1024.save(os.path.join(ROOT, "Logo_cropped.png"), "PNG")

# JPEG versions (with pure white background)
jpeg_ver = make_jpeg(app_logo_1024, (255, 255, 255))
jpeg_ver.save(os.path.join(ROOT, "logo.jpeg"), "JPEG", quality=95)
jpeg_ver.save(os.path.join(ROOT, "Logo_latest.jpeg"), "JPEG", quality=95)

# 2. Storefront assets
print("2. Generating Storefront Assets...")
sf_pub = os.path.join(ROOT, "storefront", "public")
os.makedirs(sf_pub, exist_ok=True)
app_logo_1024.save(os.path.join(sf_pub, "logo.png"), "PNG")
app_logo_1024.save(os.path.join(sf_pub, "logo_playful.png"), "PNG")
app_logo_1024.save(os.path.join(sf_pub, "logo_wide.png"), "PNG")
app_logo_1024.save(os.path.join(sf_pub, "daily_grocer_logo_1778351976804.png"), "PNG")

# Favicons & Touch Icons
fav_192 = create_square(master, 192, padding_ratio=0.04)
fav_192.save(os.path.join(sf_pub, "favicon.png"), "PNG")
fav_180 = create_square(master, 180, padding_ratio=0.04)
fav_180.save(os.path.join(sf_pub, "apple-touch-icon.png"), "PNG")

# Multi-resolution ICO
ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128)]
master.save(os.path.join(sf_pub, "favicon.ico"), format="ICO", sizes=ico_sizes)

# 3. Admin assets
print("3. Generating Admin Portal Assets...")
admin_pub = os.path.join(ROOT, "admin", "public")
os.makedirs(admin_pub, exist_ok=True)
app_logo_1024.save(os.path.join(admin_pub, "logo.png"), "PNG")
fav_192.save(os.path.join(admin_pub, "favicon.png"), "PNG")
fav_180.save(os.path.join(admin_pub, "apple-touch-icon.png"), "PNG")
master.save(os.path.join(admin_pub, "favicon.ico"), format="ICO", sizes=ico_sizes)

# 4. Mobile assets (assets folder)
print("4. Generating Mobile Assets...")
mob_assets = os.path.join(ROOT, "mobile", "assets")
os.makedirs(mob_assets, exist_ok=True)
app_logo_1024.save(os.path.join(mob_assets, "app_logo.png"), "PNG")
app_logo_1024.save(os.path.join(mob_assets, "logo_playful.png"), "PNG")
app_logo_1024.save(os.path.join(mob_assets, "logo.png"), "PNG")

# 5. Android Mipmaps & Drawables
print("5. Generating Android Launcher Icons...")
android_res = os.path.join(ROOT, "mobile", "android", "app", "src", "main", "res")

# mipmap icons (standard full launcher icon with white or transparent bg)
mipmap_sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

for folder, sz in mipmap_sizes.items():
    d = os.path.join(android_res, folder)
    os.makedirs(d, exist_ok=True)
    icon = create_square(master, sz, padding_ratio=0.08, bg_color=(255, 255, 255, 255))
    icon.save(os.path.join(d, "ic_launcher.png"), "PNG")

# Adaptive icon foregrounds (108x108 grid with 72x72 viewport, so ~18/108 padding ratio)
drawable_sizes = {
    "drawable-mdpi": 108,
    "drawable-hdpi": 162,
    "drawable-xhdpi": 216,
    "drawable-xxhdpi": 324,
    "drawable-xxxhdpi": 432,
}

for folder, sz in drawable_sizes.items():
    d = os.path.join(android_res, folder)
    os.makedirs(d, exist_ok=True)
    fg = create_square(master, sz, padding_ratio=0.18, bg_color=None)
    fg.save(os.path.join(d, "ic_launcher_foreground.png"), "PNG")

# 6. iOS AppIcon Set
print("6. Generating iOS AppIcon Set...")
ios_appicon_dir = os.path.join(ROOT, "mobile", "ios", "Runner", "Assets.xcassets", "AppIcon.appiconset")
contents_path = os.path.join(ios_appicon_dir, "Contents.json")

if os.path.exists(contents_path):
    with open(contents_path, "r") as f:
        data = json.load(f)
    
    for entry in data.get("images", []):
        filename = entry.get("filename")
        if not filename:
            continue
        size_str = entry.get("size", "60x60")
        scale_str = entry.get("scale", "1x")
        
        # Calculate pixel dimensions
        base_w, base_h = [float(x) for x in size_str.split("x")]
        scale_val = float(scale_str.replace("x", ""))
        px_w = int(round(base_w * scale_val))
        px_h = int(round(base_h * scale_val))
        
        is_dark = False
        if "appearances" in entry:
            for app in entry["appearances"]:
                if app.get("appearance") == "luminosity" and app.get("value") == "dark":
                    is_dark = True
        
        if "Dark" in filename or is_dark:
            # Deep Navy background (#001D3D -> 0, 29, 61)
            icon_img = create_square(master, px_w, padding_ratio=0.08, bg_color=(0, 29, 61, 255))
        else:
            # Clean White background (#FFFFFF) for iOS App Store standard
            icon_img = create_square(master, px_w, padding_ratio=0.08, bg_color=(255, 255, 255, 255))
        
        target_file = os.path.join(ios_appicon_dir, filename)
        icon_img.save(target_file, "PNG")
        print(f"  Generated {filename} ({px_w}x{px_h})")

# 7. iOS Launch Images
print("7. Generating iOS Launch Images...")
ios_launch_dir = os.path.join(ROOT, "mobile", "ios", "Runner", "Assets.xcassets", "LaunchImage.imageset")
if os.path.exists(ios_launch_dir):
    launch_1x = create_square(master, 200, padding_ratio=0.05)
    launch_2x = create_square(master, 400, padding_ratio=0.05)
    launch_3x = create_square(master, 600, padding_ratio=0.05)
    launch_1x.save(os.path.join(ios_launch_dir, "LaunchImage.png"), "PNG")
    launch_2x.save(os.path.join(ios_launch_dir, "LaunchImage@2x.png"), "PNG")
    launch_3x.save(os.path.join(ios_launch_dir, "LaunchImage@3x.png"), "PNG")

# 8. Windows Runner Icon
print("8. Generating Windows Icon...")
win_res = os.path.join(ROOT, "mobile", "windows", "runner", "resources")
if os.path.exists(win_res):
    master.save(os.path.join(win_res, "app_icon.ico"), format="ICO", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

print("All asset files generated successfully!")
