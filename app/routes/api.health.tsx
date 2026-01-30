export async function loader() {
  return Response.json({ status: "ok", timestamp: Date.now() });
}
