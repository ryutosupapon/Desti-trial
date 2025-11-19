#!/usr/bin/env node
const http = require('http');
const port = 3001;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true }));
});
server.on('error', (e) => {
  console.error('PORT_TEST_ERROR', e && e.code ? e.code : e);
  process.exit(2);
});
server.listen(port, '127.0.0.1', () => {
  console.log('PORT_TEST_READY', `http://127.0.0.1:${port}`);
});
