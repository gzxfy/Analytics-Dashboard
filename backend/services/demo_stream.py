"""Small synthetic stream for demonstrations; deliberately not a load tester."""

import asyncio
import random
import time
from collections.abc import Awaitable, Callable


class DemoStream:
    def __init__(self, write_event: Callable[[dict], Awaitable[None]], enabled=False):
        self.write_event = write_event
        self.enabled = enabled
        self.task = None
        self.rate = 5
        self.generated = 0
        self.deadline = 0.0
        self.error = None

    def status(self):
        running = self.task is not None and not self.task.done()
        return {
            "enabled": self.enabled, "running": running,
            "target_rate": self.rate, "generated": self.generated,
            "remaining_seconds": max(0, round(self.deadline - time.monotonic())) if running else 0,
            "error": self.error,
        }

    def start(self, rate: int):
        if not self.enabled:
            raise PermissionError("Demo streaming is disabled on this server")
        if self.status()["running"]:
            raise RuntimeError("A demo stream is already running")
        if not 1 <= rate <= 20:
            raise ValueError("Target rate must be between 1 and 20")
        self.rate, self.generated, self.error = rate, 0, None
        self.deadline = time.monotonic() + 60
        # Assignment happens before yielding, so simultaneous starts cannot create two tasks.
        self.task = asyncio.create_task(self._run())
        return self.status()

    async def _run(self):
        try:
            while time.monotonic() < self.deadline:
                started = time.monotonic()
                event = {
                    "platform": random.choice(["reddit", "youtube", "twitter"]),
                    # Prefix makes synthetic records identifiable without a schema migration.
                    "topic": "demo:" + random.choice(["python", "react", "fastapi", "ai"]),
                    "sentiment": random.choice(["positive", "neutral", "negative"]),
                }
                await asyncio.wait_for(self.write_event(event), timeout=min(5, self.deadline - started))
                self.generated += 1
                # No catch-up bursts: slow writes reduce achieved rate rather than building a queue.
                await asyncio.sleep(max(0, 1 / self.rate - (time.monotonic() - started)))
        except asyncio.CancelledError:
            raise
        except Exception:
            # Never expose driver errors or connection strings in the public status response.
            self.error = "Demo stopped because an event could not be stored."

    async def stop(self):
        if self.task is not None:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        return self.status()
