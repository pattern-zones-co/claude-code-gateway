#!/usr/bin/env bun
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";
import { generateOpenAPIDocument } from "../src/openapi/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(__dirname, "../../../docs/openapi.yaml");

console.log("Generating OpenAPI specification...");

const document = generateOpenAPIDocument();
const yamlContent = stringify(document, { lineWidth: 0 });

writeFileSync(outputPath, yamlContent, "utf-8");

console.log(`OpenAPI specification written to: ${outputPath}`);
