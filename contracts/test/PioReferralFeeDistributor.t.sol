// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/PioReferralFeeDistributor.sol";

contract TestToken {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    function mint(address to, uint256 amount) external { balanceOf[to] += amount; }
    function approve(address spender, uint256 amount) external returns (bool) { allowance[msg.sender][spender] = amount; return true; }
    function transfer(address to, uint256 amount) external returns (bool) { require(balanceOf[msg.sender] >= amount, "BALANCE"); balanceOf[msg.sender] -= amount; balanceOf[to] += amount; return true; }
    function transferFrom(address from, address to, uint256 amount) external returns (bool) { require(balanceOf[from] >= amount, "BALANCE"); require(allowance[from][msg.sender] >= amount, "ALLOWANCE"); allowance[from][msg.sender] -= amount; balanceOf[from] -= amount; balanceOf[to] += amount; return true; }
}

contract ReferralActor {
    function bind(PioReferralFeeDistributor distributor, address referrer) external { distributor.bindReferrer(referrer); }
}

contract PioReferralFeeDistributorTest {
    function testExactPublishedSplitWhenFourReferralLevelsExist() external {
        TestToken token = new TestToken();
        PioReferralFeeDistributor distributor = new PioReferralFeeDistributor(address(0xBEEF), address(this));
        distributor.setFeeCollector(address(this));
        ReferralActor lp = new ReferralActor();
        ReferralActor r1 = new ReferralActor();
        ReferralActor r2 = new ReferralActor();
        ReferralActor r3 = new ReferralActor();
        ReferralActor r4 = new ReferralActor();
        lp.bind(distributor, address(r1));
        r1.bind(distributor, address(r2));
        r2.bind(distributor, address(r3));
        r3.bind(distributor, address(r4));
        uint256 fee = 10_000;
        token.mint(address(this), fee);
        token.approve(address(distributor), fee);
        distributor.distributeFee(address(token), fee, address(lp));
        require(token.balanceOf(address(0xBEEF)) == 5_000, "PLATFORM_SHARE");
        require(token.balanceOf(address(lp)) == 3_000, "LP_SHARE");
        require(token.balanceOf(address(r1)) == 1_000, "DIRECT_SHARE");
        require(token.balanceOf(address(r2)) == 500, "L2_SHARE");
        require(token.balanceOf(address(r3)) == 300, "L3_SHARE");
        require(token.balanceOf(address(r4)) == 200, "L4_SHARE");
        require(token.balanceOf(address(0xBEEF)) + token.balanceOf(address(lp)) + token.balanceOf(address(r1)) + token.balanceOf(address(r2)) + token.balanceOf(address(r3)) + token.balanceOf(address(r4)) == fee, "DISTRIBUTION_NOT_EXACT");
    }

    function testMissingReferralsGoToTreasury() external {
        TestToken token = new TestToken();
        PioReferralFeeDistributor distributor = new PioReferralFeeDistributor(address(0xBEEF), address(this));
        distributor.setFeeCollector(address(this));
        ReferralActor lp = new ReferralActor();
        uint256 fee = 10_000;
        token.mint(address(this), fee);
        token.approve(address(distributor), fee);
        distributor.distributeFee(address(token), fee, address(lp));
        require(token.balanceOf(address(0xBEEF)) == 7_000, "TREASURY_FALLBACK");
        require(token.balanceOf(address(lp)) == 3_000, "LP_SHARE");
    }

    function testMissingLpAndReferralsRouteEntireFeeToTreasury() external {
        TestToken token = new TestToken();
        PioReferralFeeDistributor distributor = new PioReferralFeeDistributor(address(0xBEEF), address(this));
        distributor.setFeeCollector(address(this));
        uint256 fee = 10_000;
        token.mint(address(this), fee);
        token.approve(address(distributor), fee);
        distributor.distributeFee(address(token), fee, address(0));
        require(token.balanceOf(address(0xBEEF)) == fee, "TREASURY_FALLBACK");
    }
}
