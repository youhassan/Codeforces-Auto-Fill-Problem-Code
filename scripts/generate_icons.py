import zlib
import struct
import os

def create_png(size, filename):
    width = size
    height = size
    raw_data = []

    # Clean white background with rounded corner border
    bg_r, bg_g, bg_b, bg_a = (255, 255, 255, 255)
    border_r, border_g, border_b, border_a = (226, 232, 240, 255) # light gray border
    radius = size * 0.22
    border_width = max(1, int(size * 0.04))
    
    for y in range(height):
        row = [0] # filter type 0 (None)
        for x in range(width):
            dx = max(0, max(radius - x, x - (width - 1 - radius)))
            dy = max(0, max(radius - y, y - (height - 1 - radius)))
            dist_sq = dx * dx + dy * dy
            
            if dist_sq > radius * radius:
                # Transparent outside
                row.extend([0, 0, 0, 0])
                continue
                
            nx = x / width
            ny = y / height
            
            # Default background / border
            r, g, b, a = bg_r, bg_g, bg_b, bg_a
            
            # Subtle outer border
            if (x < border_width or x >= width - border_width or
                y < border_width or y >= height - border_width or
                dist_sq > (radius - border_width) * (radius - border_width)):
                r, g, b, a = border_r, border_g, border_b, border_a
            
            # Codeforces 3 vertical bars:
            # Yellow bar (left)
            if 0.20 <= nx <= 0.36 and 0.44 <= ny <= 0.80:
                r, g, b, a = 245, 158, 11, 255 # #f59e0b
            # Blue bar (center)
            elif 0.42 <= nx <= 0.58 and 0.20 <= ny <= 0.80:
                r, g, b, a = 49, 140, 231, 255 # #318ce7 (Codeforces Blue)
            # Red bar (right)
            elif 0.64 <= nx <= 0.80 and 0.34 <= ny <= 0.80:
                r, g, b, a = 239, 68, 68, 255 # #ef4444 (Codeforces Red)
            
            row.extend([r, g, b, a])
        raw_data.append(bytes(row))

    raw_bytes = b"".join(raw_data)
    compressed = zlib.compress(raw_bytes)

    def chunk(chunk_type, data):
        c_type = chunk_type.encode('ascii')
        crc = zlib.crc32(c_type + data) & 0xffffffff
        return struct.pack('>I', len(data)) + c_type + data + struct.pack('>I', crc)

    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png = b'\x89PNG\r\n\x1a\n' + chunk('IHDR', ihdr) + chunk('IDAT', compressed) + chunk('IEND', b'')

    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'wb') as f:
        f.write(png)

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    icons_dir = os.path.join(base_dir, '..', 'icons')
    create_png(16, os.path.join(icons_dir, 'icon-16.png'))
    create_png(48, os.path.join(icons_dir, 'icon-48.png'))
    create_png(128, os.path.join(icons_dir, 'icon-128.png'))
    print("Light-mode icons generated successfully.")
