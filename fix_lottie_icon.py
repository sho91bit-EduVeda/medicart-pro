import json
import os

file_path = 'src/assets/animations/quick-links.json'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Navigate to the shapes list in the first layer
    # layers[0] -> shapes[0] -> it
    layer = data['layers'][0]
    shape_group = layer['shapes'][0]
    
    if 'it' in shape_group:
        items = shape_group['it']
        initial_count = len(items)
        
        # Remove "Path 2" (The circle background)
        # We keep "Path 3" (The icon/bolt), and the styling effects (Merge, Gradient, Transform)
        new_items = [item for item in items if item.get('nm') != 'Path 2']
        
        shape_group['it'] = new_items
        
        if len(new_items) < initial_count:
            print("Successfully removed 'Path 2' from the animation.")
        else:
            print("'Path 2' not found in the items.")

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
        
except Exception as e:
    print(f"Error: {e}")
