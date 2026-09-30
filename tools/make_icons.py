"""Builds the app icons and the sharp header logo from assets/brand/alma-gold-a.png.
Run from the repo root: python3 tools/make_icons.py"""
from PIL import Image, ImageDraw

GREEN = (0, 56, 16, 255)
SRC = Image.open("app/public/brand/alma-gold-a.png").convert("RGBA")

def square(size, fill, radius=0.0, scale=0.9):
    """Gold A centered on dark green. Drawn at 4x and reduced so edges stay clean."""
    big = size * 4
    canvas = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    bg = Image.new("RGBA", (big, big), GREEN)
    mask = Image.new("L", (big, big), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, big - 1, big - 1), radius=int(big * radius), fill=255)
    canvas.paste(bg, (0, 0), mask)
    w = int(big * scale)
    h = int(w * SRC.height / SRC.width)
    a = SRC.resize((w, h), Image.LANCZOS)
    canvas.alpha_composite(a, ((big - w) // 2, (big - h) // 2))
    return canvas.resize((size, size), Image.LANCZOS)

# Browser tab and home-screen icons
square(512, GREEN, radius=0.18, scale=0.86).save("app/src/app/icon.png")
square(180, GREEN, radius=0.0, scale=0.86).convert("RGB").save("app/src/app/apple-icon.png")
square(180, GREEN, radius=0.0, scale=0.86).convert("RGB").save("app/public/icons/apple-touch-icon.png")
square(192, GREEN, radius=0.0, scale=0.86).convert("RGB").save("app/public/icons/icon-192.png")
square(512, GREEN, radius=0.0, scale=0.86).convert("RGB").save("app/public/icons/icon-512.png")
square(512, GREEN, radius=0.0, scale=0.62).convert("RGB").save("app/public/icons/icon-maskable-512.png")  # inside the safe zone
# favicon.ico: bigger mark at tiny sizes so it still reads
sizes = [(16, 0.96), (32, 0.94), (48, 0.92)]
imgs = [square(s, GREEN, radius=0.12, scale=sc) for s, sc in sizes]
imgs[-1].save("app/src/app/favicon.ico", format="ICO", sizes=[(s, s) for s, _ in sizes], append_images=imgs[:-1])

# Header logo at 3x of its display size (display: 48x28 css px) so it is crisp on retina screens
w = 144
SRC.resize((w, round(w * SRC.height / SRC.width)), Image.LANCZOS).save("app/public/brand/alma-gold-a-header.png", optimize=True)
print("ok")
