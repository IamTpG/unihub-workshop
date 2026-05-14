import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envFiles = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../apps/api/.env"),
  resolve(process.cwd(), "../../.env"),
];

for (const path of envFiles) {
  if (existsSync(path)) {
    dotenv.config({ path });
    break;
  }
}

export const requireEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`${key} is required to start the worker`);
  }

  return value;
};
