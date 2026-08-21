from PIL import Image

img = Image.open('logo.png')
print("Mode:", img.mode, "Size:", img.size)

# Check corner pixel
print("Top-left pixel (0,0):", img.getpixel((0, 0)))
print("Top-right pixel:", img.getpixel((img.width - 1, 0)))
print("Bottom-left pixel:", img.getpixel((0, img.height - 1)))
print("Bottom-right pixel:", img.getpixel((img.width - 1, img.height - 1)))

# Check bounding box
# If RGBA, getbbox() checks non-zero alpha
bbox = img.getbbox()
print("RGBA bounding box (non-zero alpha):", bbox)

# Check if image has solid white background or transparent background
# Convert to RGBA if not
rgba = img.convert("RGBA")
# Check how many pixels have alpha < 255
alpha_data = [p[3] for p in rgba.getdata()]
transparent_pixels = sum(1 for a in alpha_data if a < 250)
print(f"Transparent pixels (<250 alpha): {transparent_pixels} / {len(alpha_data)}")

# Let's also check color distribution of background
# Sample border pixels
border_pixels = []
for x in range(img.width):
    border_pixels.append(rgba.getpixel((x, 0)))
    border_pixels.append(rgba.getpixel((x, img.height - 1)))
for y in range(img.height):
    border_pixels.append(rgba.getpixel((0, y)))
    border_pixels.append(rgba.getpixel((img.width - 1, y)))

print("Sample border pixels (first 10):", border_pixels[:10])
