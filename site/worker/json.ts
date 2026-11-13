/** Une réponse JSON du Worker, marquée `x-neume-worker` : le reste du site ne passe jamais par ce code. */
export function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "x-neume-worker": "1" },
  });
}
