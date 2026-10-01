const tls = require('tls');
const fs = require('fs');
const path = require('path');

const sampleDir = path.join(__dirname, '..', '..', 'sample-certs');
if (!fs.existsSync(sampleDir)) {
  fs.mkdirSync(sampleDir, { recursive: true });
}

const domains = [
  { domain: 'google.com', filename: 'google.com.crt' },
  { domain: 'github.com', filename: 'github.com.cer' },
  { domain: 'cloudflare.com', filename: 'cloudflare.com.pem' },
  { domain: 'wikipedia.org', filename: 'wikipedia.org.crt' },
];

function fetchCertPem(domain) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host: domain,
        port: 443,
        servername: domain,
        rejectUnauthorized: false,
        timeout: 10000,
      },
      () => {
        try {
          const peerCert = socket.getPeerCertificate(true);
          if (!peerCert || !peerCert.raw) {
            socket.destroy();
            return reject(new Error('No certificate received'));
          }

          const base64 = peerCert.raw.toString('base64');
          const lines = base64.match(/.{1,64}/g).join('\n');
          const pem = `-----BEGIN CERTIFICATE-----\n${lines}\n-----END CERTIFICATE-----\n`;

          socket.destroy();
          resolve(pem);
        } catch (err) {
          socket.destroy();
          reject(err);
        }
      }
    );

    socket.on('error', (err) => {
      socket.destroy();
      reject(err);
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('Timed out'));
    });
  });
}

async function generate() {
  console.log('Fetching sample real-world certificates for testing...');
  for (const item of domains) {
    try {
      const pem = await fetchCertPem(item.domain);
      const filePath = path.join(sampleDir, item.filename);
      fs.writeFileSync(filePath, pem, 'utf8');
      console.log(`Saved sample certificate: ${item.filename}`);
    } catch (err) {
      console.warn(`Could not fetch for ${item.domain}: ${err.message}`);
    }
  }
  console.log('Sample certificates ready in sample-certs/ folder!');
}

generate();
