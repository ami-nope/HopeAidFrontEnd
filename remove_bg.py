from PIL import Image

def remove_white_bg(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        r, g, b, a = item
        # If it's pure white or very close, make it fully transparent
        if r > 245 and g > 245 and b > 245:
            newData.append((255, 255, 255, 0))
        # Smooth transition for anti-aliased edges
        elif r > 200 and g > 200 and b > 200:
            intensity = (r + g + b) / 3
            # alpha goes from 255 at intensity 200, to 0 at intensity 255
            alpha = int(255 * (255 - intensity) / 55)
            newData.append((r, g, b, alpha))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")

remove_white_bg(
    r"c:\Users\amiya\Desktop\Google Hack\HopeAidBackend\HopeAidFrontEnd\Resources\ChatGPT Image Apr 28, 2026, 01_28_48 AM.png",
    r"c:\Users\amiya\Desktop\Google Hack\HopeAidBackend\HopeAidFrontEnd\public\images\hopeaid-logo-final.png"
)
