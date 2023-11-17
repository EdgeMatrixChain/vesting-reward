const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");


describe("Consumption", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContractFixture() {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const initSupply = hre.ethers.parseEther("1000000000");
    const token = await hre.ethers.deployContract("TestToken", [1000000000]);
    console.log("TestToken initSupply:\t\t%d", hre.ethers.formatUnits(initSupply, 18), initSupply);
    totalSupply = await token.totalSupply();
    console.log("TestToken totalSupply:\t\t%d", hre.ethers.formatUnits(totalSupply, 18), totalSupply);
    await token.transfer(otherAccount, hre.ethers.parseEther("100"));


    const fundToken = await hre.ethers.deployContract("TestFundToken", [10000]);
    const fundTokenDecimal = await fundToken.decimals();
    console.log("decimal of the fund token:\t%d", fundTokenDecimal);
    expect(fundTokenDecimal).to.equals(6);

    const consumption = await hre.ethers.deployContract("ConsumptionV1", [token,fundToken]);

    return { token,fundToken, consumption, otherAccount, initSupply };
  }

  describe("Events", function () {
    it("Should emit an event on consumption", async function () {
      const { token,fundToken, consumption, otherAccount, initSupply } = await loadFixture(
        deployContractFixture
      );
      
      // call consume
      token.connect(otherAccount).approve();
      userTokenBalanceBefore = await token.balanceOf(otherAccount);
      console.log("userTokenBalanceBefore:\t\t%d", hre.ethers.formatUnits(userTokenBalanceBefore, 18), userTokenBalanceBefore);
      await token.connect(otherAccount).approve(consumption, hre.ethers.parseUnits("50", 18));

      console.log("consume:\t\t\t%d", 50, hre.ethers.parseUnits("50", 18));
      await expect(consumption.connect(otherAccount).burn(hre.ethers.parseUnits("50", 18), "123-456-789"))
        .to.emit(consumption, "ConsumptionBurned")
        .withArgs(otherAccount.address,
          hre.ethers.parseUnits("50", 18),
          "123-456-789")
        .to.emit(token, "Transfer")
        .withArgs(otherAccount.address,
          "0x0000000000000000000000000000000000000000",
          hre.ethers.parseUnits("50", 18));

      userTokenBalanceAfter = await token.balanceOf(otherAccount);
      console.log("userTokenBalanceAfter:\t\t%d", hre.ethers.formatUnits(userTokenBalanceAfter, 18), userTokenBalanceAfter);
      expect(BigInt(userTokenBalanceAfter)).to.equal(hre.ethers.parseUnits("50", 18));


      totalSupply = await token.totalSupply();
      console.log("TestToken totalSupply:\t\t%d", hre.ethers.formatUnits(totalSupply, 18), totalSupply);
      expect(BigInt(totalSupply)).to.equal(initSupply - hre.ethers.parseUnits("50", 18));

      console.log("consume:\t\t\t%d", 40, hre.ethers.parseUnits("40", 18));
      await token.connect(otherAccount).approve(consumption, hre.ethers.parseUnits("40", 18));
      await expect(consumption.connect(otherAccount).burn(hre.ethers.parseUnits("40", 18), "123-456-000"))
        .to.emit(consumption, "ConsumptionBurned")
        .withArgs(otherAccount.address,
          hre.ethers.parseUnits("40", 18),
          "123-456-000")
        .to.emit(token, "Transfer")
        .withArgs(otherAccount.address,
          "0x0000000000000000000000000000000000000000",
          hre.ethers.parseUnits("40", 18));

      totalSupply = await token.totalSupply();
      console.log("TestToken totalSupply:\t\t%d", hre.ethers.formatUnits(totalSupply, 18), totalSupply);
      expect(BigInt(totalSupply)).to.equal(initSupply - hre.ethers.parseUnits("90", 18));

      await token.connect(otherAccount).approve(consumption, hre.ethers.parseUnits("10", 18));

      await expect(
        consumption.connect(otherAccount).burn(hre.ethers.parseUnits("20", 18), "123-456-000")
      ).to.be.revertedWith("ConsumptionV1: checkTokenAllowance Error");

      await token.connect(otherAccount).approve(consumption, hre.ethers.parseUnits("20", 18));
      await expect(
        consumption.connect(otherAccount).burn(hre.ethers.parseUnits("20", 18), "123-456-000")
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");


    });


  });

});
