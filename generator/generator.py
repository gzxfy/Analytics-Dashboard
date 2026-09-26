import random
import json
import time
import urllib.request

# Setting Constants data to loop through
platforms = [
    "reddit",
    "youtube",
    "twitter"
]

topics = [
    "python",
    "fastapi",
    "react",
    "ai",
    "gaming",
    "linux"
]

sentiments = [
    "positive",
    "neutral",
    "negative"
]


def generate_fake_event():
    return {
        "platform": random.choice(platforms),
        "topic": random.choice(topics),
        "sentiment": random.choice(sentiments)
    }


def generation_event():
    while True: 
        event = generate_fake_event()
        request = urllib.request.Request(
            "http://127.0.0.1:8000/events",
            data=json.dumps(event).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        with urllib.request.urlopen(request) as response:
            print(response.status, response.read().decode("utf-8"))

        time.sleep(0.2)

if __name__ == "__main__":
    generation_event()