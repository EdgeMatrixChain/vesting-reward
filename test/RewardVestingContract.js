const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

function Enum(...options) {
  return Object.fromEntries(options.map((key, i) => [key, i]));
}
const durationUnit = Enum('Days', 'Days30', 'Days90', 'Days180', 'Days360');
const durationUnitName = ['Days', 'Days30', 'Days90', 'Days180', 'Days360'];
const ONE_DAY_IN_SECS = 24 * 60 * 60;
const ONE_ETHER = BigInt(1e18);


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

    // Assuming that 1e18 = 100% and 0.01e18 = 1% and 0.001e18 = 0.1%.
    const daysRewardRate = hre.ethers.parseUnits("0.01", "ether");
    const days30RewardRate = hre.ethers.parseUnits("0.01", "ether");
    const days90RewardRate = hre.ethers.parseUnits("0.01", "ether");
    const days180RewardRate = hre.ethers.parseUnits("0.01", "ether");
    const days360RewardRate = hre.ethers.parseUnits("0.01", "ether");
    const vesting = await hre.ethers.deployContract("RewardVestingContract",
      [token, daysRewardRate, ONE_ETHER, days30RewardRate, ONE_ETHER, days90RewardRate, ONE_ETHER, days180RewardRate, ONE_ETHER, days360RewardRate, ONE_ETHER]);
    await vesting.waitForDeployment();

    const scheduleRewards = {
      "Days": daysRewardRate,
      "Days30": days30RewardRate,
      "Days90": days90RewardRate,
      "Days180": days180RewardRate,
      "Days360": days360RewardRate
    };
    return { token, vesting, owner, otherAccount, unlockTime, scheduleRewards };
  }

  async function deployContractFixture_testDays() {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();


    const initSupply = hre.ethers.parseEther("1000000");
    const token = await hre.ethers.deployContract("TestToken", [initSupply]);
    await token.transfer(otherAccount, hre.ethers.parseEther("100"));

    // Assuming that 1e18 = 100% and 0.01e18 = 1% and 0.001e18 = 0.1%.
    const DAYS_DURATION_MULTIPLE = BigInt(1e18);
    const daysRewardRate = hre.ethers.parseUnits("0.0067", "ether");
    const days30RewardRate = hre.ethers.parseUnits("0.01", "ether");
    const days90RewardRate = hre.ethers.parseUnits("0.01", "ether");
    const days180RewardRate = hre.ethers.parseUnits("0.01", "ether");
    const days360RewardRate = hre.ethers.parseUnits("0.01", "ether");
    const vesting = await hre.ethers.deployContract("RewardVestingContract",
      [token, daysRewardRate, DAYS_DURATION_MULTIPLE, days30RewardRate, ONE_ETHER, days90RewardRate, ONE_ETHER, days180RewardRate, ONE_ETHER, days360RewardRate, ONE_ETHER]);
    await vesting.waitForDeployment();

    const scheduleRewards = {
      "Days": daysRewardRate,
      "Days30": days30RewardRate,
      "Days90": days90RewardRate,
      "Days180": days180RewardRate,
      "Days360": days360RewardRate
    };
    return { token, vesting, owner, otherAccount, scheduleRewards, DAYS_DURATION_MULTIPLE };
  }

  async function deployContractFixture_testDays30() {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();


    const initSupply = hre.ethers.parseEther("1000000");
    const token = await hre.ethers.deployContract("TestToken", [initSupply]);
    await token.transfer(otherAccount, hre.ethers.parseEther("100"));

    // Assuming that 1e18 = 100% and 0.01e18 = 1% and 0.001e18 = 0.1%.
    const DAYS30_DURATION_MULTIPLE = BigInt(1.03e18);
    const daysRewardRate = hre.ethers.parseUnits("0.01", "ether");
    const days30RewardRate = hre.ethers.parseUnits("0.01", "ether");
    const days90RewardRate = hre.ethers.parseUnits("0.01", "ether");
    const days180RewardRate = hre.ethers.parseUnits("0.01", "ether");
    const days360RewardRate = hre.ethers.parseUnits("0.01", "ether");
    const vesting = await hre.ethers.deployContract("RewardVestingContract",
      [token, daysRewardRate, ONE_ETHER, days30RewardRate, DAYS30_DURATION_MULTIPLE, days90RewardRate, ONE_ETHER, days180RewardRate, ONE_ETHER, days360RewardRate, ONE_ETHER]);
    await vesting.waitForDeployment();

    const scheduleRewards = {
      "Days": daysRewardRate,
      "Days30": days30RewardRate,
      "Days90": days90RewardRate,
      "Days180": days180RewardRate,
      "Days360": days360RewardRate
    };
    return { token, vesting, owner, otherAccount, scheduleRewards, DAYS30_DURATION_MULTIPLE };
  }

  async function deployContractFixture_testDays90() {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();


    const initSupply = hre.ethers.parseEther("1000000");
    const token = await hre.ethers.deployContract("TestToken", [initSupply]);
    await token.transfer(otherAccount, hre.ethers.parseEther("100"));

    // Assuming that 1e18 = 100% and 0.01e18 = 1% and 0.001e18 = 0.1%.
    const DAYS90_DURATION_MULTIPLE = BigInt(1.055e18);
    const daysRewardRate = hre.ethers.parseUnits("0.01", "ether");
    const days30RewardRate = hre.ethers.parseUnits("0.01", "ether");
    const days90RewardRate = hre.ethers.parseUnits("0.013", "ether");
    const days180RewardRate = hre.ethers.parseUnits("0.01", "ether");
    const days360RewardRate = hre.ethers.parseUnits("0.01", "ether");
    const vesting = await hre.ethers.deployContract("RewardVestingContract",
      [token, daysRewardRate, ONE_ETHER, days30RewardRate, ONE_ETHER, days90RewardRate, DAYS90_DURATION_MULTIPLE, days180RewardRate, ONE_ETHER, days360RewardRate, ONE_ETHER]);
    await vesting.waitForDeployment();

    const scheduleRewards = {
      "Days": daysRewardRate,
      "Days30": days30RewardRate,
      "Days90": days90RewardRate,
      "Days180": days180RewardRate,
      "Days360": days360RewardRate
    };
    return { token, vesting, owner, otherAccount, scheduleRewards, DAYS90_DURATION_MULTIPLE };
  }

  describe("Test", function () {
    it("Contract constructor values", async function () {
      console.log("rewardRate:\t\t%d\n", ethers.parseUnits("0.0067", "ether"));
      console.log("multiple:\t\t%d\n", ethers.parseUnits("1.0", "ether"));

      console.log("rewardRate:\t\t%d\n", ethers.parseUnits("0.01", "ether"));
      console.log("multiple:\t\t%d\n", ethers.parseUnits("1.03", "ether"));

      console.log("rewardRate:\t\t%d\n", ethers.parseUnits("0.013", "ether"));
      console.log("multiple:\t\t%d\n", ethers.parseUnits("1.055", "ether"));

      console.log("rewardRate:\t\t%d\n", ethers.parseUnits("0.018", "ether"));
      console.log("multiple:\t\t%d\n", ethers.parseUnits("1.08", "ether"));

      console.log("rewardRate:\t\t%d\n", ethers.parseUnits("0.022", "ether"));
      console.log("multiple:\t\t%d\n", ethers.parseUnits("1.1", "ether"));

    });
  });

  describe("Events", function () {
    it("Should emit an event on release", async function () {
      const { token, vesting, owner, otherAccount, unlockTime, scheduleRewards } = await loadFixture(
        deployContractFixture
      );

      const startTime = await time.latest() + 60;

      // duration for deposit 

      const duration = 4;
      // durationUnit for deposit 
      const durUnit = durationUnit.Days30;
      // deposit amount
      const amount = ethers.parseEther("100");
      // set unlocktime (days)
      const releaseDays1 = 1 * 30;

      DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 1;
      if (durUnit == durationUnit.Days) {
      } else if (durUnit == durationUnit.Days30) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 30;
      } else if (durUnit == durationUnit.Days90) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 90;
      } else if (durUnit == durationUnit.Days180) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 180;
      } else if (durUnit == durationUnit.Days360) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 360;
      }
      const rewardRate = scheduleRewards[durationUnitName[durUnit]];

      // deposit tokens for releasing reward
      depositAmount = BigInt(amount) * BigInt(rewardRate) / BigInt(ONE_ETHER);
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
          rewardRate);


      // Testing for 1st release
      timeTo1 = startTime + releaseDays1 * ONE_DAY_IN_SECS;
      await time.increaseTo(timeTo1);

      elapsed = BigInt(timeTo1 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
      expectReleasableAmount = (BigInt(amount) * elapsed) / BigInt(duration);
      expectReleasableReward = expectReleasableAmount * BigInt(rewardRate) / BigInt(ONE_ETHER);

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
        vesting.connect(otherAccount).setDurationUnitRewards(0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
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

      [daysRewardPerGwei, daysDurationMultiple, days30RewardPerGwei, days30DurationMultiple, days90RewardPerGwei, days90DurationMultiple, days180RewardPerGwei, days180DurationMultiple, days360RewardPerGwei, days360DurationMultiple,] = await vesting.getDurationUnitRewards();
      expect(daysRewardPerGwei).to.equal(scheduleRewards["Days"]);
      expect(days30RewardPerGwei).to.equal(scheduleRewards["Days30"]);
      expect(days90RewardPerGwei).to.equal(scheduleRewards["Days90"]);
      expect(days180RewardPerGwei).to.equal(scheduleRewards["Days180"]);
      expect(days360RewardPerGwei).to.equal(scheduleRewards["Days360"]);

      await vesting.setDurationUnitRewards(0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      [daysRewardPerGwei, days30RewardPerGwei, days90RewardPerGwei, days180RewardPerGwei, days360RewardPerGwei] = await vesting.getDurationUnitRewards();
      expect(daysRewardPerGwei).to.equal(0);
      expect(days30RewardPerGwei).to.equal(0);
      expect(days90RewardPerGwei).to.equal(0);
      expect(days180RewardPerGwei).to.equal(0);
      expect(days360RewardPerGwei).to.equal(0);

      await vesting.setOperator(otherAccount.address)
      await vesting.connect(otherAccount).setOperator(otherAccount.address)
      await vesting.connect(otherAccount).setDurationUnitRewards(ONE_ETHER, ONE_ETHER, ONE_ETHER, ONE_ETHER, ONE_ETHER, ONE_ETHER, ONE_ETHER, ONE_ETHER, ONE_ETHER, ONE_ETHER);
      [daysRewardPerGwei, days30RewardPerGwei, days90RewardPerGwei, days180RewardPerGwei, days360RewardPerGwei] = await vesting.getDurationUnitRewards();
      expect(daysRewardPerGwei).to.equal(ONE_ETHER);
      expect(days30RewardPerGwei).to.equal(ONE_ETHER);
      expect(days90RewardPerGwei).to.equal(ONE_ETHER);
      expect(days180RewardPerGwei).to.equal(ONE_ETHER);
      expect(days360RewardPerGwei).to.equal(ONE_ETHER);

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
      const durUnit = durationUnit.Days30;
      // deposit amount
      const amount = ethers.parseEther("100");
      // set unlocktime (days)
      const releaseDays1 = 1 * 30;
      const releaseDays2 = 3 * 30;
      const releaseDays3 = 4 * 30;

      DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 1;
      if (durUnit == durationUnit.Days) {
      } else if (durUnit == durationUnit.Days30) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 30;
      } else if (durUnit == durationUnit.Days90) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 90;
      } else if (durUnit == durationUnit.Days180) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 180;
      } else if (durUnit == durationUnit.Days360) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 360;
      }

      // Testing for depoit
      // await token.approve(vesting, amount)
      // await vesting.createVestingSchedule(otherAccount.address, startTime, duration, durUnit, amount)

      // deposit tokens for releasing reward
      rewardRate = scheduleRewards[durationUnitName[durUnit]];
      expectRewardTotal = BigInt(amount) * BigInt(rewardRate) / BigInt(ONE_ETHER);
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
        console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether, yieldRate=%d",
          i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal), vesingSchedule.yieldRate);
      }

      console.log("vestingTimeStart:\t%o", new Date(startTime * 1000));
      console.log("duration:\t\t%d", duration);
      console.log("durationUnit:\t\t%s", durationUnitName[durUnit]);
      console.log("rewardRate:\t\t%s Ether\n", ethers.formatUnits(rewardRate, "ether"));

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
      expectReleasableReward = expectReleasableAmount * BigInt(rewardRate) / BigInt(ONE_ETHER);
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
      expectReleasableReward = expectReleasableAmount * BigInt(rewardRate) / BigInt(ONE_ETHER);
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
        console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether, yieldRate=%d, released=%d Ether, rewarded=%d Ether",
          i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal), vesingSchedule.yieldRate, ethers.formatEther(vesingSchedule.released), ethers.formatEther(vesingSchedule.rewarded));
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
      expectReleasableReward = expectReleasableAmount * BigInt(rewardRate) / BigInt(ONE_ETHER);
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
        console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether, yieldRate=%d, released=%d Ether, rewarded=%d Ether",
          i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal), vesingSchedule.yieldRate, ethers.formatEther(vesingSchedule.released), ethers.formatEther(vesingSchedule.rewarded));
      }
    });

    it("Should release the funds to the staker who deposit by Days", async function () {
      const { token, vesting, owner, otherAccount, scheduleRewards, DAYS_DURATION_MULTIPLE } = await loadFixture(
        deployContractFixture_testDays
      );

      const startTime = await time.latest() + 60;

      // duration for deposit 
      const duration = 12;
      // durationUnit for deposit 
      const durUnit = durationUnit.Days;
      // deposit amount
      const amount = ethers.parseEther("100");
      // set unlocktime (days)
      const releaseDays1 = 1;
      const releaseDays2 = 3;
      const releaseDays3 = 12;

      DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 1;
      if (durUnit == durationUnit.Days) {
      } else if (durUnit == durationUnit.Days30) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 30;
      } else if (durUnit == durationUnit.Days90) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 90;
      } else if (durUnit == durationUnit.Days180) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 180;
      } else if (durUnit == durationUnit.Days360) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 360;
      }
      // deposit tokens for releasing reward
      multiple = Number(DAYS_DURATION_MULTIPLE) / Number(ONE_ETHER);
      console.log("expectRewardMultiple:\t%f", multiple);
      rewardRate = Number(scheduleRewards[durationUnitName[durUnit]]) * (multiple ** (duration - 1));
      expectRewardTotal = BigInt(amount) * BigInt(rewardRate) / BigInt(ONE_ETHER);
      console.log("expectRewardTotal:\t%d Ether", ethers.formatEther(expectRewardTotal));
      depositPermanentAmount = expectRewardTotal;
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
        console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether, yieldRate=%d",
          i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal), vesingSchedule.yieldRate);
      }

      console.log("vestingTimeStart:\t%o", new Date(startTime * 1000));
      console.log("duration:\t\t%d", duration);
      console.log("durationUnit:\t\t%s", durationUnitName[durUnit]);
      console.log("rewardRate:\t\t%s Ether\n", ethers.formatUnits(BigInt(rewardRate), "ether"));

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
      timeTo1 = startTime + releaseDays3 * ONE_DAY_IN_SECS;
      await time.increaseTo(timeTo1);
      console.log("\n1st release time:\t%o", new Date((timeTo1) * 1000));

      elapsed = BigInt(timeTo1 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
      if (elapsed > duration) {
        elapsed = BigInt(duration);
      }
      console.log("elapsed:\t\t%d/%d", elapsed, duration);

      expectReleasableAmount = (BigInt(amount) * elapsed) / BigInt(duration);
      console.log("expectReleasableAmount:\t%d Ether", ethers.formatEther(expectReleasableAmount));
      expectReleasableReward = expectReleasableAmount * BigInt(rewardRate) / BigInt(ONE_ETHER);
      console.log("expectReleasableReward:\t%d Ether", ethers.formatEther(expectReleasableReward));

      [releasableAmount, releasableReward] = await vesting.getReleasableAmount(otherAccount.address)
      console.log("releasableAmount:\t%d Ether", ethers.formatEther(releasableAmount));
      console.log("releasableReward:\t%d Ether", ethers.formatEther(releasableReward));
      expect(BigInt(releasableAmount)).to.equal(expectReleasableAmount);
      expect(BigInt(releasableReward - expectReleasableReward)).to.lt(1e9);

      await vesting.release(otherAccount)
      console.log("release for account:\t%s", otherAccount.address);

      contractTokenBalance = await token.balanceOf(vesting);
      console.log("contractTokenBalance:\t%d Ether", ethers.formatEther(contractTokenBalance));
      expectTokenBalance = amount + depositPermanentAmount - expectReleasableAmount - expectReleasableReward;
      console.log("expectContractTokenBalance:\t%d Ether", ethers.formatEther(expectTokenBalance));

      userTokenBalanceAfter = await token.balanceOf(otherAccount.address);
      console.log("userTokenBalance:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
      expectUserTokenBalance = userTokenBalanceBefore - amount + expectReleasableAmount + expectReleasableReward;
      console.log("expectUserTokenBalance:\t%d Ether", ethers.formatEther(expectUserTokenBalance))

      lockedAmount = await vesting.getLockedAmount(otherAccount.address)
      console.log("lockedAmount:\t\t%d Ether\n", ethers.formatEther(lockedAmount));
      expect(lockedAmount).to.equal(amount - expectReleasableAmount);

      for (let i = 0; i < vesingScheduleList.length; i++) {
        vesingSchedule = vesingScheduleList[i]
        console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether, yieldRate=%d, released=%d Ether, rewarded=%d Ether",
          i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal), vesingSchedule.yieldRate, ethers.formatEther(vesingSchedule.released), ethers.formatEther(vesingSchedule.rewarded));
      }
    });

    it("Should release the funds to the staker who deposit by Days30", async function () {
      const { token, vesting, owner, otherAccount, scheduleRewards, DAYS30_DURATION_MULTIPLE } = await loadFixture(
        deployContractFixture_testDays30
      );

      const startTime = await time.latest() + 60;

      // duration for deposit 
      const duration = 6;
      // durationUnit for deposit 
      const durUnit = durationUnit.Days30;
      // deposit amount
      const amount = ethers.parseEther("100");
      // set unlocktime (days)
      const releaseDays1 = 1 * 30;
      const releaseDays2 = 3 * 30;
      const releaseDays3 = 12 * 30;

      DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 1;
      if (durUnit == durationUnit.Days) {
      } else if (durUnit == durationUnit.Days30) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 30;
      } else if (durUnit == durationUnit.Days90) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 90;
      } else if (durUnit == durationUnit.Days180) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 180;
      } else if (durUnit == durationUnit.Days360) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 360;
      }
      // deposit tokens for releasing reward
      multiple = Number(DAYS30_DURATION_MULTIPLE) / Number(ONE_ETHER);
      console.log("expectRewardMultiple:\t%f", multiple);
      rewardRate = Number(scheduleRewards[durationUnitName[durUnit]]) * (multiple ** (duration - 1));
      expectRewardTotal = BigInt(amount) * BigInt(rewardRate) / BigInt(ONE_ETHER);
      console.log("expectRewardTotal:\t%d Ether", ethers.formatEther(expectRewardTotal));
      depositPermanentAmount = expectRewardTotal;
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
        console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether, yieldRate=%d",
          i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal), vesingSchedule.yieldRate);
      }

      console.log("vestingTimeStart:\t%o", new Date(startTime * 1000));
      console.log("duration:\t\t%d", duration);
      console.log("durationUnit:\t\t%s", durationUnitName[durUnit]);
      console.log("rewardRate:\t\t%s Ether\n", ethers.formatUnits(BigInt(rewardRate), "ether"));

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
      timeTo1 = startTime + releaseDays3 * ONE_DAY_IN_SECS;
      await time.increaseTo(timeTo1);
      console.log("\n1st release time:\t%o", new Date((timeTo1) * 1000));

      elapsed = BigInt(timeTo1 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
      if (elapsed > duration) {
        elapsed = BigInt(duration);
      }
      console.log("elapsed:\t\t%d/%d", elapsed, duration);

      expectReleasableAmount = (BigInt(amount) * elapsed) / BigInt(duration);
      console.log("expectReleasableAmount:\t%d Ether", ethers.formatEther(expectReleasableAmount));
      expectReleasableReward = expectReleasableAmount * BigInt(rewardRate) / BigInt(ONE_ETHER);
      console.log("expectReleasableReward:\t%d Ether", ethers.formatEther(expectReleasableReward));

      [releasableAmount, releasableReward] = await vesting.getReleasableAmount(otherAccount.address)
      console.log("releasableAmount:\t%d Ether", ethers.formatEther(releasableAmount));
      console.log("releasableReward:\t%d Ether", ethers.formatEther(releasableReward));
      expect(BigInt(releasableAmount)).to.equal(expectReleasableAmount);
      expect(BigInt(releasableReward - expectReleasableReward)).to.lt(1e9);

      await vesting.release(otherAccount)
      console.log("release for account:\t%s", otherAccount.address);

      contractTokenBalance = await token.balanceOf(vesting);
      console.log("contractTokenBalance:\t%d Ether", ethers.formatEther(contractTokenBalance));
      expectTokenBalance = amount + depositPermanentAmount - expectReleasableAmount - expectReleasableReward;
      console.log("expectContractTokenBalance:\t%d Ether", ethers.formatEther(expectTokenBalance));

      userTokenBalanceAfter = await token.balanceOf(otherAccount.address);
      console.log("userTokenBalance:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
      expectUserTokenBalance = userTokenBalanceBefore - amount + expectReleasableAmount + expectReleasableReward;
      console.log("expectUserTokenBalance:\t%d Ether", ethers.formatEther(expectUserTokenBalance))

      lockedAmount = await vesting.getLockedAmount(otherAccount.address)
      console.log("lockedAmount:\t\t%d Ether\n", ethers.formatEther(lockedAmount));
      expect(lockedAmount).to.equal(amount - expectReleasableAmount);

      for (let i = 0; i < vesingScheduleList.length; i++) {
        vesingSchedule = vesingScheduleList[i]
        console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether, yieldRate=%d, released=%d Ether, rewarded=%d Ether",
          i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal), vesingSchedule.yieldRate, ethers.formatEther(vesingSchedule.released), ethers.formatEther(vesingSchedule.rewarded));
      }
    });

    it("Should release the funds to the staker who deposit by Days90", async function () {
      const { token, vesting, owner, otherAccount, scheduleRewards, DAYS90_DURATION_MULTIPLE } = await loadFixture(
        deployContractFixture_testDays90
      );

      const startTime = await time.latest() + 60;

      // duration for deposit 
      const duration = 4;
      // durationUnit for deposit 
      const durUnit = durationUnit.Days90;
      // deposit amount
      const amount = ethers.parseEther("100");
      // set unlocktime (days)
      const releaseDays1 = 1 * 90;
      const releaseDays2 = 3 * 90;
      const releaseDays3 = 4 * 90;

      DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 1;
      if (durUnit == durationUnit.Days) {
      } else if (durUnit == durationUnit.Days30) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 30;
      } else if (durUnit == durationUnit.Days90) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 90;
      } else if (durUnit == durationUnit.Days180) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 180;
      } else if (durUnit == durationUnit.Days360) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 360;
      }
      // deposit tokens for releasing reward
      multiple = Number(DAYS90_DURATION_MULTIPLE) / Number(ONE_ETHER);
      console.log("expectRewardMultiple:\t%f", multiple);
      rewardRate = Number(scheduleRewards[durationUnitName[durUnit]]) * (multiple ** (duration - 1));
      expectRewardTotal = BigInt(amount) * BigInt(rewardRate) / BigInt(ONE_ETHER);
      console.log("expectRewardTotal:\t%d Ether", ethers.formatEther(expectRewardTotal));
      depositPermanentAmount = expectRewardTotal + BigInt(0.001e18);
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
        console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether, yieldRate=%d",
          i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal), vesingSchedule.yieldRate);
      }

      console.log("vestingTimeStart:\t%o", new Date(startTime * 1000));
      console.log("duration:\t\t%d", duration);
      console.log("durationUnit:\t\t%s", durationUnitName[durUnit]);
      console.log("rewardRate:\t\t%s Ether\n", ethers.formatUnits(BigInt(rewardRate), "ether"));

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
      timeTo1 = startTime + releaseDays3 * ONE_DAY_IN_SECS;
      await time.increaseTo(timeTo1);
      console.log("\n1st release time:\t%o", new Date((timeTo1) * 1000));

      elapsed = BigInt(timeTo1 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
      if (elapsed > duration) {
        elapsed = BigInt(duration);
      }
      console.log("elapsed:\t\t%d/%d", elapsed, duration);

      expectReleasableAmount = (BigInt(amount) * elapsed) / BigInt(duration);
      console.log("expectReleasableAmount:\t%d Ether", ethers.formatEther(expectReleasableAmount));
      expectReleasableReward = expectReleasableAmount * BigInt(rewardRate) / BigInt(ONE_ETHER);
      console.log("expectReleasableReward:\t%d Ether", ethers.formatEther(expectReleasableReward));

      [releasableAmount, releasableReward] = await vesting.getReleasableAmount(otherAccount.address)
      console.log("releasableAmount:\t%d Ether", ethers.formatEther(releasableAmount));
      console.log("releasableReward:\t%d Ether", ethers.formatEther(releasableReward));
      expect(BigInt(releasableAmount)).to.equal(expectReleasableAmount);
      expect(BigInt(releasableReward - expectReleasableReward)).to.lt(1e9);

      // Release for account
      await vesting.release(otherAccount)
      console.log("release for account:\t%s", otherAccount.address);

      contractTokenBalance = await token.balanceOf(vesting);
      console.log("contractTokenBalance:\t%d Ether", ethers.formatEther(contractTokenBalance));
      expectTokenBalance = amount + depositPermanentAmount - expectReleasableAmount - expectReleasableReward;
      console.log("expectContractTokenBalance:\t%d Ether", ethers.formatEther(expectTokenBalance));

      userTokenBalanceAfter = await token.balanceOf(otherAccount.address);
      console.log("userTokenBalance:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
      expectUserTokenBalance = userTokenBalanceBefore - amount + expectReleasableAmount + expectReleasableReward;
      console.log("expectUserTokenBalance:\t%d Ether", ethers.formatEther(expectUserTokenBalance))

      lockedAmount = await vesting.getLockedAmount(otherAccount.address)
      console.log("lockedAmount:\t\t%d Ether\n", ethers.formatEther(lockedAmount));
      expect(lockedAmount).to.equal(amount - expectReleasableAmount);

      for (let i = 0; i < vesingScheduleList.length; i++) {
        vesingSchedule = vesingScheduleList[i]
        console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether, yieldRate=%d, released=%d Ether, rewarded=%d Ether",
          i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal), vesingSchedule.yieldRate, ethers.formatEther(vesingSchedule.released), ethers.formatEther(vesingSchedule.rewarded));
      }
    });
  });


});
