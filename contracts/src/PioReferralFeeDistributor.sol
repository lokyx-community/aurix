// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IReferralToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @notice Routes already-collected protocol trading fees using PioSwap's published 50/30/10/5/3/2 split.
/// @dev This contract never splits user liquidity deposits or LP principal. The configured feeCollector must
///      be part of the actual swap-fee path and approve this contract before calling distributeFee.
contract PioReferralFeeDistributor {
    uint256 private constant BPS = 10_000;
    address public owner;
    address public treasury;
    address public feeCollector;
    mapping(address => address) public referrerOf;
    uint256 private lockState = 1;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event TreasuryChanged(address indexed previousTreasury, address indexed newTreasury);
    event FeeCollectorChanged(address indexed previousCollector, address indexed newCollector);
    event ReferrerBound(address indexed account, address indexed referrer);
    event FeeDistributed(address indexed token, address indexed lpProvider, uint256 amount, uint256 treasuryAmount, uint256 lpAmount, uint256 directReferral, uint256 level2, uint256 level3, uint256 level4);

    modifier onlyOwner() { require(msg.sender == owner, "NOT_OWNER"); _; }
    modifier onlyCollector() { require(msg.sender == feeCollector && feeCollector != address(0), "NOT_FEE_COLLECTOR"); _; }
    modifier nonReentrant() { require(lockState == 1, "REENTRANT_CALL"); lockState = 2; _; lockState = 1; }

    constructor(address treasury_, address owner_) {
        require(treasury_ != address(0) && owner_ != address(0), "ZERO_ADDRESS");
        treasury = treasury_;
        owner = owner_;
        emit OwnershipTransferred(address(0), owner_);
    }

    function setTreasury(address treasury_) external onlyOwner {
        require(treasury_ != address(0), "ZERO_ADDRESS");
        emit TreasuryChanged(treasury, treasury_);
        treasury = treasury_;
    }

    function setFeeCollector(address collector) external onlyOwner {
        require(collector != address(0), "ZERO_ADDRESS");
        emit FeeCollectorChanged(feeCollector, collector);
        feeCollector = collector;
    }

    /// @notice A wallet can bind a single upstream referrer; it cannot rebind or self-refer.
    function bindReferrer(address referrer) external {
        require(referrer != address(0) && referrer != msg.sender, "INVALID_REFERRER");
        require(referrerOf[msg.sender] == address(0), "REFERRER_ALREADY_BOUND");
        // Walk the ancestry to prevent cycles even if the tree is deeper than the payout levels.
        // A hard limit bounds gas use for malformed/extremely deep trees.
        address cursor = referrer;
        for (uint256 i = 0; i < 64 && cursor != address(0); i++) {
            require(cursor != msg.sender, "REFERRAL_CYCLE");
            cursor = referrerOf[cursor];
        }
        require(cursor == address(0), "REFERRAL_TREE_TOO_DEEP");
        referrerOf[msg.sender] = referrer;
        emit ReferrerBound(msg.sender, referrer);
    }

    /// @notice Distribute an already-collected token fee. All amounts are integer token units.
    function distributeFee(address token, uint256 amount, address lpProvider) external onlyCollector nonReentrant {
        require(token != address(0) && amount > 0, "INVALID_FEE");
        require(IReferralToken(token).transferFrom(msg.sender, address(this), amount), "FEE_TRANSFER_FAILED");

        uint256 lpShare = amount * 3_000 / BPS;
        uint256 level1 = amount * 1_000 / BPS;
        uint256 level2 = amount * 500 / BPS;
        uint256 level3 = amount * 300 / BPS;
        uint256 level4 = amount * 200 / BPS;
        // Keep the stated split fixed; route integer-rounding dust to treasury.
        uint256 platformAmount = amount * 5_000 / BPS;
        uint256 lpAmount = lpProvider == address(0) ? 0 : lpShare;
        platformAmount += amount - platformAmount - lpShare - level1 - level2 - level3 - level4;

        address r1 = lpProvider == address(0) ? address(0) : referrerOf[lpProvider];
        address r2 = r1 == address(0) ? address(0) : referrerOf[r1];
        address r3 = r2 == address(0) ? address(0) : referrerOf[r2];
        address r4 = r3 == address(0) ? address(0) : referrerOf[r3];
        uint256 paid1 = r1 == address(0) ? 0 : level1;
        uint256 paid2 = r2 == address(0) ? 0 : level2;
        uint256 paid3 = r3 == address(0) ? 0 : level3;
        uint256 paid4 = r4 == address(0) ? 0 : level4;
        platformAmount += level1 - paid1 + level2 - paid2 + level3 - paid3 + level4 - paid4;
        if (lpProvider == address(0)) platformAmount += lpShare;

        require(IReferralToken(token).transfer(treasury, platformAmount), "TREASURY_TRANSFER_FAILED");
        if (lpAmount > 0) require(IReferralToken(token).transfer(lpProvider, lpAmount), "LP_TRANSFER_FAILED");
        if (paid1 > 0) require(IReferralToken(token).transfer(r1, paid1), "L1_TRANSFER_FAILED");
        if (paid2 > 0) require(IReferralToken(token).transfer(r2, paid2), "L2_TRANSFER_FAILED");
        if (paid3 > 0) require(IReferralToken(token).transfer(r3, paid3), "L3_TRANSFER_FAILED");
        if (paid4 > 0) require(IReferralToken(token).transfer(r4, paid4), "L4_TRANSFER_FAILED");

        emit FeeDistributed(token, lpProvider, amount, platformAmount, lpAmount, paid1, paid2, paid3, paid4);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ZERO_ADDRESS");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
