import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";

export default defineConfig({
  plugins: [react(), dynamicGptImageProxy()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
});

function dynamicGptImageProxy() {
  return {
    name: "dynamic-gptimage2-proxy",
    configureServer(server: { middlewares: { use: (handler: ProxyMiddleware) => void } }) {
      server.middlewares.use((request, response, next) => {
        if (!request.url?.startsWith("/gptimage2-proxy")) {
          next();
          return;
        }

        void handleProxyRequest(request, response).catch((error: unknown) => {
          response.statusCode = 502;
          response.setHeader("Content-Type", "application/json");
          response.end(
            JSON.stringify({
              error: {
                message: error instanceof Error ? error.message : "Local proxy request failed",
              },
            })
          );
        });
      });
    },
  };
}

type ProxyMiddleware = (
  request: IncomingMessage,
  response: ServerResponse,
  next: () => void
) => void;

async function handleProxyRequest(request: IncomingMessage, response: ServerResponse) {
  const targetBaseUrl = getHeader(request, "x-gptimage2-target-base-url")?.replace(/\/+$/, "");
  if (!targetBaseUrl) {
    response.statusCode = 400;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ error: { message: "Missing proxy target base URL" } }));
    return;
  }

  const requestPath = request.url?.replace(/^\/gptimage2-proxy/, "") || "/";
  const targetUrl = new URL(requestPath, targetBaseUrl);
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (!value || shouldDropProxyHeader(name)) {
      continue;
    }
    headers.set(name, Array.isArray(value) ? value.join(",") : value);
  }

  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await readBody(request);
  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
  });

  response.statusCode = upstream.status;
  upstream.headers.forEach((value, name) => {
    if (!["content-encoding", "content-length"].includes(name.toLowerCase())) {
      response.setHeader(name, value);
    }
  });
  response.end(Buffer.from(await upstream.arrayBuffer()));
}

function getHeader(request: IncomingMessage, name: string): string | undefined {
  const value = request.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function shouldDropProxyHeader(name: string): boolean {
  return [
    "connection",
    "content-length",
    "host",
    "origin",
    "referer",
    "x-gptimage2-target-base-url",
  ].includes(name.toLowerCase());
}

function readBody(request: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}
