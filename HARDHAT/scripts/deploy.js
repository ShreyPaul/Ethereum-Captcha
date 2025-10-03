const hre = require("hardhat");

async function main() {
  // Get the contract factory
  const QuizContract = await hre.ethers.getContractFactory("SelfishMinerQuiz");

  // Deploy the contract
  const quizContract = await QuizContract.deploy();

  // Wait for the contract to be deployed (optional but recommended)
  await quizContract.deployed();

  // Log the contract address
  console.log("Contract deployed to:", quizContract.address);
}

// Handle errors
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});