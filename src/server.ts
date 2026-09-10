import { build } from "./app.js";
import { config } from "./lib/config.js";

const app = build();

app.listen({ port: config.PORT, host: "0.0.0.0" }).catch((error: unknown) => {
  app.log.error(error);
  process.exit(1);
});
