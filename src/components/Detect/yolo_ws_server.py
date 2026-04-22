# yolo_ws_server.py
import asyncio, json, time
import cv2
import websockets
from ultralytics import YOLO

WEIGHTS = r"D:\sign-lang\runs\hand_sign_yolo112\weights\best.pt"
IMG, CONF, IOU = 640, 0.35, 0.45
FRAME_W, FRAME_H = 640, 480

model = YOLO(WEIGHTS)

def open_cam():
  cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
  cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_W)
  cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_H)
  return cap

async def stream(websocket):
  cap = open_cam()
  try:
    while True:
      ok, frame = cap.read()
      if not ok: await asyncio.sleep(0.01); continue
      res = model.predict(source=frame, imgsz=IMG, conf=CONF, iou=IOU, device="", verbose=False)[0]
      label, conf = None, None
      if res.boxes is not None and len(res.boxes) > 0:
        confs = res.boxes.conf.cpu().numpy()
        idx = confs.argmax()
        cls_id = int(res.boxes.cls.cpu().numpy()[idx])
        conf = float(confs[idx]) * 100.0
        names = res.names if hasattr(res, "names") else getattr(model.model, "names", {})
        label = str(names.get(cls_id, f"id:{cls_id}"))
      # send even if None (front-end ignores < 50)
      await websocket.send(json.dumps({"label": label or "", "conf": conf or 0}))
      await asyncio.sleep(0.03)  # ~30 fps cap
  finally:
    cap.release()

async def handler(websocket):
  await stream(websocket)

async def main():
  async with websockets.serve(handler, "0.0.0.0", 8000, ping_interval=None):
    print("YOLO WS at ws://localhost:8000/yolo (path ignored)")
    await asyncio.Future()

if __name__ == "__main__":
  asyncio.run(main())
