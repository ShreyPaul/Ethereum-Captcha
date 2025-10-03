# Ethereum Captcha

This project is a work in progress.

This project implements a mining pool server with a mechanism to detect and penalize selfish mining (block withholding) using a "quiz" system, leveraging smart contracts and simulated miners.

## Key Components and Flow

1. **Smart Contract (`SelfishMinerQuiz.sol`)**
   - Stores quiz assignments, deadlines, and penalties for each miner.
   - Allows the pool to generate a quiz for a miner and verify their solution.
   - Applies penalties if a miner fails to solve the quiz in time.

2. **Pool Server (`server.js`)**
   - Manages miner connections via WebSocket.
   - Monitors miner behavior (e.g., block submissions).
   - Flags suspicious miners and assigns them a quiz using the smart contract.
   - Sends the quiz block to the miner and checks for timely solutions.
   - Applies penalties via the contract if the miner fails the quiz.

3. **Simulated Miners**
   - `miner-honest.js`: Simulates an honest miner who solves quizzes correctly.
   - `miner-malicious.js`: Simulates a selfish miner who submits multiple blocks (mimicking block withholding).

4. **Deployment and Environment**
   - `deploy.js`: Deploys the smart contract.
   - `update_env.js`: Updates the .env file with the deployed contract address for the server to use.
   - Environment variables in `.env` configure addresses and RPC endpoints.

## Overall Logic

1. **Miner Connects:**  
   A miner connects to the pool server via WebSocket, identified by their address.

2. **Block Submission:**  
   Miners submit blocks to the pool. The server monitors these submissions for suspicious patterns (e.g., multiple blocks at once).

3. **Suspicious Behavior Detected:**  
   If a miner is flagged (e.g., for submitting multiple blocks rapidly), the server:
   - Calls `generateQuiz` on the `SelfishMinerQuiz` contract to create a quiz for that miner.
   - Sends a quiz block (with a known solution) to the miner.

4. **Quiz Response:**  
   - Honest miners (see `miner-honest.js`) solve the quiz and submit the solution.
   - Malicious miners may fail or ignore the quiz.

5. **Penalty Enforcement:**  
   - The server checks quiz deadlines.
   - If a miner fails to solve the quiz in time, the server calls `applyPenalty` on the contract, incrementing their penalty count.
- SelfishMinerQuiz.sol  
- server.js  
- miner-honest.js  
- miner-malicious.js  
- deploy.js  
- update_env.js  
- .env
