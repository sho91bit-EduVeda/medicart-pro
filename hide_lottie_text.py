import json
import os

file_path = 'src/assets/animations/hero-pharmacy.json'

def hide_groups(data, group_names):
    if isinstance(data, dict):
        if 'nm' in data and data['nm'] in group_names:
            print(f"Found {data['nm']}")
            # Find the transform property in 'it' (items)
            if 'it' in data:
                for item in data['it']:
                    if item.get('ty') == 'tr':
                        # Set Opacity to 0
                        item['o']['k'] = 0
                        print(f"Set opacity of {data['nm']} to 0")
        
        for key, value in data.items():
            hide_groups(value, group_names)
    elif isinstance(data, list):
        for item in data:
            hide_groups(item, group_names)

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Groups 23 to 30 correspond to "PHARMACY" letters
    target_groups = [f"Group {i}" for i in range(23, 31)]
    
    hide_groups(data, target_groups)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
        
    print("Successfully hidden PHARMACY text groups.")

except Exception as e:
    print(f"Error: {e}")
