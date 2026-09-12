with open('clean_spec.js', 'r', encoding='utf-8') as f:
    orig = f.read()
import re
m = re.search(r'test\(\"Flow 7.*?\);', orig, re.DOTALL)
if m: print(m.group(0))
