const API_ORIGIN = "https://schoolfor-manus.salafe10.workers.dev";

export const onRequest = async (context: { request: Request }): Promise<Response> => {
  const incomingUrl = new URL(context.request.url);
  const targetUrl = new URL(
    `${incomingUrl.pathname}${incomingUrl.search}`,
    API_ORIGIN,
  );

  const init: RequestInit = {
    method: context.request.method,
    headers: new Headers(context.request.headers),
    redirect: "manual",
  };

  if (context.request.method !== "GET" && context.request.method !== "HEAD") {
    init.body = context.request.body;
  }

  return fetch(new Request(targetUrl, init));
};
