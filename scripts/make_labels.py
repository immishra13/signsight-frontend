# scripts/make_labels.py
import json, sys, os
SRC = "scripts/idx_to_gloss.json"  # or "scripts/gloss_to_idx.json"
DST = "public/models/labels.json"

with open(SRC, "r", encoding="utf-8") as f:
    mp = json.load(f)

if all(k.isdigit() for k in mp.keys()):
    # idx_to_gloss
    labels = [v for k, v in sorted(((int(k), v) for k, v in mp.items()))]
else:
    # gloss_to_idx
    inv = {int(v): k for k, v in mp.items()}
    labels = [inv[i] for i in range(len(inv))]

os.makedirs("public/models", exist_ok=True)
with open(DST, "w", encoding="utf-8") as f:
    json.dump(labels, f, ensure_ascii=False, indent=2)

print("Saved", DST)
