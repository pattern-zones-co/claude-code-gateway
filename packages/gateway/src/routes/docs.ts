import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { apiReference } from "@scalar/express-api-reference";
import { Router } from "express";

const router = Router();

// Resolve path relative to dist directory (compiled output)
// Cache at module load to avoid disk I/O on every request
const specPath = resolve(__dirname, "../../../../docs/openapi.yaml");
const specCache = readFileSync(specPath, "utf-8");

// Serve raw OpenAPI spec
router.get("/openapi.yaml", (_req, res) => {
	res.type("text/yaml").send(specCache);
});

// Serve Scalar API reference
router.use(
	"/docs",
	apiReference({
		url: "/openapi.yaml",
		theme: "deepSpace",
	}),
);

export default router;
