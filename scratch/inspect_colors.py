import os
from PIL import Image

img = Image.open('logo.png').convert('RGBA')
width, height = img.size

# Find dominant colors
colors = {}
for p in img.getdata():
    if p[3] > 50: # non-transparent
        r, g, b, a = p
        # bucket colors slightly to find clusters
        key = (round(r/10)*10, round(g/10)*10, round(b/10)*10)
        colors[key] = colors.get(key, 0) + 1

# Sort by frequency
sorted_colors = sorted(colors.items(), key=lambda x: x[1], reverse=True)
print("Top color clusters:")
for c, count in sorted_colors[:15]:
    print(f"RGB {c}: {count} pixels ({count / (width*height) * 100:.2f}%)")
