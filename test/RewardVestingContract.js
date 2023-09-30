const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

function Enum(...options) {
  return Object.fromEntries(options.map((key, i) => [key, i]));
}
const durationUnit = Enum('Days', 'Weeks', 'Months', 'Quarters');
const durationUnitName = ['Days', 'Weeks', 'Months', 'Quarters'];
const ONE_DAY_IN_SECS = 24 * 60 * 60;
const ONE_GWEI = 1_000_000_000;


describe("VestingContract", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContractFixture() {

    const unlockTime = (await time.latest()) + ONE_DAY_IN_SECS * 300;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();


    const initSupply = hre.ethers.parseEther("1000000");
    const token = await hre.ethers.deployContract("TestToken", [initSupply]);
    await token.transfer(otherAccount, hre.ethers.parseEther("100"));

    const dayRewardPerGwei = hre.ethers.parseUnits("0.01", "gwei");
    const weekRewardPerGwei = hre.ethers.parseUnits("0.01", "gwei");
    const monthRewardPerGwei = hre.ethers.parseUnits("0.01", "gwei");
    const quarterRewardPerGwei = hre.ethers.parseUnits("0.01", "gwei");
    const vesting = await hre.ethers.deployContract("RewardVestingContract", [token, dayRewardPerGwei, weekRewardPerGwei, monthRewardPerGwei, quarterRewardPerGwei]);
    await vesting.waitForDeployment();

    const scheduleRewards = {
      "Days": dayRewardPerGwei,
      "Weeks": weekRewardPerGwei,
      "Months": monthRewardPerGwei,
      "Quarters": quarterRewardPerGwei
    };
    return { token, vesting, owner, otherAccount, unlockTime, scheduleRewards };
  }

  describe("Events", function () {
    it("Should emit an event on release", async function () {
      const { token, vesting, owner, otherAccount, unlockTime, scheduleRewards } = await loadFixture(
        deployContractFixture
      );

      const startTime = await time.latest() + 60;

      // duration for deposit 

      const duration = 4;
      // durationUnit for deposit 
      const durUnit = durationUnit.Weeks;
      // deposit amount
      const amount = ethers.parseEther("100");
      // set unlocktime (days)
      const releaseDays1 = 1 * 7;

      DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 1;
      if (durUnit == durationUnit.Days) {
      } else if (durUnit == durationUnit.Weeks) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 7;
      } else if (durUnit == durationUnit.Months) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 30;
      } else if (durUnit == durationUnit.Quarters) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 90;
      }
      const rewardPerGwei = scheduleRewards[durationUnitName[durUnit]];

      // deposit tokens for releasing reward
      depositAmount = BigInt(amount) * BigInt(rewardPerGwei) / BigInt(ONE_GWEI);
      await token.approve(vesting, depositAmount);
      await vesting.depositPermanently(depositAmount);
      contractTokenBalance = await token.balanceOf(vesting);
      expect(contractTokenBalance).to.equal(depositAmount);

      // create vesing schedule
      userTokenBalanceBefore = await token.balanceOf(otherAccount);
      await token.connect(otherAccount).approve(vesting, amount)
      await expect(vesting.connect(otherAccount).createVestingSchedule(otherAccount.address, startTime, duration, durUnit, amount))
        .to.emit(vesting, "VestingScheduleCreated")
        .withArgs(otherAccount.address,
          startTime,
          duration,
          durUnit,
          amount,
          rewardPerGwei);


      // Testing for 1st release
      timeTo1 = startTime + releaseDays1 * ONE_DAY_IN_SECS;
      await time.increaseTo(timeTo1);

      elapsed = BigInt(timeTo1 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
      expectReleasableAmount = (BigInt(amount) * elapsed) / BigInt(duration);
      expectReleasableReward = expectReleasableAmount * BigInt(rewardPerGwei) / BigInt(ONE_GWEI);

      [releasableAmount, releasableReward] = await vesting.getReleasableAmount(otherAccount.address)
      expect(BigInt(releasableAmount)).to.equal(expectReleasableAmount);
      expect(BigInt(releasableReward)).to.equal(expectReleasableReward);

      await expect(vesting.release(otherAccount))
        .to.emit(vesting, "TokensReleased")
        .withArgs(otherAccount.address, expectReleasableAmount, expectReleasableReward);
    });
  });


  describe("Operate", function () {
    it("Calling setDurationUnitRewards should revert if caller is not the operator", async () => {
      const { token, vesting, owner, otherAccount, unlockTime, scheduleRewards } = await loadFixture(
        deployContractFixture
      );

      await expect(
        vesting.connect(otherAccount).setDurationUnitRewards(0, 0, 0, 0),
      ).to.be.revertedWith("!auth");
    });

    it("Calling setOperator should revert if caller is not the operator", async () => {
      const { token, vesting, owner, otherAccount, unlockTime, scheduleRewards } = await loadFixture(
        deployContractFixture
      );

      await expect(
        vesting.connect(otherAccount).setOperator(otherAccount.address),
      ).to.be.revertedWith("!auth");
    });

    it("Should operate the contract by the operator", async function () {
      const { token, vesting, owner, otherAccount, unlockTime, scheduleRewards } = await loadFixture(
        deployContractFixture
      );

      [dayRewardPerGwei, weekRewardPerGwei, monthRewardPerGwei, quarterRewardPerGwei] = await vesting.getDurationUnitRewards();
      expect(dayRewardPerGwei).to.equal(scheduleRewards["Days"]);
      expect(weekRewardPerGwei).to.equal(scheduleRewards["Weeks"]);
      expect(monthRewardPerGwei).to.equal(scheduleRewards["Months"]);
      expect(quarterRewardPerGwei).to.equal(scheduleRewards["Quarters"]);

      await vesting.setDurationUnitRewards(0, 0, 0, 0);
      [dayRewardPerGwei, weekRewardPerGwei, monthRewardPerGwei, quarterRewardPerGwei] = await vesting.getDurationUnitRewards();
      expect(dayRewardPerGwei).to.equal(0);
      expect(weekRewardPerGwei).to.equal(0);
      expect(monthRewardPerGwei).to.equal(0);
      expect(quarterRewardPerGwei).to.equal(0);

      await vesting.setOperator(otherAccount.address)
      await vesting.connect(otherAccount).setOperator(otherAccount.address)
      await vesting.connect(otherAccount).setDurationUnitRewards(ONE_GWEI, ONE_GWEI, ONE_GWEI, ONE_GWEI);
      [dayRewardPerGwei, weekRewardPerGwei, monthRewardPerGwei, quarterRewardPerGwei] = await vesting.getDurationUnitRewards();
      expect(dayRewardPerGwei).to.equal(ONE_GWEI);
      expect(weekRewardPerGwei).to.equal(ONE_GWEI);
      expect(monthRewardPerGwei).to.equal(ONE_GWEI);
      expect(quarterRewardPerGwei).to.equal(ONE_GWEI);

    });
  });


  describe("CreateVestingSchedule and Release to staker", function () {
    it("Should release the funds to the staker", async function () {
      const { token, vesting, owner, otherAccount, unlockTime, scheduleRewards } = await loadFixture(
        deployContractFixture
      );

      const startTime = await time.latest() + 60;

      // duration for deposit 
      const duration = 4;
      // durationUnit for deposit 
      const durUnit = durationUnit.Months;
      // deposit amount
      const amount = ethers.parseEther("100");
      // set unlocktime (days)
      const releaseDays1 = 1 * 30;
      const releaseDays2 = 3 * 30;
      const releaseDays3 = 4 * 30;

      DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 1;
      if (durUnit == durationUnit.Days) {
      } else if (durUnit == durationUnit.Weeks) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 7;
      } else if (durUnit == durationUnit.Months) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 30;
      } else if (durUnit == durationUnit.Quarters) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 90;
      }

      // Testing for depoit
      // await token.approve(vesting, amount)
      // await vesting.createVestingSchedule(otherAccount.address, startTime, duration, durUnit, amount)

      // deposit tokens for releasing reward
      rewardPerGwei = scheduleRewards[durationUnitName[durUnit]];
      expectRewardTotal = BigInt(amount) * BigInt(rewardPerGwei) / BigInt(ONE_GWEI);
      depositPermanentAmount = expectRewardTotal * BigInt(3) / BigInt(4);
      await token.approve(vesting, depositPermanentAmount);
      await vesting.depositPermanently(depositPermanentAmount);
      console.log("depositPermanentAmount:\t%d Ether", ethers.formatEther(depositPermanentAmount));
      contractTokenBalance = await token.balanceOf(vesting);
      console.log("contractTokenBalance:\t%d Ether", ethers.formatEther(contractTokenBalance));
      expect(contractTokenBalance).to.equal(depositPermanentAmount);

      tokenAddress = await vesting.token()
      console.log("tokenAddress:\t%s", tokenAddress);

      permanentTotal = await vesting.permanentTotal()
      console.log("permanentTotal:\t%d Ether", ethers.formatEther(permanentTotal));

      userTokenBalanceBefore = await token.balanceOf(otherAccount);
      console.log("userTokenBalanceBefore:\t%d Ether", ethers.formatEther(userTokenBalanceBefore))
      await token.connect(otherAccount).approve(vesting, amount)
      // createVestingSchedule 2 times
      await vesting.connect(otherAccount).createVestingSchedule(otherAccount.address, startTime, duration, durUnit, amount / BigInt(2))
      await vesting.connect(otherAccount).createVestingSchedule(otherAccount.address, startTime, duration, durUnit, amount / BigInt(2))

      vesingScheduleList = await vesting.getVestingSchedule(otherAccount.address);
      expect(2, vesingScheduleList.length)

      for (let i = 0; i < vesingScheduleList.length; i++) {
        vesingSchedule = vesingScheduleList[i]
        console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether, rewardPerGwei=%d",
          i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal), vesingSchedule.rewardPerGwei);
      }

      console.log("vestingTimeStart:\t%o", new Date(startTime * 1000));
      console.log("duration:\t\t%d", duration);
      console.log("durationUnit:\t\t%s", durationUnitName[durUnit]);
      console.log("rewardPerGwei:\t\t%s Gwei\n", ethers.formatUnits(rewardPerGwei, "gwei"));

      lockedAmount = await vesting.getLockedAmount(otherAccount.address)
      console.log("lockedAmount:\t\t%d Ether", ethers.formatEther(lockedAmount));
      expect(lockedAmount).to.equal(amount);

      userTokenBalanceAfter = await token.balanceOf(otherAccount);
      console.log("userTokenBalance:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
      expect(userTokenBalanceAfter).to.equal(userTokenBalanceBefore - amount);

      contractTokenBalance = await token.balanceOf(vesting);
      console.log("contractTokenBalance:\t%d Ether\n", ethers.formatEther(contractTokenBalance));
      expect(contractTokenBalance).to.equal(amount + depositPermanentAmount);


      // Testing for 1st release
      timeTo1 = startTime + releaseDays1 * ONE_DAY_IN_SECS;
      await time.increaseTo(timeTo1);
      console.log("\n1st release time:\t%o", new Date((timeTo1) * 1000));

      elapsed = BigInt(timeTo1 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
      console.log("elapsed:\t\t%d/%d", elapsed, duration);

      expectReleasableAmount = (BigInt(amount) * elapsed) / BigInt(duration);
      console.log("expectReleasableAmount:\t%d Ether", ethers.formatEther(expectReleasableAmount));
      expectReleasableReward = expectReleasableAmount * BigInt(rewardPerGwei) / BigInt(ONE_GWEI);
      console.log("expectReleasableReward:\t%d Ether", ethers.formatEther(expectReleasableReward));

      [releasableAmount, releasableReward] = await vesting.getReleasableAmount(otherAccount.address)
      console.log("releasableAmount:\t%d Ether", ethers.formatEther(releasableAmount));
      console.log("releasableReward:\t%d Ether", ethers.formatEther(releasableReward));
      expect(BigInt(releasableAmount)).to.equal(expectReleasableAmount);
      expect(BigInt(releasableReward)).to.equal(expectReleasableReward);

      await vesting.release(otherAccount)
      console.log("release for account:\t%s", otherAccount.address);

      contractTokenBalance = await token.balanceOf(vesting);
      console.log("contractTokenBalance:\t%d Ether", ethers.formatEther(contractTokenBalance));
      expect(contractTokenBalance).to.equal(amount + depositPermanentAmount - expectReleasableAmount - expectReleasableReward);

      userTokenBalanceAfter = await token.balanceOf(otherAccount.address);
      console.log("userTokenBalance:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
      expect(userTokenBalanceAfter).to.equal(userTokenBalanceBefore - amount + expectReleasableAmount + expectReleasableReward);

      lockedAmount = await vesting.getLockedAmount(otherAccount.address)
      console.log("lockedAmount:\t\t%d Ether\n", ethers.formatEther(lockedAmount));
      expect(lockedAmount).to.equal(amount - expectReleasableAmount);

      // Testing for 2nd release
      timeTo2 = startTime + releaseDays2 * ONE_DAY_IN_SECS;
      await time.increaseTo(timeTo2);
      console.log("\n2nd release time:\t%o", new Date((timeTo2) * 1000));

      elapsed = BigInt(timeTo2 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
      console.log("elapsed:\t\t%d/%d", elapsed, duration);

      latestReleasableAmount = expectReleasableAmount;
      latestReleasableReward = expectReleasableReward;

      expectReleasableAmount = (BigInt(amount) * elapsed) / BigInt(duration) - latestReleasableAmount;
      console.log("expectReleasableAmount:\t%d Ether", ethers.formatEther(expectReleasableAmount));
      expectReleasableReward = expectReleasableAmount * BigInt(rewardPerGwei) / BigInt(ONE_GWEI);
      console.log("expectReleasableReward:\t%d Ether", ethers.formatEther(expectReleasableReward));

      [releasableAmount, releasableReward] = await vesting.getReleasableAmount(otherAccount.address)
      console.log("releasableAmount:\t%d Ether", ethers.formatEther(releasableAmount));
      console.log("releasableReward:\t%d Ether", ethers.formatEther(releasableReward));
      expect(BigInt(releasableAmount)).to.equal(expectReleasableAmount);
      expect(BigInt(releasableReward)).to.equal(expectReleasableReward);

      await vesting.release(otherAccount)
      console.log("release for account:\t%s", otherAccount.address);

      contractTokenBalance = await token.balanceOf(vesting);
      console.log("contractTokenBalance:\t%d Ether", ethers.formatEther(contractTokenBalance));
      expect(contractTokenBalance).to.equal(amount + depositPermanentAmount - expectReleasableAmount - latestReleasableAmount - releasableReward - latestReleasableReward);

      userTokenBalanceAfter = await token.balanceOf(otherAccount.address);
      console.log("userTokenBalance:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
      expect(userTokenBalanceAfter).to.equal(userTokenBalanceBefore - amount + expectReleasableAmount + latestReleasableAmount + releasableReward + latestReleasableReward);

      lockedAmount = await vesting.balanceOf(otherAccount.address)
      console.log("lockedAmount:\t\t%d Ether\n", ethers.formatEther(lockedAmount));
      expect(lockedAmount).to.equal(amount - expectReleasableAmount - latestReleasableAmount);

      vesingScheduleList = await vesting.getVestingSchedule(otherAccount.address);
      expect(2, vesingScheduleList.length)

      for (let i = 0; i < vesingScheduleList.length; i++) {
        vesingSchedule = vesingScheduleList[i]
        console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether, rewardPerGwei=%d, released=%d Ether, rewarded=%d Ether",
          i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal), vesingSchedule.rewardPerGwei, ethers.formatEther(vesingSchedule.released), ethers.formatEther(vesingSchedule.rewarded));
      }

      // Testing for 3rd release
      timeTo3 = startTime + releaseDays3 * ONE_DAY_IN_SECS;
      await time.increaseTo(timeTo3);
      console.log("\n3rd release time:\t%o", new Date((timeTo3) * 1000));

      elapsed = BigInt(timeTo3 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
      console.log("elapsed:\t\t%d/%d", elapsed, duration);

      [amountTotal, releasedTotal, rewardedTotal] = await vesting.getAmount(otherAccount.address)
      expectReleasableAmount = (BigInt(amount) * elapsed) / BigInt(duration) - releasedTotal;
      console.log("expectReleasableAmount:\t%d Ether", ethers.formatEther(expectReleasableAmount));
      expectReleasableReward = expectReleasableAmount * BigInt(rewardPerGwei) / BigInt(ONE_GWEI);
      console.log("expectReleasableReward:\t%d Ether", ethers.formatEther(expectReleasableReward));

      [releasableAmount, releasableReward] = await vesting.getReleasableAmount(otherAccount.address)
      console.log("releasableAmount:\t%d Ether", ethers.formatEther(releasableAmount));
      console.log("releasableReward:\t%d Ether", ethers.formatEther(releasableReward));

      expect(BigInt(releasableAmount)).to.equal(expectReleasableAmount);
      expect(BigInt(releasableReward)).to.equal(expectReleasableReward);

      contractTokenBalance = await token.balanceOf(vesting);
      console.log("contractTokenBalance:\t%d Ether", ethers.formatEther(contractTokenBalance));
      // permanentTotal = await vesting.permanentTotal()
      // console.log("permanentTotal:\t%d Ether", ethers.formatEther(contractTokenBalance));

      // expect revert, because (permanentTotal - releasableReward) < 0
      await expect(
        vesting.release(otherAccount),
      ).to.be.revertedWith('VestingContract: tokens for reward is not enough');

      // deposit tokens for last release
      token.connect(otherAccount);
      depositAmount = releasableAmount + releasableReward - contractTokenBalance;
      await token.approve(vesting, depositAmount)
      await vesting.depositPermanently(depositAmount);
      console.log("depositPermanently:\t%d Ether", ethers.formatEther(depositAmount));
      contractTokenBalance = await token.balanceOf(vesting);
      console.log("contractTokenBalance:\t%d Ether", ethers.formatEther(contractTokenBalance));
      expect(contractTokenBalance).to.equal(releasableAmount + releasableReward);

      await vesting.release(otherAccount)
      console.log("release for account:\t%s", otherAccount.address);

      [amountTotal, releasedTotal, rewardedTotal] = await vesting.getAmount(otherAccount.address)
      console.log("amountTotal:\t%d Ether", ethers.formatEther(amountTotal));
      console.log("releasedTotal:\t%d Ether", ethers.formatEther(releasedTotal));
      console.log("rewardedTotal:\t%d Ether", ethers.formatEther(rewardedTotal));
      console.log("expectRewardTotal:\t%d Ether", ethers.formatEther(expectRewardTotal));

      expect(BigInt(amountTotal)).to.equal(BigInt(amount));
      expect(BigInt(releasedTotal)).to.equal(BigInt(amount));
      expect(BigInt(rewardedTotal)).to.equal(expectRewardTotal);

      contractTokenBalance = await token.balanceOf(vesting);
      console.log("contractTokenBalance:\t%d Ether", ethers.formatEther(contractTokenBalance));
      // expect(contractTokenBalance).to.equal(amount - expectReleasableAmount - latestReleasableAmount - releasableReward - latestReleasableReward);

      userTokenBalanceAfter = await token.balanceOf(otherAccount.address);
      console.log("userTokenBalanceAfter:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
      userTokenBalanceExpect = userTokenBalanceBefore + rewardedTotal;
      console.log("userTokenBalanceExpect:\t%d Ether", ethers.formatEther(userTokenBalanceExpect))
      expect(userTokenBalanceAfter).to.equal(userTokenBalanceExpect);

      lockedAmount = await vesting.balanceOf(otherAccount.address)
      console.log("lockedAmount:\t\t%d Ether\n", ethers.formatEther(lockedAmount));
      expect(lockedAmount).to.equal(BigInt(0));

      vesingScheduleList = await vesting.getVestingSchedule(otherAccount.address);
      expect(2, vesingScheduleList.length)

      for (let i = 0; i < vesingScheduleList.length; i++) {
        vesingSchedule = vesingScheduleList[i]
        console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether, rewardPerGwei=%d, released=%d Ether, rewarded=%d Ether",
          i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal), vesingSchedule.rewardPerGwei, ethers.formatEther(vesingSchedule.released), ethers.formatEther(vesingSchedule.rewarded));
      }
    });

  });
});
