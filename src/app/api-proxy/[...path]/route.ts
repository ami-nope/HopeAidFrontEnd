const defaultApiProxyTarget = "https://hopeaidbackend.up.railway.app";
const apiProxyTarget = (process.env.API_PROXY_TARGET || defaultApiProxyTarget).replace(/\/+$/, "");
const forwardedHeaders = new Set([
  "accept",
  "authorization",
  "content-type",
  "x-request-id",
]);

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

function buildProxyUrl(pathSegments: string[], request: Request): URL {
  const pathname = pathSegments.join("/");
  const targetUrl = new URL(`${apiProxyTarget}/${pathname}`);
  const incomingUrl = new URL(request.url);

  targetUrl.search = incomingUrl.search;
  return targetUrl;
}

async function proxyRequest(request: Request, context: RouteContext): Promise<Response> {
  try {
    const { path } = await context.params;
    const proxyUrl = buildProxyUrl(path, request);
    const body = request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();
    const headers = new Headers();

    for (const [key, value] of request.headers.entries()) {
      if (forwardedHeaders.has(key.toLowerCase())) {
        headers.set(key, value);
      }
    }

    const proxyResponse = await fetch(proxyUrl, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    });

    return new Response(proxyResponse.body, {
      status: proxyResponse.status,
      statusText: proxyResponse.statusText,
      headers: proxyResponse.headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Proxy request failed";
    return Response.json({ error: message }, { status: 502 });
  }
}

export const dynamic = "force-dynamic";

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
