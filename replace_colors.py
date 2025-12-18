import os
import re

# Define the root directory
root_dir = os.path.join(os.getcwd(), 'src')

# Define replacements (regex pattern -> replacement string)
replacements = {
    r'#EF8037': '#2563EB',  # Orange -> Blue-600
    r'#d96a2a': '#1D4ED8',  # Dark Orange -> Blue-700
    r'ef8037': '2563EB',
    r'EF8037': '2563EB'
}

print(f"Scanning directory: {root_dir}")

files_changed = 0

for dirpath, dirnames, filenames in os.walk(root_dir):
    for filename in filenames:
        if filename.endswith(('.ts', '.tsx', '.js', '.jsx', '.css', '.html')):
            filepath = os.path.join(dirpath, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                
                for pattern, replacement in replacements.items():
                    # Case insensitive replacement for hex codes
                    new_content = re.sub(pattern, replacement, new_content, flags=re.IGNORECASE)
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated: {filepath}")
                    files_changed += 1
            except Exception as e:
                print(f"Error processing {filepath}: {e}")

print(f"Comparison complete. {files_changed} files updated.")
