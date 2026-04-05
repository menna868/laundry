import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL =
  process.env.NDEEF_BACKEND_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:5021"
    : "http://ndeefapp.runasp.net");

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  const backendPath = resolvedParams.path?.join("/") ?? "";
  const backendUrl = new URL(`/api/${backendPath}`, BACKEND_BASE_URL);
  backendUrl.search = request.nextUrl.search;

  try {
    const headers = new Headers();
    const authorization = request.headers.get("authorization");
    const contentType = request.headers.get("content-type");
    const accept = request.headers.get("accept");

    if (authorization) headers.set("authorization", authorization);
    if (contentType) headers.set("content-type", contentType);
    if (accept) headers.set("accept", accept);

    const body =
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.text();

    const response = await fetch(backendUrl.toString(), {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    const responseContentType = response.headers.get("content-type");
    const responseCacheControl = response.headers.get("cache-control");
    const responseBuffering = response.headers.get("x-accel-buffering");

    if ((responseContentType ?? "").includes("text/event-stream")) {
      if (responseContentType) {
        responseHeaders.set("content-type", responseContentType);
      }
      if (responseCacheControl) {
        responseHeaders.set("cache-control", responseCacheControl);
      }
      if (responseBuffering) {
        responseHeaders.set("x-accel-buffering", responseBuffering);
      }

      return new NextResponse(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    const responseBody = await response.text();

    if ((responseContentType ?? "").includes("text/html")) {
      return NextResponse.json(
        {
          message:
            "The backend returned an HTML page instead of JSON. Check NDEEF_BACKEND_URL and make sure it points to the API host.",
          upstreamUrl: backendUrl.toString(),
          upstreamStatus: response.status,
        },
        { status: 502 },
      );
    }

    if (responseContentType) {
      responseHeaders.set("content-type", responseContentType);
    }
    if (responseCacheControl) {
      responseHeaders.set("cache-control", responseCacheControl);
    }

    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          "The app could not reach the backend API. Check NDEEF_BACKEND_URL and verify the server is running.",
        upstreamUrl: backendUrl.toString(),
        detail: error instanceof Error ? error.message : "Unknown proxy error",
      },
      { status: 502 },
    );
  }
}

export const dynamic = "force-dynamic";

export { proxyRequest as GET };
export { proxyRequest as POST };
export { proxyRequest as PUT };
export { proxyRequest as PATCH };
export { proxyRequest as DELETE };
