// Polyfill crypto.hash for Node.js < 21.7
// crypto.hash(algorithm, data, outputEncoding) was added in Node 21.7
// This shim makes Angular 20 work on Node 20
const crypto = require('crypto');
if (!crypto.hash) {
  crypto.hash = function(algorithm, data, outputEncoding) {
    return crypto.createHash(algorithm).update(data).digest(outputEncoding || 'hex');
  };
}
