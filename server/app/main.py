from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os
import json

from app.websocket_manager import manager
from app.whatsapp_service import format_command_notification
from app.redis_client import redis_client
from app.config import FRAMES_DIR, SECTORS
from app.video_processor import (
    sector_states,
    start_live_stream, stop_live_stream, live_frames
)

app = FastAPI()

os.makedirs(FRAMES_DIR, exist_ok=True)

# Clear stale alert history from previous sessions on startup
redis_client.delete("alert_history")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Trinetra AI backend running"}


@app.get("/alerts/history")
def alert_history():
    items = redis_client.lrange("alert_history", 0, 49)
    alerts = [json.loads(i) for i in items]
    return [a for a in alerts if "Unable to analyze" not in a.get("analysis", "")]


@app.delete("/alerts/history")
def clear_alert_history():
    redis_client.delete("alert_history")
    return {"status": "cleared"}


@app.get("/sectors/status")
def sectors_status():
    return sector_states


class CommandPayload(BaseModel):
    message: str


class StreamPayload(BaseModel):
    url: str


@app.post("/start-stream/{sector_id}")
async def start_stream(sector_id: str, payload: StreamPayload):
    if sector_id not in SECTORS:
        return {"status": "error", "message": f"Unknown sector: {sector_id}"}
    if sector_states[sector_id]["active"]:
        return {"status": "error", "message": f"{sector_id} is already active"}
    import asyncio
    loop = asyncio.get_running_loop()  # correct — gets the actual running event loop
    location = SECTORS[sector_id]
    start_live_stream(sector_id, payload.url, location, loop, manager.broadcast)
    return {"status": "started", "sector": sector_id, "url": payload.url}


@app.post("/stop-stream/{sector_id}")
async def stop_stream(sector_id: str):
    if sector_id not in SECTORS:
        return {"status": "error", "message": f"Unknown sector: {sector_id}"}
    stop_live_stream(sector_id)
    return {"status": "stopped", "sector": sector_id}


async def _mjpeg_generator(sector_id: str):
    import asyncio
    while True:
        frame = live_frames.get(sector_id)
        if frame:
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n"
                b"Content-Length: " + str(len(frame)).encode() + b"\r\n\r\n" +
                frame + b"\r\n"
            )
        await asyncio.sleep(0.05)  # non-blocking ~20fps


@app.get("/live/{sector_id}")
def live_feed(sector_id: str):
    if sector_id not in SECTORS:
        return {"error": "Unknown sector"}
    return StreamingResponse(
        _mjpeg_generator(sector_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.post("/command")
async def officer_command(payload: CommandPayload):
    format_command_notification(payload.message)
    await manager.broadcast(json.dumps({"type": "command", "message": payload.message}))
    return {"status": "command sent"}


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)


