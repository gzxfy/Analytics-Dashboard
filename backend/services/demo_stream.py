"""Small synthetic stream for demonstrations; deliberately not a load tester."""

import asyncio
import random
import time
from collections.abc import Awaitable, Callable

MIN_RATE = 1
MAX_RATE = 100


class DemoStream:
    def __init__(self, write_event: Callable[[dict], Awaitable[None]], enabled=False):
        self.write_event = write_event
        self.enabled = enabled
        self.task = None
        self.rate = 5
        self.generated = 0
        self.deadline = 0.0
        self.error = None
        self.rate_changed = asyncio.Event()

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
        self.validate_rate(rate)
        self.rate, self.generated, self.error = rate, 0, None
        self.deadline = time.monotonic() + 60
        self.rate_changed.clear()
        # Assignment happens before yielding, so simultaneous starts cannot create two tasks.
        self.task = asyncio.create_task(self._run())
        return self.status()

    @staticmethod
    def validate_rate(rate: int):
        if type(rate) is not int or not MIN_RATE <= rate <= MAX_RATE:
            raise ValueError(f"Target rate must be between {MIN_RATE} and {MAX_RATE}")

    def update_rate(self, rate: int):
        if not self.enabled:
            raise PermissionError("Demo streaming is disabled on this server")
        self.validate_rate(rate)
        if not self.status()["running"] or time.monotonic() >= self.deadline:
            raise RuntimeError("Start a demo stream before changing its rate")

        # Change the existing task's pacing, preserving its counter and stop deadline.
        self.rate = rate
        self.rate_changed.set()
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
                while True:
                    delay = min(started + 1 / self.rate, self.deadline) - time.monotonic()
                    if delay <= 0:
                        break
                    self.rate_changed.clear()
                    try:
                        # Wake immediately on an update instead of waiting at the previous rate.
                        await asyncio.wait_for(self.rate_changed.wait(), timeout=delay)
                    except asyncio.TimeoutError:
                        break
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
