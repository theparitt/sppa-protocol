import { readFile } from 'node:fs/promises';
import { parseJSON, validate } from '../src/core.mjs';
const [schema, file] = process.argv.slice(2);
if (!schema || !file) { console.error('Usage: npm run validate -- <schema-name> <json-file>'); process.exit(2); }
try { validate(schema, parseJSON(await readFile(file,'utf8'))); console.log(`${file}: valid ${schema} shape (semantic checks are separate)`); }
catch (error) { console.error(JSON.stringify(error.toJSON?.() ?? { message:error.message },null,2)); process.exitCode=1; }
