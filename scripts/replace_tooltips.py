import re
import glob

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to make sure Tooltip is imported
    if "import { Tooltip } from './Tooltip';" not in content:
        # insert after first import
        content = re.sub(r"(import React.*?;\n)", r"\1import { Tooltip } from './Tooltip';\n", content, count=1)

    # Regex to find <label>...</label> followed by <p...>...</p>
    pattern_label = r'(<label[^>]*>)(.*?)(</label>)\s*<p className="font-mono text-\[10px\] text-\[var\(--text-muted\)\] mt-1 mb-3 leading-relaxed italic">(.*?)</p>'
    content = re.sub(pattern_label, r'\1\2 <Tooltip content="\4" />\3', content, flags=re.DOTALL)

    # Regex to find <h3>...</h3> followed by <p...>...</p>
    pattern_h3 = r'(<h3[^>]*>)(.*?)(</h3>)\s*<p className="font-mono text-\[10px\] text-\[var\(--text-muted\)\] mt-1 mb-3 leading-relaxed italic(?: text-center)?">(.*?)</p>'
    content = re.sub(pattern_h3, r'\1\2 <Tooltip content="\4" />\3', content, flags=re.DOTALL)

    # Regex to find <span>...</span> followed by <p...>...</p>
    pattern_span = r'(<span[^>]*>)(.*?)(</span>)\s*<p className="font-mono text-\[10px\] text-\[var\(--text-muted\)\] mt-1 mb-3 leading-relaxed italic">(.*?)</p>'
    content = re.sub(pattern_span, r'\1\2 <Tooltip content="\4" />\3', content, flags=re.DOTALL)
    
    # Regex to find <div><p...>...</p><button>
    # Sometimes it's a floating <p> inside a div
    pattern_floating = r'<p className="font-mono text-\[10px\] text-\[var\(--text-muted\)\] mt-1 mb-3 leading-relaxed italic">(.*?)</p>'
    content = re.sub(pattern_floating, r'<Tooltip content="\1" />', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for filepath in glob.glob("src/components/*Dashboard.tsx"):
    print(f"Processing {filepath}")
    process_file(filepath)
