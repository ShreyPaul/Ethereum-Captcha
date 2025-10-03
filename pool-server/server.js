require('dotenv').config();

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const { ethers } = require('ethers');

const app = express();
const server = http.createServer(app);
const wsServer = new WebSocket.Server({ server });

// Connect to Ethereum node and contract
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contractABI = require("../HARDHAT/artifacts/contracts/SelfishMinerQuiz.sol/SelfishMinerQuiz.json").abi;

const quizContract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI,
  wallet
);

// Track miner activity
const miners = {};

// WebSocket connection handling
wsServer.on('connection', (socket, req) => {
  const minerAddress = req.url.split('/').pop(); // Get miner address from URL
  miners[minerAddress] = { socket, submissions: [] };

  socket.on('message', async (message) => {
    const data = JSON.parse(message);
    
    if (data.type === 'blockSubmission') {
      handleBlockSubmission(minerAddress, data.block);
    }
  });
});

function handleBlockSubmission(miner, block) {
  try {
    // Validate and normalize the miner address
    miner = ethers.getAddress(miner);
  } catch (err) {
    console.error(`Invalid miner address: ${miner}`);
    return;
  }

  miners[miner].submissions.push(block);
  console.log(`Miner ${miner} submitted block ${block.number}`);
  // Check for suspicious behavior
  if (isSuspicious(miner)) {
    flagMiner(miner);
  }
}

function isSuspicious(miner) {
  const submissions = miners[miner].submissions;
  // Check for multiple consecutive blocks
  return submissions.length >= 2 && 
         submissions[0].number === submissions[1].number - 1;
}

async function flagMiner(miner) {
  const seed = ethers.id(`quiz-${Date.now()}`);
  const target = ethers.parseEther('0.000001');
  const deadline = 10;

  console.log(`Flagging miner ${miner} with quiz...`);
  const tx = await quizContract.generateQuiz(miner, seed, target, deadline);
  await tx.wait();
  console.log(`Quiz assigned to ${miner} (Tx: ${tx.hash})`);

  // Send quiz to miner
  const quizBlock = createQuizBlock(seed, target);
  miners[miner].socket.send(JSON.stringify({
    type: 'newWork',
    block: quizBlock
  }));
}

function createQuizBlock(seed, target) {
  return {
    header: {
      parentHash: '0x...', // Use latest network block
      difficulty: target.toString(),
      number: 'latest',
      timestamp: Math.floor(Date.now()/1000),
      seed: seed
    }
  };
}

// Check quiz results periodically
setInterval(async () => {
  for (const miner in miners) {
    try {
      console.log(`Checking quiz for miner ${miner}`);
      // Skip miners with no active quiz
      const quiz = await quizContract.quizzes(miner);
      if (!quiz.active) continue;

      // Check deadline
      if (Date.now() > quiz.deadline * 1000) {
        await quizContract.applyPenalty(miner);
        // Additional penalty logic
      }
      
    } catch (error) {
      console.error(`Error checking quiz for miner ${miner}:`, error);
    }
  }
}, 5000);

server.listen(3000, () => {
  console.log('Pool server running on port 3000');
  console.log(`Using contract: ${process.env.CONTRACT_ADDRESS}`);
});