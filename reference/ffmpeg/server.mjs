import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createArtifactProvider } from '../provider/server.mjs';
const capability = JSON.parse(await readFile(new URL('./capability.json', import.meta.url)));
export function createProvider(options = {}) { return createArtifactProvider({ capability, ...options }); }
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.env.SPPA_TOKEN) throw new Error('Set SPPA_TOKEN explicitly before starting this development provider');
  const provider = await createProvider({ tokens: { [process.env.SPPA_TOKEN]: process.env.SPPA_CALLER_ID ?? 'agent://example' }, port: Number(process.env.PORT ?? 0) });
  const info = { endpoint: provider.url + '/v1', manifest: provider.manifest, publicKey: provider.publicKey.export({ format: 'jwk' }), keyId: provider.keyId };
  if (process.send) process.send(info); else console.log(JSON.stringify(info, null, 2));
  process.on('SIGTERM', async () => { await provider.close(); process.exit(0); });
  process.on('SIGINT', async () => { await provider.close(); process.exit(0); });
}
