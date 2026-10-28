// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice PioSwap referral attribution registry. This contract does NOT collect fees or pay rewards.
/// Referral binding is one-time, on-chain, and emitted for auditable indexing.
contract PioReferralRegistry {
    address public owner;
    mapping(address => address) public referrerOf;
    mapping(address => bool) public isRegistered;
    mapping(address => uint256) public referralCount;
    mapping(address => address[]) private referralsOf;

    event ReferrerBound(address indexed user, address indexed referrer, uint256 timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error ZeroAddress();
    error SelfReferral();
    error AlreadyBound();
    error ReferrerNotRegistered();

    constructor() { owner = msg.sender; emit OwnershipTransferred(address(0), msg.sender); }

    /// @notice Bind the caller to an existing referrer. Cannot be changed afterward.
    function bindReferrer(address referrer) external {
        if (referrer == address(0)) revert ZeroAddress();
        if (referrer == msg.sender) revert SelfReferral();
        if (referrerOf[msg.sender] != address(0)) revert AlreadyBound();
        // Requiring the referrer to have interacted with this registry avoids binding
        // to arbitrary unregistered addresses. The owner can self-register first.
        if (!isRegistered[referrer] && referrer != owner) {
            revert ReferrerNotRegistered();
        }
        referrerOf[msg.sender] = referrer;
        referralCount[referrer] += 1;
        referralsOf[referrer].push(msg.sender);
        emit ReferrerBound(msg.sender, referrer, block.timestamp);
    }

    /// @notice Register an address as a referral origin by calling this with address(0).
    /// Users can register themselves before sharing their referral link.
    function register() external {
        if (!isRegistered[msg.sender]) {
            isRegistered[msg.sender] = true;
            emit ReferrerBound(msg.sender, address(0), block.timestamp);
        }
    }

    function getReferrals(address referrer, uint256 offset, uint256 limit) external view returns (address[] memory page) {
        address[] storage all = referralsOf[referrer];
        if (offset >= all.length || limit == 0) return new address[](0);
        uint256 end = offset + limit;
        if (end > all.length) end = all.length;
        page = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) page[i - offset] = all[i];
    }

    function transferOwnership(address newOwner) external {
        if (msg.sender != owner) revert();
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
