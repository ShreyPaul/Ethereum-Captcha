require('dotenv').config();
const WebSocket = require('ws');

const minerAddress = process.env.HONEST_MINER_ADDRESS;
const ws = new WebSocket(`ws://localhost:3000/${minerAddress}`);

ws.on('open', () => {
  console.log('Connected to pool server');
});

ws.on('message', async (data) => {
  const message = JSON.parse(data.toString());
  
  if (message.type === 'newWork') {
    console.log('Received new work:', message.block);
    // Simulate solving the quiz (if it's a quiz block)
    if (message.block.header.seed) {
      // Submit the precomputed nonce (e.g., 42)
      ws.send(JSON.stringify({
        type: 'solution',
        nonce: 42,
        seed: message.block.header.seed
      }));
    }
  }
});