import { build } from "./app.js";

const app = build();

const port = Number(process.env["PORT"] ?? 3000);

app.listen({ port, host: "0.0.0.0" }).catch((error: unknown) => {
  app.log.error(error);
  process.exit(1);
});
