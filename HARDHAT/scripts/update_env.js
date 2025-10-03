// scripts/update-env.js
const fs = require('fs');
const { ethers } = require('ethers');

async function updateEnv() {
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  const contract = await ethers.getContract('SelfishMinerQuiz');
  
  fs.appendFileSync('.env', `\nCONTRACT_ADDRESS=${contract.target}`);
}

updateEnv();