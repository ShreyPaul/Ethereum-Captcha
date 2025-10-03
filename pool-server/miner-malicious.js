require('dotenv').config();
const WebSocket = require('ws');

const minerAddress = process.env.MALICIOUS_MINER_ADDRESS;
const ws = new WebSocket(`ws://localhost:3000/${minerAddress}`);

ws.on('open', () => {
  console.log('Connected to pool server');
  
  // Simulate submitting multiple blocks (selfish mining behavior)
  setInterval(() => {
    ws.send(JSON.stringify({
      type: 'blockSubmission',
      block: {
        number: Math.floor(Math.random() * 100),
        hash: '0x' + Math.random().toString(16).substring(2)
      }
    }));
  }, 1000);
});