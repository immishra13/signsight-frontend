# scripts/export_to_onnx.py
import torch, json, onnx, onnxsim
from pathlib import Path
from model_def import YourModelClass   # 👈 keep this import or change if you renamed

# ==== CONFIG ====
CKPT_PATH   = "scripts/best_model.pth"     # or "scripts/last_model_only.pth"
IDX_TO_GLOSS_JSON = "scripts/idx_to_gloss.json"  # or "scripts/gloss_to_idx.json"
OUTPUT_ONNX = "public/models/custom_gesture.onnx"

# Model input type:
IS_SEQUENCE = True     # True if your training used sequences [B, T, 63]
SEQ_LEN     = 16       # set to your training T
# =================

# Load labels to know num_classes
with open(IDX_TO_GLOSS_JSON, "r", encoding="utf-8") as f:
    mp = json.load(f)
if all(k.isdigit() for k in mp.keys()):
    # idx_to_gloss
    labels = [v for k, v in sorted(((int(k), v) for k, v in mp.items()))]
else:
    # gloss_to_idx
    inv = {int(v): k for k, v in mp.items()}
    labels = [inv[i] for i in range(len(inv))]
num_classes = len(labels)
print("num_classes:", num_classes)

# Build model
model = YourModelClass(num_classes=num_classes, use_lstm=IS_SEQUENCE)
ckpt = torch.load(CKPT_PATH, map_location="cpu")
# handle various checkpoint formats
state = ckpt["state_dict"] if isinstance(ckpt, dict) and "state_dict" in ckpt else ckpt
# strip "module." if present
state = {k.replace("module.", ""): v for k, v in state.items()}
model.load_state_dict(state, strict=False)
model.eval()

# Dummy input
if IS_SEQUENCE:
    dummy = torch.randn(1, SEQ_LEN, 63)
    dyn_axes = {"input": {0: "batch", 1: "time"}, "logits": {0: "batch"}}
else:
    dummy = torch.randn(1, 63)
    dyn_axes = {"input": {0: "batch"}, "logits": {0: "batch"}}

# Export
out_path = Path(OUTPUT_ONNX)
out_path.parent.mkdir(parents=True, exist_ok=True)

torch.onnx.export(
    model, dummy, str(out_path),
    input_names=["input"], output_names=["logits"],
    dynamic_axes=dyn_axes,
    opset_version=17
)

# Simplify
m = onnx.load(str(out_path))
sm, _ = onnxsim.simplify(m)
onnx.save(sm, str(out_path))
print("Saved ONNX:", out_path)
