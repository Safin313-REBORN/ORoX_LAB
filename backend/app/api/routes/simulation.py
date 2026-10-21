import asyncio
import json
import logging
import time
from typing import Dict, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/simulation", tags=["simulation"])

class SimulationSession:
    def __init__(self, session_id: str, websocket: WebSocket):
        self.session_id = session_id
        self.websocket = websocket
        self.is_running = False
        self.last_seen = time.time()
        self.pin_states: Dict[int, int] = {}
        self.sensor_data: Dict[str, Any] = {}

    async def send_event(self, event_type: str, data: dict):
        try:
            await self.websocket.send_json({"type": event_type, "data": data})
        except Exception as e:
            logger.debug(f"Failed to send to session {self.session_id}: {e}")

class SessionManager:
    def __init__(self):
        self.active_sessions: Dict[str, SimulationSession] = {}
        self._lock = asyncio.Lock()

    async def connect(self, session_id: str, websocket: WebSocket) -> SimulationSession:
        await websocket.accept()
        async with self._lock:
            # If session exists, cleanly disconnect old
            if session_id in self.active_sessions:
                try:
                    await self.active_sessions[session_id].websocket.close()
                except Exception:
                    pass
            session = SimulationSession(session_id, websocket)
            self.active_sessions[session_id] = session
            return session

    async def disconnect(self, session_id: str):
        async with self._lock:
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]

    async def cleanup_stale_sessions(self, timeout_sec: float = 120.0):
        now = time.time()
        async with self._lock:
            stale = [sid for sid, s in self.active_sessions.items() if now - s.last_seen > timeout_sec]
            for sid in stale:
                try:
                    await self.active_sessions[sid].websocket.close()
                except Exception:
                    pass
                del self.active_sessions[sid]

session_manager = SessionManager()

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    session = await session_manager.connect(session_id, websocket)
    try:
        await session.send_event("connected", {"session_id": session_id, "status": "ready"})
        while True:
            text = await websocket.receive_text()
            session.last_seen = time.time()
            try:
                msg = json.loads(text)
                msg_type = msg.get("type", "")
                data = msg.get("data", {})

                if msg_type == "start":
                    session.is_running = True
                    await session.send_event("status", {"state": "running"})
                elif msg_type == "stop":
                    session.is_running = False
                    await session.send_event("status", {"state": "stopped"})
                elif msg_type == "reset":
                    session.is_running = False
                    session.pin_states.clear()
                    await session.send_event("status", {"state": "reset"})
                elif msg_type == "serial_input":
                    chars = data.get("text", "")
                    await session.send_event("serial_echo", {"text": chars})
                elif msg_type == "pin_change":
                    pin = data.get("pin")
                    state = data.get("state")
                    if pin is not None and state is not None:
                        session.pin_states[pin] = state
                        await session.send_event("gpio_ack", {"pin": pin, "state": state})
                elif msg_type == "ping":
                    await session.send_event("pong", {"timestamp": time.time()})
            except json.JSONDecodeError:
                await session.send_event("error", {"message": "Invalid JSON format."})
    except WebSocketDisconnect:
        await session_manager.disconnect(session_id)
    except Exception as e:
        logger.debug(f"Session {session_id} exception: {e}")
        await session_manager.disconnect(session_id)
