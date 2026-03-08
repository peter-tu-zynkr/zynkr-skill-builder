import { z } from "zod";
import { filterSkills } from "./lib/filters.js";
const querySchema = z.object({
    category: z.string().optional(),
    q: z.string().optional(),
    status: z.enum(["Done", "WIP", "Not started", "Pause", "Out dated"]).optional(),
    platform: z.enum(["gpt", "claude", "gemini", "multi"]).optional(),
});
export async function registerRoutes(app) {
    app.get("/health", async () => ({
        ok: true,
        timestamp: new Date().toISOString(),
    }));
    app.get("/skills", async (request) => {
        const filters = querySchema.parse(request.query);
        const skills = await app.skillProvider.listSkills();
        return filterSkills(skills, filters);
    });
    app.get("/skills/:id", async (request, reply) => {
        const params = z.object({ id: z.string() }).parse(request.params);
        const skills = await app.skillProvider.listSkills();
        const skill = skills.find((item) => item.id === params.id);
        if (!skill) {
            reply.code(404);
            return { message: "Skill not found" };
        }
        return skill;
    });
    app.get("/categories", async () => {
        const skills = await app.skillProvider.listSkills();
        return Array.from(new Set(skills.map((skill) => skill.category))).sort();
    });
}
