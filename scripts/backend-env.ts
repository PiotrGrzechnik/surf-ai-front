import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

let didLoadEnv = false;

export function loadBackendEnv(): void {
  if (didLoadEnv) {
    return;
  }

  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const projectRoot = resolve(scriptDir, "..");
  const workspaceRoot = resolve(projectRoot, "..");

  const envCandidates = [
    resolve(projectRoot, ".env.local"),
    resolve(projectRoot, ".env"),
    resolve(workspaceRoot, ".env.local"),
    resolve(workspaceRoot, ".env"),
  ];

  for (const envPath of envCandidates) {
    if (existsSync(envPath)) {
      dotenv.config({ path: envPath, override: false });
    }
  }

  didLoadEnv = true;
}
