import os
import subprocess
import xml.etree.ElementTree as ET
from PIL import Image

ROOT = "/var/www/UK_Grocery"
SOURCE_LOGO_PATH = os.path.join(ROOT, "logo.png")

img = Image.open(SOURCE_LOGO_PATH).convert('RGBA')
width, height = img.size

# We will create 3 binary masks (Red, Navy, Green) + 1 Leaf Cutout (White)
# We make background 255 (white) and foreground 0 (black) in RGB/L mode, then convert to 1-bit
# In Netpbm PBM format: 1 is black (foreground to be traced by potrace), 0 is white (background)

def get_mask(condition_fn):
    # Create grayscale 'L' mode: 255 background, 0 foreground
    mask_img = Image.new('L', (width, height), 255)
    pixels = img.load()
    mask_pixels = mask_img.load()
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > 40 and condition_fn(r, g, b):
                mask_pixels[x, y] = 0 # Foreground (black)
    # Convert to 1-bit
    return mask_img.convert('1')

# Define layer conditions
def is_navy(r, g, b):
    return b > 50 and r < 80 and g < 100

def is_red(r, g, b):
    return r > 140 and g < 90 and b < 90

def is_green(r, g, b):
    return g > 90 and r < 130 and b < 110

def is_leaf_cutout(r, g, b):
    return r > 200 and g > 200 and b > 200

layers = [
    ('navy', is_navy, '#001D3D'),
    ('red', is_red, '#E6203A'),
    ('green', is_green, '#16A34A'),
    ('cutout', is_leaf_cutout, '#FFFFFF'),
]

all_paths = []

for name, cond_fn, color in layers:
    mask = get_mask(cond_fn)
    pbm_path = f"/tmp/{name}.pbm"
    svg_path = f"/tmp/{name}.svg"
    mask.save(pbm_path)
    
    subprocess.run([
        'potrace',
        pbm_path,
        '-s',
        '-o', svg_path,
        '--turnpolicy', 'minority',
        '--alphamax', '1.0',
        '--opttolerance', '0.2',
    ], check=True)
    
    # Parse potrace SVG
    tree = ET.parse(svg_path)
    root = tree.getroot()
    
    # Extract viewBox or dimensions
    viewBox = root.attrib.get('viewBox', f'0 0 {width} {height}')
    
    for g in root.iter('{http://www.w3.org/2000/svg}g'):
        transform = g.attrib.get('transform', '')
        for p in g.iter('{http://www.w3.org/2000/svg}path'):
            d = p.attrib.get('d', '')
            if d:
                all_paths.append((name, transform, color, d))

# Build clean unified SVG
svg_body = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1254 1254" width="100%" height="100%" shape-rendering="geometricPrecision">']
svg_body.append('  <title>Daily Grocer Logo</title>')
svg_body.append('  <g id="daily-grocer-icon">')

for name, transform, color, d in all_paths:
    svg_body.append(f'    <g id="{name}" transform="{transform}" fill="{color}" stroke="none">')
    svg_body.append(f'      <path d="{d}" />')
    svg_body.append('    </g>')

svg_body.append('  </g>')
svg_body.append('</svg>')

final_svg = '\n'.join(svg_body)
output_svg = os.path.join(ROOT, "logo.svg")
with open(output_svg, 'w') as f:
    f.write(final_svg)

print("SVG generated. Testing rendering with rsvg-convert...")
subprocess.run(['rsvg-convert', '-w', '1024', '-h', '1024', output_svg, '-o', '/tmp/svg_test_final.png'], check=True)
print("Rendering complete.")
