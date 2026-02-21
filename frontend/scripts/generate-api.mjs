#!/usr/bin/env node
/**
 * Generate TypeScript types from the Vitalis backend OpenAPI spec.
 * Requires the backend to be running (e.g. `uv run fastapi dev`).
 *
 * Uses OPENAPI_URL or VITE_API_URL (default: http://localhost:8000).
 */

import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const baseUrl =
  process.env.OPENAPI_URL ||
  process.env.VITE_API_URL ||
  'http://localhost:8000'
const specUrl = `${baseUrl.replace(/\/$/, '')}/openapi.json`
const outFile = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'lib',
  'vitalis-api.ts'
)

execSync(`npx openapi-typescript "${specUrl}" -o "${outFile}"`, {
  stdio: 'inherit',
})
