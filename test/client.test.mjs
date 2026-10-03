import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { Client } from '../src/client.mjs';
import { envelope, sha256, parseJSON } from '../src/core.mjs';

test('Malformed UTF-8 and oversized control messages are rejected before parsing', () => {
 assert.throws(() => parseJSON(Buffer.from([34, 0xc0, 0xaf, 34])), e => e.code === 'invalid_request' && e.message === 'Malformed UTF-8');
 assert.throws(() => parseJSON('"' + 'a'.repeat(1048576) + '"'), e => e.code === 'invalid_request' && e.message.includes('1 MiB'));
 assert.equal(parseJSON(Buffer.from('"valid"')), 'valid');
});

test('Client bounds streamed bytes by the declared transfer size', async () => {
 let url;
 const server = http.createServer(async (req, res) => {
  if (req.url === '/bytes') { res.end(Buffer.alloc(32)); return; }
  let body = ''; for await (const part of req) body += part;
  const request = JSON.parse(body);
  const transfer = { transfer_id: 'transfer_12345678', artifact: 'artifact://com.example.ffmpeg/art_12345678', direction: 'download', status: 'prepared', expires_at: new Date(Date.now() + 10000).toISOString(), method: 'GET', url: url + '/bytes', authorization: 'caller_bearer', sha256: sha256(Buffer.alloc(1)), size_bytes: 1 };
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(envelope('transfer.prepared', transfer, request.caller.id, { request_id: request.request_id, provider_id: 'com.example.ffmpeg' })));
 });
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 url = `http://127.0.0.1:${server.address().port}`;
 try {
  const client = new Client(url + '/v1', { token: 'fixture-token', callerId: 'agent://one', providerId: 'com.example.ffmpeg', allowLoopback: true });
  await assert.rejects(client.download('artifact://com.example.ffmpeg/art_12345678'), e => e.code === 'integrity_mismatch' && e.message === 'Download exceeds declared size');
 } finally { await new Promise(resolve => server.close(resolve)); }
});
