from PIL import Image

def process_logos(input_path, output_light, output_dark):
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    
    # Isolate the tagline
    tagline_box = (173, 169, w, 185)
    tagline = img.crop(tagline_box)
    
    # Scale the tagline by 1.5x
    scale = 1.5
    new_tw = int(tagline.width * scale)
    new_th = int(tagline.height * scale)
    tagline_scaled = tagline.resize((new_tw, new_th), Image.Resampling.LANCZOS)
    
    new_w = max(w, 173 + new_tw)
    new_h = h + 20
    
    # Create Light Mode Image
    light_img = Image.new("RGBA", (new_w, new_h), (0,0,0,0))
    light_img.paste(img, (0, 0))
    
    # Erase old tagline area
    pixels = light_img.load()
    for y in range(169, 185):
        for x in range(173, w):
            pixels[x, y] = (0,0,0,0)
            
    # Paste new scaled tagline, moved up significantly to close the gap!
    paste_x = 173 + (w - 173 - tagline.width) // 2
    if paste_x < 173: paste_x = 173
    paste_y = 155 # Moved up from 173 to 155 to close the gap!
    
    temp_canvas = Image.new("RGBA", (new_w, new_h), (0,0,0,0))
    temp_canvas.paste(tagline_scaled, (paste_x, paste_y))
    light_img = Image.alpha_composite(light_img, temp_canvas)
    
    light_img.save(output_light, "PNG")
    print(f"Saved light logo: {output_light}")
    
    # Create Dark Mode Image
    dark_img = light_img.copy()
    data = dark_img.getdata()
    new_data = []
    for i, item in enumerate(data):
        x = i % new_w
        r, g, b, a = item
        if x >= 170 and a > 0:
            new_data.append((255, 255, 255, a))
        else:
            new_data.append(item)
    dark_img.putdata(new_data)
    dark_img.save(output_dark, "PNG")
    print(f"Saved dark logo: {output_dark}")

process_logos(
    r"c:\Users\amiya\Desktop\Google Hack\HopeAidBackend\HopeAidFrontEnd\public\images\hopeaid-logo-final.png",
    r"c:\Users\amiya\Desktop\Google Hack\HopeAidBackend\HopeAidFrontEnd\public\images\hopeaid-logo-final-light.png",
    r"c:\Users\amiya\Desktop\Google Hack\HopeAidBackend\HopeAidFrontEnd\public\images\hopeaid-logo-final-dark.png"
)
