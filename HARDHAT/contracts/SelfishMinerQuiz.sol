// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SelfishMinerQuiz {
    struct Quiz {
        bytes32 seed;
        uint256 target;
        uint256 deadline;
        bool active;
    }

    mapping(address => Quiz) public quizzes;
    mapping(address => uint256) public penalties;

    event QuizGenerated(address indexed miner, bytes32 seed, uint256 target, uint256 deadline);
    event QuizSolved(address indexed miner, uint256 nonce);
    event QuizFailed(address indexed miner);
    event PenaltyApplied(address indexed miner, uint256 amount);

    function generateQuiz(address miner, bytes32 seed, uint256 target, uint256 deadlineSeconds) external {
        require(!quizzes[miner].active, "Quiz already active");
        quizzes[miner] = Quiz({
            seed: seed,
            target: target,
            deadline: block.timestamp + deadlineSeconds,
            active: true
        });
        emit QuizGenerated(miner, seed, target, block.timestamp + deadlineSeconds);
    }

    function submitSolution(uint256 nonce) external {
        Quiz storage quiz = quizzes[msg.sender];
        require(quiz.active, "No active quiz");
        require(block.timestamp <= quiz.deadline, "Deadline passed");

        bytes32 hash = keccak256(abi.encodePacked(quiz.seed, nonce));
        require(uint256(hash) < quiz.target, "Invalid solution");

        quiz.active = false;
        emit QuizSolved(msg.sender, nonce);
    }

    function applyPenalty(address miner) external {
        Quiz storage quiz = quizzes[miner];
        require(quiz.active && block.timestamp > quiz.deadline, "Quiz not expired");
        penalties[miner] += 1; // Example penalty: increment counter
        quiz.active = false;
        emit QuizFailed(miner);
        emit PenaltyApplied(miner, penalties[miner]);
    }
}