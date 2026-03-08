import Fastify from "fastify";
import { config } from "./config.js";
import { createSkillProvider } from "./provider.js";
import { registerRoutes } from "./routes.js";
const app = Fastify({
    logger: true,
});
app.decorate("skillProvider", createSkillProvider());
await registerRoutes(app);
await app.listen({
    port: config.PORT,
    host: "0.0.0.0",
});
