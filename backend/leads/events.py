from queue import Empty, Queue
from threading import Lock

_subscribers = []
_subscribers_lock = Lock()


def subscribe() -> Queue:
    queue_obj = Queue()
    with _subscribers_lock:
        _subscribers.append(queue_obj)
    return queue_obj


def publish_event(payload: dict) -> None:
    with _subscribers_lock:
        stale = []
        for queue_obj in _subscribers:
            try:
                queue_obj.put_nowait(payload)
            except Exception:
                stale.append(queue_obj)

        for queue_obj in stale:
            if queue_obj in _subscribers:
                _subscribers.remove(queue_obj)


def get_next_event(queue_obj: Queue, timeout: int = 20):
    try:
        return queue_obj.get(timeout=timeout)
    except Empty:
        return None
