#!/usr/bin/env python3
"""
Fix incorrect table row hover dark mode pattern
"""
import re
from pathlib import Path

def fix_hover_pattern(file_path):
    """Fix the hover pattern in a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Fix the incorrect hover pattern
        content = re.sub(
            r'hover:bg-gray-50 dark:bg-gray-950',
            r'hover:bg-gray-50 dark:hover:bg-gray-800',
            content
        )
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    base_path = Path('/home/fear/Projects/test/client/app')
    tsx_files = list(base_path.rglob('*.tsx'))
    
    processed = 0
    for file_path in tsx_files:
        if fix_hover_pattern(file_path):
            processed += 1
            print(f"✓ Fixed: {file_path.relative_to(base_path)}")
    
    print(f"\nFixed {processed} files")

if __name__ == '__main__':
    main()
