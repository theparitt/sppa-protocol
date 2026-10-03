#!/usr/bin/env node
// A controlled worker for admission/cancellation tests, not a transcoder.
import { copyFile } from 'node:fs/promises';
await new Promise(resolve => setTimeout(resolve, 250));
await copyFile(new URL('./input.mp4', import.meta.url), process.argv.at(-1));
