from fastapi import WebSocket
from typing import List


class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)

    async def broadcast(self, message: str):
        for ws in self.active.copy():
            try:
                await ws.send_text(message)
            except Exception:
                self.active.remove(ws)


manager = ConnectionManager()
