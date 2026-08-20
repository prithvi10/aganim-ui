import { existsSync, readFileSync } from "fs";
import { join, normalize } from "path";
import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { ServerRouter } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { type EntryContext } from "react-router";
import { isbot } from "isbot";
import { addDocumentResponseHeaders } from "./shopify.server";

function tryServeStaticHtml(pathname: string): Response | null {
  if (!pathname.startsWith("/deep-learning/") || !pathname.endsWith(".html")) {
    return null;
  }

  const clientRoot = join(process.cwd(), "build/client");
  const filePath = normalize(join(clientRoot, pathname));

  if (!filePath.startsWith(clientRoot) || !existsSync(filePath)) {
    return null;
  }

  return new Response(readFileSync(filePath, "utf8"), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export const streamTimeout = 5000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext
) {
  const url = new URL(request.url);
  const staticHtml = tryServeStaticHtml(url.pathname);
  if (staticHtml) {
    const qs = url.search.length > 80 ? url.search.slice(0, 80) + "…" : url.search;
    console.log(`${request.method} ${url.pathname}${qs} 200 0ms`);
    return staticHtml;
  }

  const t0 = Date.now();

  // Concise request log with truncated query string (avoids leaking JWTs)
  const qs = url.search.length > 80 ? url.search.slice(0, 80) + "…" : url.search;
  const logFinish = () => {
    console.log(
      `${request.method} ${url.pathname}${qs} ${responseStatusCode} ${Date.now() - t0}ms`
    );
  };

  if (!url.pathname.startsWith("/portal")) {
    addDocumentResponseHeaders(request, responseHeaders);
  }
  const userAgent = request.headers.get("user-agent");
  const callbackName = isbot(userAgent ?? '')
    ? "onAllReady"
    : "onShellReady";

  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
      />,
      {
        [callbackName]: () => {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");
          logFinish();
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          console.error(error);
        },
      }
    );

    // Automatically timeout the React renderer after 6 seconds, which ensures
    // React has enough time to flush down the rejected boundary contents
    setTimeout(abort, streamTimeout + 1000);
  });
}
