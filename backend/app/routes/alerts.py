from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime, timezone
from app.pubsub import broadcaster
from app.schemas import AlertPayload

router = APIRouter(tags=["Alerts"])

@router.websocket("/alerts")
@router.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint. Subscribes to the alert broadcaster 
    and relays live alerts (blacklist hits, speed anomalies) to connected clients.
    """
    await broadcaster.connect_websocket(websocket)
    try:
        # Send initial welcome / heartbeat ping
        await websocket.send_json({
            "alert_type": "SYSTEM_CONNECTED",
            "message": "Connected to ANPR Real-time Live Alert Feed",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        while True:
            # Keep connection open and receive any client-sent pings
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        broadcaster.disconnect_websocket(websocket)
    except Exception as e:
        broadcaster.disconnect_websocket(websocket)

@router.post("/alerts/test")
async def trigger_test_alert(alert: AlertPayload):
    """Utility endpoint to test firing an alert through the pipeline."""
    payload = alert.model_dump()
    await broadcaster.publish_alert(payload)
    return {"status": "broadcasted", "payload": payload}
