const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SelfishMinerQuiz", function () {
  let quizContract, pool, miner;

  beforeEach(async () => {
    const QuizContract = await ethers.getContractFactory("SelfishMinerQuiz");
    quizContract = await QuizContract.deploy();
    [pool, miner] = await ethers.getSigners();
  });

  it("Should validate correct solution", async () => {
    const seed = ethers.utils.formatBytes32String("testseed");
    const target = ethers.utils.parseEther("0.000001"); // Low target
    const deadline = 100;

    // Find valid nonce off-chain
    let nonce = 0;
    let hash;
    do {
      hash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(["bytes32", "uint256"], [seed, nonce])
      );
      nonce++;
    } while (ethers.BigNumber.from(hash).gte(target));
    const validNonce = nonce - 1;

    // Generate quiz
    await quizContract.connect(pool).generateQuiz(miner.address, seed, target, deadline);

    // Submit solution
    await expect(quizContract.connect(miner).submitSolution(validNonce))
      .to.emit(quizContract, "QuizSolved")
      .withArgs(miner.address, validNonce);

    const quiz = await quizContract.quizzes(miner.address);
    expect(quiz.active).to.be.false;
  });

  it("Should penalize expired quiz", async () => {
    const seed = ethers.utils.formatBytes32String("testseed");
    const target = ethers.utils.parseEther("0.000001");
    const deadline = 1; // 1 second

    await quizContract.connect(pool).generateQuiz(miner.address, seed, target, deadline);

    // Fast-forward time
    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine");

    // Apply penalty
    await expect(quizContract.connect(pool).applyPenalty(miner.address))
      .to.emit(quizContract, "PenaltyApplied")
      .withArgs(miner.address, 1);

    const penaltyCount = await quizContract.penalties(miner.address);
    expect(penaltyCount).to.equal(1);
  });
});