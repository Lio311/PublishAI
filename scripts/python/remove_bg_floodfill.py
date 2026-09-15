import sys
import collections
from PIL import Image

def remove_bg(img_path):
    try:
        print(f"Processing {img_path}...")
        img = Image.open(img_path).convert("RGBA")
        
        # We will do a BFS from the corners to find all connected background pixels.
        width, height = img.size
        pixels = img.load()
        
        # Define what is "background"
        def is_bg(c):
            return c[0] > 240 and c[1] > 240 and c[2] > 240
            
        visited = set()
        queue = collections.deque()
        
        corners = [(0,0), (width-1, 0), (0, height-1), (width-1, height-1)]
        for c in corners:
            if is_bg(pixels[c[0], c[1]]):
                queue.append(c)
                visited.add(c)
                
        # flood fill
        while queue:
            x, y = queue.popleft()
            # make transparent
            pixels[x, y] = (255, 255, 255, 0)
            
            for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                nx, ny = x+dx, y+dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        visited.add((nx, ny))
                        if is_bg(pixels[nx, ny]):
                            queue.append((nx, ny))
                            
        out_path = img_path + '_nobg.png'
        img.save(out_path, "PNG")
        print(f"Saved {out_path}")
    except Exception as e:
        print(f"Error processing {img_path}: {e}")

if __name__ == "__main__":
    for path in sys.argv[1:]:
        remove_bg(path)
