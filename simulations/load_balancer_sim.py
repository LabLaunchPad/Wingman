import threading
import time
import random
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import List, Optional

# Setup logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] (%(threadName)s) %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("LoadBalancerSim")


class Server:
    """Represents a backend HTTP server with connection limits and CPU load tracking."""

    def __init__(self, server_id: str, capacity: int):
        self.server_id = server_id
        self.capacity = capacity
        self.active_connections = 0
        self.lock = threading.Lock()

    def accept_connection(self) -> bool:
        """Attempts to register an active connection. Returns True if accepted."""
        with self.lock:
            if self.active_connections >= self.capacity:
                return False
            self.active_connections += 1
            self.check_cpu_load()
            return True

    def release_connection(self) -> None:
        """Releases an active connection when processing completes."""
        with self.lock:
            if self.active_connections > 0:
                self.active_connections -= 1

    def get_cpu_load(self) -> float:
        """Calculates simulated CPU load based on connection utilization."""
        with self.lock:
            return (self.active_connections / self.capacity) * 100

    def check_cpu_load(self) -> None:
        """Generates an alert if the server utilization is approaching 100%."""
        load = (self.active_connections / self.capacity) * 100
        if load >= 90.0:
            logger.warning(
                f"🚨 [HIGH CPU LOAD ALERT] {self.server_id} load is at {load:.1f}% "
                f"({self.active_connections}/{self.capacity} connections)!"
            )


class LeastConnectionsLoadBalancer:
    """A Load Balancer that dynamically routes requests using the Least Connections algorithm."""

    def __init__(self, servers: List[Server]):
        self.servers = servers
        self.lock = threading.Lock()

    def route_request(self) -> Optional[Server]:
        """Routes to the server with the fewest active connections, subject to capacity."""
        with self.lock:
            selected_server = None
            min_connections = float("inf")

            for server in self.servers:
                with server.lock:
                    # Filter for servers that have capacity available
                    if server.active_connections < server.capacity:
                        if server.active_connections < min_connections:
                            min_connections = server.active_connections
                            selected_server = server

            if selected_server:
                # Accept connection immediately inside load balancer context
                selected_server.active_connections += 1
                selected_server.check_cpu_load()

            return selected_server


def process_request(request_id: int, load_balancer: LeastConnectionsLoadBalancer):
    """Simulates the lifecycle of a single HTTP request processed by a backend server."""
    # Find the least busy server
    server = load_balancer.route_request()

    if not server:
        logger.error(
            f"❌ Request-{request_id}: DROPPED! All backend servers are currently at 100% capacity!"
        )
        return False

    # Simulate processing time
    processing_time = random.uniform(0.1, 1.0)
    logger.info(
        f"Incoming Request-{request_id} routed to {server.server_id} "
        f"(Active connections: {server.active_connections}/{server.capacity}) | Processing: {processing_time:.2f}s"
    )

    time.sleep(processing_time)

    # Release connection
    server.release_connection()
    logger.info(
        f"Completed Request-{request_id} on {server.server_id} "
        f"(Active connections left: {server.active_connections}/{server.capacity})"
    )
    return True


def run_load_balancer_simulation():
    # Setup 3 backend servers with varying capacities
    # Keep capacity low to trigger CPU load alerts during simulation
    servers = [
        Server(server_id="Server-A", capacity=8),
        Server(server_id="Server-B", capacity=10),
        Server(server_id="Server-C", capacity=12),
    ]

    load_balancer = LeastConnectionsLoadBalancer(servers)
    logger.info("Initializing Load Balancer with 3 backend servers [Server-A, Server-B, Server-C]")

    num_requests = 50
    logger.info(f"Generating {num_requests} concurrent requests to simulate aggressive HTTP traffic...")

    # Use ThreadPoolExecutor to simulate 50 concurrent incoming requests
    with ThreadPoolExecutor(max_workers=50, thread_name_prefix="RequestExecutor") as executor:
        futures = [
            executor.submit(process_request, i, load_balancer)
            for i in range(1, num_requests + 1)
        ]

        # Wait for all to complete
        results = [f.result() for f in futures]

    # Verify all completed and stats are zero
    logger.info("Traffic simulation finished. Final check on server states:")
    for s in servers:
        logger.info(f"{s.server_id} active connections: {s.active_connections}/{s.capacity}")
        assert s.active_connections == 0, f"Leak detected! {s.server_id} has unreleased connections."

    logger.info("Least Connections routing simulation completed successfully with zero leaks!")


if __name__ == "__main__":
    run_load_balancer_simulation()
