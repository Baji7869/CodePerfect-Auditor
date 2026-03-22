"""
WebSocket Connection Manager
Handles real-time audit progress streaming to connected clients.
"""
import asyncio
import json
import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # case_id -> list of connected websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, case_id: str):
        await websocket.accept()
        if case_id not in self.active_connections:
            self.active_connections[case_id] = []
        self.active_connections[case_id].append(websocket)
        logger.info(f"WS connected: case={case_id}, total={len(self.active_connections[case_id])}")

    def disconnect(self, websocket: WebSocket, case_id: str):
        if case_id in self.active_connections:
            self.active_connections[case_id].discard(websocket) if hasattr(
                self.active_connections[case_id], 'discard'
            ) else None
            try:
                self.active_connections[case_id].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[case_id]:
                del self.active_connections[case_id]

    async def broadcast_to_case(self, case_id: str, message: dict):
        """Send a message to all clients watching a specific case."""
        if case_id not in self.active_connections:
            return
        dead = []
        for ws in self.active_connections[case_id]:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, case_id)

    async def send_progress(self, case_id: str, step: int, total: int, message: str, agent: str = "", status: str = "processing"):
        await self.broadcast_to_case(case_id, {
            "type": "progress",
            "step": step,
            "total": total,
            "message": message,
            "agent": agent,
            "status": status,
            "percent": int((step / total) * 100)
        })

    async def send_complete(self, case_id: str, report: dict):
        await self.broadcast_to_case(case_id, {
            "type": "complete",
            "status": "completed",
            "report": report
        })

    async def send_error(self, case_id: str, error: str):
        await self.broadcast_to_case(case_id, {
            "type": "error",
            "status": "error",
            "message": error
        })


# Global singleton
manager = ConnectionManager()
