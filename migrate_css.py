import re
import sys

old_css_path = '/Users/nihith/.gemini/antigravity/scratch/lumiedit/src/index.css'
new_css_path = '/Users/nihith/Downloads/photoeditor/src/index.css'

with open(old_css_path, 'r') as f:
    old_css = f.read()
    
with open(new_css_path, 'r') as f:
    new_css = f.read()

try:
    # 1. Replace Horizontal Sliders block
    slider_regex = re.compile(r'/\* Horizontal Sliders \(Adjustments\) \*/.*?/\* Animations \*/', re.DOTALL)
    new_slider_block = slider_regex.search(new_css).group(0)
    old_css = slider_regex.sub(new_slider_block, old_css)
except Exception as e:
    print("Failed replacing Horizontal Sliders block:", e)
    sys.exit(1)

try:
    # 2. Replace .glass-slider block
    old_glass_regex = re.compile(r'\.glass-slider \{.*?\.glass-slider:active::-webkit-slider-thumb \{.*?\n\}', re.DOTALL)
    new_glass_block2 = old_glass_regex.search(new_css).group(0)
    old_css = old_glass_regex.sub(new_glass_block2, old_css)
except Exception as e:
    print("Failed replacing .glass-slider block:", e)
    sys.exit(1)

try:
    # 3. Replace Layers Panel block
    layers_regex = re.compile(r'/\* 5\. Layers Panel \*/.*?\.layers-list \{', re.DOTALL)
    new_layers_block = layers_regex.search(new_css).group(0)
    old_css = layers_regex.sub(new_layers_block, old_css)
except Exception as e:
    print("Failed replacing Layers Panel block:", e)
    sys.exit(1)

try:
    # 4. Extract @media block from new_css
    media_regex = re.compile(r'@media \(max-width: 768px\) \{.*\n\}', re.DOTALL)
    new_media_block = media_regex.search(new_css).group(0)
    
    # 5. Exclude Text Tab updates from the mobile version.
    new_media_block = re.sub(r'/\* Hide level 1 BottomBar when StackedTextBar is active \*/.*?/\* 5\. Layers', '/* 5. Layers', new_media_block, flags=re.DOTALL)
    
    # Add Mobile Only Additions
    mobile_only_additions = """
        /* Injected Global Changes for Mobile Only */
        .bottom-bar-wrapper.filters-active .floating-bar--l1 { width: 680px; max-width: 90vw; }
        .side-pill { height: 68px; border-radius: 34px; }
        .side-pill.icon-only { width: 68px; }
        .side-pill.text-only { width: auto; padding: 0 24px; white-space: nowrap; }
        .filter-pill.active { color: #000000; background: #ffffff; border-color: rgba(255, 255, 255, 0.4); box-shadow: 0 0 12px rgba(255,255,255,0.3); }
        .l2-scroller { flex: 1; min-width: 0; }
        .seg-btn.active { color: #000000; background: #ffffff; }
        .style-btn { width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255, 255, 255, 0.15); background: rgba(255, 255, 255, 0.04); color: var(--text-1); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; }
        .style-btn:hover { background: rgba(255, 255, 255, 0.12); border-color: rgba(255, 255, 255, 0.3); }
        .style-btn:active { transform: scale(0.92); }
        .style-btn.active { background: #ffffff; color: #000000; border-color: #ffffff; box-shadow: 0 4px 14px rgba(255, 255, 255, 0.25); }
        .style-btn.danger { background: rgba(255, 59, 92, 0.15); color: #ff3b30; border-color: rgba(255, 59, 92, 0.25); }
        .style-btn.danger:hover { background: #ff3b30; color: #ffffff; border-color: #ff3b30; }
    """
    
    new_media_block = new_media_block.replace('@media (max-width: 768px) {\n', '@media (max-width: 768px) {\n' + mobile_only_additions + '\n')
    
    old_media_regex = re.compile(r'@media \(max-width: 768px\) \{.*\n\}', re.DOTALL)
    old_css = old_media_regex.sub(new_media_block, old_css)
except Exception as e:
    print("Failed replacing @media block:", e)
    sys.exit(1)

with open(old_css_path, 'w') as f:
    f.write(old_css)

print("CSS migration completed.")
