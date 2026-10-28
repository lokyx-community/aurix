// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPioERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @notice Single-token staking with a separately funded reward token.
/// @dev Deploy only after the token addresses and reward economics have been verified.
contract PioStakingRewards {
    uint256 private constant PRECISION = 1e18;
    uint256 public constant MIN_REWARD_DURATION = 1 days;
    uint256 public constant MAX_REWARD_DURATION = 365 days;

    IPioERC20 public immutable stakingToken;
    IPioERC20 public immutable rewardsToken;
    address public owner;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public userRewardPerTokenPaid;

    uint256 public rewardPerTokenStored;
    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public periodFinish;
    uint256 public rewardsDuration = 30 days;
    uint256 private lockState = 1;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Staked(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event RewardPaid(address indexed account, uint256 reward);
    event RewardsFunded(uint256 amount, uint256 rewardRate, uint256 periodFinish);
    event RewardsDurationChanged(uint256 duration);

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    modifier nonReentrant() {
        require(lockState == 1, "REENTRANT_CALL");
        lockState = 2;
        _;
        lockState = 1;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    constructor(address stakingToken_, address rewardsToken_, address owner_) {
        require(stakingToken_ != address(0) && rewardsToken_ != address(0) && owner_ != address(0), "ZERO_ADDRESS");
        require(stakingToken_.code.length != 0 && rewardsToken_.code.length != 0, "TOKEN_NOT_CONTRACT");
        stakingToken = IPioERC20(stakingToken_);
        rewardsToken = IPioERC20(rewardsToken_);
        owner = owner_;
        emit OwnershipTransferred(address(0), owner_);
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalSupply == 0) return rewardPerTokenStored;
        return rewardPerTokenStored + ((lastTimeRewardApplicable() - lastUpdateTime) * rewardRate * PRECISION / totalSupply);
    }

    function earned(address account) public view returns (uint256) {
        return balanceOf[account] * (rewardPerToken() - userRewardPerTokenPaid[account]) / PRECISION + rewards[account];
    }

    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "ZERO_AMOUNT");
        totalSupply += amount;
        balanceOf[msg.sender] += amount;
        require(stakingToken.transferFrom(msg.sender, address(this), amount), "STAKE_TRANSFER_FAILED");
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0 && balanceOf[msg.sender] >= amount, "INVALID_AMOUNT");
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        require(stakingToken.transfer(msg.sender, amount), "WITHDRAW_TRANSFER_FAILED");
        emit Withdrawn(msg.sender, amount);
    }

    function claimReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "NO_REWARD");
        rewards[msg.sender] = 0;
        require(rewardsToken.transfer(msg.sender, reward), "REWARD_TRANSFER_FAILED");
        emit RewardPaid(msg.sender, reward);
    }

    /// @notice Pulls a verified reward amount from the owner and starts/restarts the stream.
    /// @dev Owner must approve this contract for `amount`; fund reward inventory before advertising an APY.
    function fundRewards(uint256 amount) external onlyOwner nonReentrant updateReward(address(0)) {
        require(amount > 0, "ZERO_AMOUNT");
        require(rewardsToken.transferFrom(msg.sender, address(this), amount), "FUND_TRANSFER_FAILED");
        uint256 updatedRate;
        if (block.timestamp >= periodFinish) {
            updatedRate = amount / rewardsDuration;
        } else {
            uint256 remaining = (periodFinish - block.timestamp) * rewardRate;
            updatedRate = (amount + remaining) / rewardsDuration;
        }
        require(updatedRate > 0, "RATE_TOO_LOW");
        require(updatedRate <= rewardsToken.balanceOf(address(this)) / rewardsDuration, "INSUFFICIENT_REWARD_RESERVE");
        rewardRate = updatedRate;
        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;
        emit RewardsFunded(amount, updatedRate, periodFinish);
    }

    function setRewardsDuration(uint256 duration) external onlyOwner {
        require(block.timestamp >= periodFinish, "REWARD_PERIOD_ACTIVE");
        require(duration >= MIN_REWARD_DURATION && duration <= MAX_REWARD_DURATION, "INVALID_DURATION");
        rewardsDuration = duration;
        emit RewardsDurationChanged(duration);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ZERO_ADDRESS");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
