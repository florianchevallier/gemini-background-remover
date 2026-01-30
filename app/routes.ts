import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/upload", "routes/api.upload.tsx"),
  route("api/status/:id", "routes/api.status.$id.tsx"),
  route("api/download/:id", "routes/api.download.$id.tsx"),
  route("api/download-batch", "routes/api.download-batch.tsx"),
  route("api/health", "routes/api.health.tsx"),
] satisfies RouteConfig;
