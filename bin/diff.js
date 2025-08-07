#!/usr/bin/env node

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import open from 'open';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const [, , localPath, remotePath] = process.argv;

if (!localPath || !remotePath) {
  console.error('Usage: diff.js <localPath> <remotePath>');

  process.exit(1);
}

app.use('/bpmn-js', express.static(path.join(__dirname, '../node_modules/bpmn-js/dist')));

app.use('/fonts', express.static(path.join(__dirname, '../dist/fonts')));

app.use('/diff', express.static(path.join(__dirname, '../dist/diff')));

app.get('/', async (req, res) => {
  const localXml = await fs.readFile(localPath, 'utf8');
  const remoteXml = await fs.readFile(remotePath, 'utf8');

  const indexPath = path.join(__dirname, '../dist/diff/index.html');

  let html = await fs.readFile(indexPath, 'utf8');

  html = html
    .replace('<!-- REPLACE -->', `
window.localPath = \`${localPath}\`;
window.remotePath = \`${remotePath}\`;
window.localXml = \`${localXml}\`;
window.remoteXml = \`${remoteXml}\`;
`)

  res.send(html);
});

const PORT = 3000;

app.listen(PORT, () => {
  open(`http://localhost:${PORT}`);
  console.log(`Server listening on ${PORT}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
});

process.on('uncaughtException', err => {
  console.error('Uncaught exception:', err);
});

process.on('exit', code => {
  console.log('Node process is exiting with code', code);
});

function gracefulShutdown() {
  console.log('Received shutdown signal, closing server...');
  app.close(() => {
    console.log('All connections closed, exiting.');
    process.exit(0);
  });

  // Optionally, force exit after timeout (e.g., 10 seconds)
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully exiting...');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);