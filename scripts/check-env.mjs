import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const mode = process.env.MODE || "production";
const envFiles = [".env", ".env.local", `.env.${mode}`, `.env.${mode}.local`];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((env, line) => {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.startsWith("#")) return env;

      const separatorIndex = cleanLine.indexOf("=");
      if (separatorIndex === -1) return env;

      const key = cleanLine.slice(0, separatorIndex).trim();
      const value = cleanLine
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");

      env[key] = value;
      return env;
    }, {});
}

const fileEnv = envFiles.reduce((env, fileName) => {
  return { ...env, ...parseEnvFile(path.join(rootDir, fileName)) };
}, {});

const apiUrl = process.env.VITE_API_URL || fileEnv.VITE_API_URL;
const isRemoteBuild = Boolean(process.env.CI || process.env.VERCEL || process.env.RENDER);

function fail(message) {
  console.error(`Error de configuracion: ${message}`);
  process.exit(1);
}

if (!apiUrl) {
  fail("falta VITE_API_URL. Configurala en Vercel antes de hacer deploy.");
}

let parsedUrl;
try {
  parsedUrl = new URL(apiUrl);
} catch {
  fail(`VITE_API_URL no es una URL valida: ${apiUrl}`);
}

const localHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
if (isRemoteBuild && localHosts.has(parsedUrl.hostname)) {
  fail("VITE_API_URL apunta a localhost en un build remoto. Usa la URL publica del backend en Render.");
}

console.log(`VITE_API_URL OK: ${parsedUrl.origin}`);
