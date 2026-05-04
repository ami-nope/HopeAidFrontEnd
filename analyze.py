from PIL import Image
import numpy as np

img = Image.open(r"c:\Users\amiya\Desktop\Google Hack\HopeAidBackend\HopeAidFrontEnd\public\images\hopeaid-logo-final.png")
data = np.array(img)
alpha = data[:, :, 3]

row_sums = np.sum(alpha > 50, axis=1)

# Find the gap near the bottom
height = len(row_sums)
for y in range(height - 1, 0, -1):
    print(f"Row {y}: {row_sums[y]}")
