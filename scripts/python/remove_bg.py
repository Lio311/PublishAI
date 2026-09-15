import sys
from PIL import Image

def remove_white_bg(img_path):
    try:
        print(f"Processing {img_path}...")
        img = Image.open(img_path).convert("RGBA")
        data = img.getdata()
        
        new_data = []
        # simple approach: if pixel is white or very close to white, make it transparent
        for item in data:
            # item is (R, G, B, A)
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
                
        img.putdata(new_data)
        out_path = img_path + '_nobg.png'
        img.save(out_path, "PNG")
        print(f"Saved {out_path}")
    except Exception as e:
        print(f"Error processing {img_path}: {e}")

if __name__ == "__main__":
    for path in sys.argv[1:]:
        remove_white_bg(path)
