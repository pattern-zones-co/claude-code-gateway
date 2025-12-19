/**
 * TypeScript + Zod SDK Example
 *
 * This example demonstrates using the Claude Code Gateway SDK
 * with Zod schemas for full type safety.
 *
 * Prerequisites:
 * 1. Start the gateway: cd packages/gateway && pnpm dev
 * 2. Set CLAUDE_CODE_GATEWAY_API_KEY environment variable
 * 3. Run: pnpm start
 */

import { z } from "zod";
import { ClaudeCodeClient, ClaudeCodeError } from "@pattern-zones-co/claude-code-gateway-sdk";

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:3100";
const API_KEY = process.env.CLAUDE_CODE_GATEWAY_API_KEY;

if (!API_KEY) {
  console.error("Error: CLAUDE_CODE_GATEWAY_API_KEY environment variable is required");
  process.exit(1);
}

// Create the client
const client = new ClaudeCodeClient({
  baseUrl: GATEWAY_URL,
  authKey: API_KEY,
  model: "sonnet", // Default model
});

/**
 * Example 1: Generate text with type-safe response
 */
async function generateTextExample() {
  console.log("\n=== Generate Text Example ===\n");

  const result = await client.generateText({
    prompt: "What are the three pillars of TypeScript's type system?",
    system: "You are a TypeScript expert. Be concise and educational.",
  });

  // result.text is typed as string
  console.log("Response:", result.text);
  console.log("Tokens used:", result.usage.totalTokens);
}

/**
 * Example 2: Generate a typed object using Zod schema
 */
async function generateObjectExample() {
  console.log("\n=== Generate Object Example ===\n");

  // Define the schema with Zod - this gives us both validation AND TypeScript types
  const ContactSchema = z.object({
    name: z.string().describe("Full name of the person"),
    email: z.string().email().describe("Email address"),
    company: z.string().optional().describe("Company name if mentioned"),
    role: z.string().optional().describe("Job role if mentioned"),
  });

  // TypeScript infers the type from the schema
  type Contact = z.infer<typeof ContactSchema>;

  const result = await client.generateObject({
    prompt: `Extract contact information from this email signature:

Best regards,
Jane Smith
Senior Engineer at TechCorp
jane.smith@techcorp.io`,
    schema: ContactSchema,
  });

  // result.object is typed as Contact
  const contact: Contact = result.object;

  console.log("Extracted contact:");
  console.log("  Name:", contact.name);
  console.log("  Email:", contact.email);
  console.log("  Company:", contact.company);
  console.log("  Role:", contact.role);
}

/**
 * Example 3: Generate an array of typed objects
 */
async function generateArrayExample() {
  console.log("\n=== Generate Array Example ===\n");

  const TaskSchema = z.object({
    title: z.string(),
    priority: z.enum(["high", "medium", "low"]),
    estimatedHours: z.number(),
  });

  const TaskListSchema = z.array(TaskSchema);

  type TaskList = z.infer<typeof TaskListSchema>;

  const result = await client.generateObject({
    prompt: `Convert these notes into a task list:
- Fix the login bug ASAP (should take about 2 hours)
- Update the documentation when you have time (maybe 4 hours)
- Refactor the auth module (important, 8 hours)`,
    schema: TaskListSchema,
  });

  const tasks: TaskList = result.object;

  console.log("Tasks:");
  for (const task of tasks) {
    console.log(`  [${task.priority}] ${task.title} (${task.estimatedHours}h)`);
  }
}

/**
 * Example 4: Stream text response
 */
async function streamExample() {
  console.log("\n=== Stream Example ===\n");

  const result = await client.streamText({
    prompt: "Write a haiku about TypeScript type safety.",
  });

  // Stream text chunks as they arrive
  process.stdout.write("Streaming: ");

  const reader = result.textStream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    process.stdout.write(value);
  }

  console.log("\n");

  // Get final usage stats
  const usage = await result.usage;
  console.log("Total tokens:", usage.totalTokens);
}

/**
 * Example 5: Error handling
 */
async function errorHandlingExample() {
  console.log("\n=== Error Handling Example ===\n");

  const InvalidSchema = z.object({
    impossibleField: z.string(),
  });

  try {
    await client.generateObject({
      prompt: "Just say hello", // Won't produce the expected schema
      schema: InvalidSchema,
    });
  } catch (error) {
    if (error instanceof ClaudeCodeError) {
      console.log("Caught ClaudeCodeError:");
      console.log("  Code:", error.code);
      console.log("  Message:", error.message);
    } else {
      throw error;
    }
  }
}

/**
 * Example 6: Complex nested schema
 */
async function complexSchemaExample() {
  console.log("\n=== Complex Nested Schema Example ===\n");

  const AddressSchema = z.object({
    street: z.string(),
    city: z.string(),
    country: z.string(),
    postalCode: z.string().optional(),
  });

  const PersonSchema = z.object({
    name: z.string(),
    age: z.number().int().positive(),
    address: AddressSchema,
    hobbies: z.array(z.string()),
  });

  const result = await client.generateObject({
    prompt: `Create a fictional person profile. They should:
- Live in Tokyo, Japan
- Be in their 30s
- Have 3 hobbies related to technology`,
    schema: PersonSchema,
  });

  const person = result.object;

  console.log("Generated person:");
  console.log(`  ${person.name}, age ${person.age}`);
  console.log(`  Lives in ${person.address.city}, ${person.address.country}`);
  console.log(`  Hobbies: ${person.hobbies.join(", ")}`);
}

// Run all examples
async function main() {
  try {
    await generateTextExample();
    await generateObjectExample();
    await generateArrayExample();
    await streamExample();
    await errorHandlingExample();
    await complexSchemaExample();

    console.log("\n✅ All examples completed successfully!\n");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
