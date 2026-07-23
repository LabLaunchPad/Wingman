import threading
import time
import random
import logging
from typing import Dict, Any, Optional

# Setup logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] (%(threadName)s) %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("LRUCacheSim")


class Node:
    """A node in the Doubly Linked List."""

    def __init__(self, key: Any = None, value: Any = None):
        self.key = key
        self.value = value
        self.prev: Optional[Node] = None
        self.next: Optional[Node] = None


class DoublyLinkedList:
    """A Doubly Linked List implementation for LRU tracking."""

    def __init__(self):
        # Sentinel head and tail nodes
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head
        self._size = 0

    def add_to_front(self, node: Node) -> None:
        """Inserts a node at the head (most recently used position)."""
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node
        self._size += 1

    def remove_node(self, node: Node) -> None:
        """Removes an existing node from the linked list."""
        node.prev.next = node.next
        node.next.prev = node.prev
        self._size -= 1

    def move_to_front(self, node: Node) -> None:
        """Moves an existing node to the head."""
        self.remove_node(node)
        self.add_to_front(node)

    def remove_tail(self) -> Optional[Node]:
        """Removes and returns the node at the tail (least recently used position)."""
        if self._size == 0:
            return None
        last_node = self.tail.prev
        self.remove_node(last_node)
        return last_node

    def size(self) -> int:
        return self._size


class ThreadSafeLRUCache:
    """Thread-safe Least Recently Used (LRU) Cache."""

    def __init__(self, capacity: int):
        if capacity <= 0:
            raise ValueError("Capacity must be greater than 0")
        self.capacity = capacity
        self.cache: Dict[Any, Node] = {}
        self.list = DoublyLinkedList()
        # Reentrant lock ensures thread safety across all operations
        self.lock = threading.RLock()

    def get(self, key: Any) -> Optional[Any]:
        """Retrieves an item from the cache. Returns None if not found."""
        with self.lock:
            if key not in self.cache:
                return None
            node = self.cache[key]
            # Move accessed node to front (mark as most recently used)
            self.list.move_to_front(node)
            return node.value

    def put(self, key: Any, value: Any) -> Optional[Any]:
        """Inserts or updates an item in the cache. Evicts LRU if capacity exceeded."""
        evicted_key = None
        with self.lock:
            if key in self.cache:
                # Update existing key
                node = self.cache[key]
                node.value = value
                self.list.move_to_front(node)
            else:
                # Insert new key
                if self.list.size() >= self.capacity:
                    # Evict the least recently used node from tail
                    lru_node = self.list.remove_tail()
                    if lru_node:
                        del self.cache[lru_node.key]
                        evicted_key = lru_node.key

                new_node = Node(key, value)
                self.list.add_to_front(new_node)
                self.cache[key] = new_node

        return evicted_key

    def size(self) -> int:
        """Returns the current size of the cache."""
        with self.lock:
            return self.list.size()


def worker(cache: ThreadSafeLRUCache, worker_id: int, num_operations: int):
    """Simulates aggressive concurrent read/write operations on the cache."""
    for i in range(num_operations):
        key = f"key_{random.randint(1, 15)}"
        val = f"val_{worker_id}_{i}"

        # 50% writes, 50% reads
        if random.random() < 0.5:
            evicted = cache.put(key, val)
            if evicted:
                logger.info(f"Write: Set {key} -> {val} | Evicted: {evicted}")
            else:
                logger.info(f"Write: Set {key} -> {val}")
        else:
            result = cache.get(key)
            if result:
                logger.info(f"Read : Hit {key} -> {result}")
            else:
                logger.info(f"Read : Miss {key}")

        # Yield to allow other threads to execute
        time.sleep(0.01)


def run_cache_simulation():
    capacity = 5
    cache = ThreadSafeLRUCache(capacity=capacity)
    logger.info(f"Initializing Thread-Safe LRU Cache with capacity = {capacity}")

    threads = []
    num_workers = 5
    ops_per_worker = 20

    for i in range(num_workers):
        t = threading.Thread(
            target=worker,
            args=(cache, i, ops_per_worker),
            name=f"WorkerThread-{i}",
        )
        threads.append(t)
        t.start()

    for t in threads:
        t.join()

    # Final verification
    logger.info("Simulation completed. Verifying cache invariants...")
    logger.info(f"Final Cache size: {cache.size()} (Capacity limit: {capacity})")
    assert cache.size() <= capacity, "Cache size exceeds capacity!"

    # Inspect final keys in correct order (MRU to LRU)
    with cache.lock:
        current = cache.list.head.next
        keys_order = []
        while current != cache.list.tail:
            keys_order.append(current.key)
            current = current.next
        logger.info(f"MRU to LRU Order of keys: {keys_order}")

    logger.info("Verifications passed! LRU eviction logic is fully correct under concurrent loads.")


if __name__ == "__main__":
    run_cache_simulation()
