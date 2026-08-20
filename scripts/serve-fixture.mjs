import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const host = "127.0.0.1";
const port = Number(process.env.DATA_BREAKER_FIXTURE_PORT ?? "4173");
const fixtureUrl = new URL("../tests/fixtures/fake-broker.html", import.meta.url);
const fixture = await readFile(fixtureUrl);

const server = createServer((request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === "GET" && request.url === "/removal") {
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    });
    response.end(fixture);
    return;
  }

  response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  response.end("Not found");
});

server.listen(port, host, () => {
  process.stdout.write(
    "Synthetic broker fixture: http://" + host + ":" + port + "/removal\n",
  );
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
