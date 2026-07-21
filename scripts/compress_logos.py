import os
from PIL import Image

logo_path = r"c:\Users\caenb\Projects\Vida Eterna\public\logo.png"
logo01_path = r"c:\Users\caenb\Projects\Vida Eterna\src\assets\logo01.png"

def compress_image(path, max_size=(512, 512)):
    if not os.path.exists(path):
        print(f"Error: {path} not found.")
        return
        
    print(f"Compressing {path}...")
    size_before = os.path.getsize(path)
    
    img = Image.open(path)
    img.thumbnail(max_size, Image.Resampling.LANCZOS)
    
    # Save optimized
    img.save(path, "PNG", optimize=True)
    
    size_after = os.path.getsize(path)
    print(f"Optimized {path}: {size_before/1024/1024:.2f}MB -> {size_after/1024:.2f}KB")

# Optimize public/logo.png (512x512 max size for PWA icon and sharing)
compress_image(logo_path, (512, 512))

# Optimize src/assets/logo01.png (400x400 max size for header)
compress_image(logo01_path, (400, 400))
