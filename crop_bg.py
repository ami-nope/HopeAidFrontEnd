from PIL import Image

def aggressive_crop(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    width, height = img.size
    
    min_x = width
    min_y = height
    max_x = 0
    max_y = 0
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = data[y * width + x]
            # Ignore highly transparent pixels and watermarks in the corner
            if a > 50:
                if x < min_x: min_x = x
                if y < min_y: min_y = y
                if x > max_x: max_x = x
                if y > max_y: max_y = y
                
    if max_x >= min_x and max_y >= min_y:
        # Add a tiny 5px padding
        min_x = max(0, min_x - 5)
        min_y = max(0, min_y - 5)
        max_x = min(width, max_x + 5)
        max_y = min(height, max_y + 5)
        
        box = (min_x, min_y, max_x, max_y)
        cropped = img.crop(box)
        cropped.save(output_path, "PNG")
        print(f"Aggressively cropped from {img.size} to {cropped.size} with box {box}")
    else:
        print("Could not find solid pixels.")

aggressive_crop(
    r"c:\Users\amiya\Desktop\Google Hack\HopeAidBackend\HopeAidFrontEnd\public\images\hopeaid-logo-final.png",
    r"c:\Users\amiya\Desktop\Google Hack\HopeAidBackend\HopeAidFrontEnd\public\images\hopeaid-logo-cropped.png"
)
