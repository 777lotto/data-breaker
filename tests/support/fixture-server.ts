import { readFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";

export interface FixtureServer {
  origin: string;
  close: () => Promise<void>;
}

function listen(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
}

function close(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export async function startFixtureServer(): Promise<FixtureServer> {
  const fixture = await readFile(
    new URL("../fixtures/fake-broker.html", import.meta.url),
  );
  const server = createServer((request, response) => {
    if (request.method === "GET" && request.url === "/removal") {
      response.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      });
      response.end(fixture);
      return;
    }
    response.writeHead(404);
    response.end();
  });

  await listen(server);
  const address = server.address();
  if (address === null || typeof address === "string") {
    await close(server);
    throw new Error("Fixture server did not expose a TCP port");
  }

  return {
    origin: "http://127.0.0.1:" + address.port,
    close: () => close(server),
  };
}
