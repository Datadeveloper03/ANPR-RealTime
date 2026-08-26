import json
import logging
import asyncio
from typing import Set, Optional
from fastapi import WebSocket
import redis.asyncio as aioredis
from app.config import settings

logger = logging.getLogger("anpr.pubsub")

class AlertBroadcaster:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.redis_client: Optional[aioredis.Redis] = None
        self.pubsub_task: Optional[asyncio.Task] = None
        self.is_connected_to_redis: bool = False
        self._fallback_queue: asyncio.Queue = asyncio.Queue()

    async def initialize(self):
        """Try connecting to Redis server, fallback to in-memory broadcast if not available."""
        try:
            self.redis_client = aioredis.from_url(
                settings.REDIS_URL, 
                decode_responses=True,
                socket_connect_timeout=2.0
            )
            await self.redis_client.ping()
            self.is_connected_to_redis = True
            logger.info(f"Connected to Redis PubSub at {settings.REDIS_URL}")
            self.pubsub_task = asyncio.create_task(self._redis_listener())
        except Exception as e:
            self.is_connected_to_redis = False
            logger.warning(f"Redis not reachable ({e}). Using in-memory PubSub fallback for WebSocket alerts.")
            self.pubsub_task = asyncio.create_task(self._fallback_listener())

    async def close(self):
        if self.pubsub_task:
            self.pubsub_task.cancel()
        if self.redis_client and self.is_connected_to_redis:
            await self.redis_client.close()

    async def connect_websocket(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect_websocket(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Remaining clients: {len(self.active_connections)}")

    async def broadcast_to_clients(self, message: dict):
        """Send message to all connected WebSocket clients."""
        dead_connections = set()
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to WebSocket: {e}")
                dead_connections.add(connection)
        for dead in dead_connections:
            self.active_connections.discard(dead)

    async def publish_alert(self, alert_data: dict):
        """Publish alert message either to Redis channel or fallback queue."""
        alert_json = json.dumps(alert_data)
        if self.is_connected_to_redis and self.redis_client:
            try:
                await self.redis_client.publish(settings.REDIS_ALERT_CHANNEL, alert_json)
                return
            except Exception as e:
                logger.warning(f"Redis publish failed: {e}. Broadcasting directly.")
        
        # In-memory broadcast
        await self.broadcast_to_clients(alert_data)

    async def _redis_listener(self):
        """Listen to Redis channel and relay messages to all active WebSockets."""
        while True:
            try:
                pubsub = self.redis_client.pubsub()
                await pubsub.subscribe(settings.REDIS_ALERT_CHANNEL)
                logger.info(f"Subscribed to Redis channel '{settings.REDIS_ALERT_CHANNEL}'")
                async for message in pubsub.listen():
                    if message["type"] == "message":
                        data_str = message["data"]
                        try:
                            payload = json.loads(data_str)
                            await self.broadcast_to_clients(payload)
                        except Exception as parse_err:
                            logger.error(f"Failed to parse alert payload: {parse_err}")
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Redis listener error: {e}. Reconnecting in 3s...")
                await asyncio.sleep(3.0)

    async def _fallback_listener(self):
        """Listen to internal memory queue."""
        while True:
            try:
                payload = await self._fallback_queue.get()
                await self.broadcast_to_clients(payload)
                self._fallback_queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Fallback listener error: {e}")
                await asyncio.sleep(1.0)

broadcaster = AlertBroadcaster()
