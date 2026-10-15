import { createServer } from "node:http";

/**
 * Liveness endpoint for the container healthcheck and the orchestrator:
 * GET /health -> 200 while the process runs. Everything else is 404.
 */
export function createHealthServer(jobNames: readonly string[]) {
  return createServer((request, response) => {
    if (request.method === "GET" && request.url === "/health") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ status: "ok", jobs: jobNames }));
      return;
    }
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  });
}
