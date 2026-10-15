import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHealthServer } from "./health.js";

describe("health endpoint", () => {
  const server = createHealthServer(["example-job"]);
  let base = "";

  beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("answers GET /health with 200 and the registered jobs", async () => {
    const response = await fetch(`${base}/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", jobs: ["example-job"] });
  });

  it("answers anything else with 404", async () => {
    expect((await fetch(`${base}/nope`)).status).toBe(404);
  });
});
