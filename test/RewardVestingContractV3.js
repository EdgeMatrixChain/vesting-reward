const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

function Enum(...options) {
  return Object.fromEntries(options.map((key, i) => [key, i]));
}
const durationUnit = Enum('Days30', 'Days90', 'Days180', 'Days360', 'Days720');
const durationUnitName = ['Days30', 'Days90', 'Days180', 'Days360', 'Days720'];
const ONE_DAY_IN_SECS = 24 * 60 * 60;
const ONE_ETHER = BigInt(1e18);


describe("VestingContract", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContractFixture() {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();


    const initSupply = hre.ethers.parseEther("1000000000");
    const token = await hre.ethers.deployContract("TestToken", [initSupply]);
    console.log("TestToken initSupply:\t\t%d", hre.ethers.formatUnits(initSupply, 18), initSupply); 
    await token.burn( hre.ethers.parseEther("100"));
    totalSupply = await token.totalSupply();
    console.log("TestToken totalSupply:\t\t%d", hre.ethers.formatUnits(totalSupply, 18), totalSupply); 
    await token.transfer(otherAccount, hre.ethers.parseEther("100"));

    // Assuming that 1e18 = 100% and 0.01e18 = 1% and 0.001e18 = 0.1%.
    const days30RewardRate = hre.ethers.parseUnits("0.01", "ether");
    const days90RewardRate = hre.ethers.parseUnits("0.01", "ether");
    const days180RewardRate = hre.ethers.parseUnits("0.01", "ether");
    const days360RewardRate = hre.ethers.parseUnits("0.01", "ether");
    const days720RewardRate = hre.ethers.parseUnits("0.01", "ether");
    const days1080RewardRate = hre.ethers.parseUnits("0.01", "ether");
    const vesting = await hre.ethers.deployContract("RewardVestingV3",
      [token, days30RewardRate, days90RewardRate, days180RewardRate, days360RewardRate, days720RewardRate, days1080RewardRate]);
    await vesting.waitForDeployment();

    const scheduleRewards = {
      "Days30": days30RewardRate,
      "Days90": days90RewardRate,
      "Days180": days180RewardRate,
      "Days360": days360RewardRate,
      "Days720": days720RewardRate,
    };
    return { token, vesting, owner, otherAccount, scheduleRewards };
  }


  describe("Contract", function () {
    it("Contract constructor values", async function () {
      console.log("30days rewardRate:\t\t%d\n", ethers.parseUnits("0.00225", "ether"));  // APR 0.027
      console.log("90days rewardRate:\t\t%d\n", ethers.parseUnits("0.007875", "ether")); // APR 0.0315
      console.log("180days rewardRate:\t\t%d\n", ethers.parseUnits("0.018", "ether")); // APR 0.036
      console.log("360days rewardRate:\t\t%d\n", ethers.parseUnits("0.048", "ether")); // APR 0.048
      console.log("720days rewardRate:\t\t%d\n", ethers.parseUnits("0.114", "ether")); // APR 0.057
      console.log("1080days rewardRate:\t\t%d\n", ethers.parseUnits("0.213", "ether")); // APR 0.071

    });
  });

  describe("Events", function () {
    it("Should emit an event on release", async function () {
      const { token, vesting, owner, otherAccount, scheduleRewards } = await loadFixture(
        deployContractFixture
      );

      const startTime = await time.latest() + 60;

      // duration for deposit 

      const duration = 1;
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
      await expect(vesting.connect(otherAccount).createVestingSchedule(otherAccount.address, startTime, durUnit, amount))
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



  describe("CreateVestingSchedule and Release to staker", function () {
    it("Should release the funds to the staker", async function () {
      const { token, vesting, owner, otherAccount, unlockTime, scheduleRewards } = await loadFixture(
        deployContractFixture
      );

      const startTime = await time.latest() + 60;

      // duration for deposit 
      const duration = 1;
      // durationUnit for deposit 
      const durUnit = durationUnit.Days30;
      // deposit amount
      const amount = ethers.parseEther("100");
      // set unlocktime (days)
      const releaseDays1 = 15;
      const releaseDays2 = 1 * 30;
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

      // deposit some tokens for releasing reward
      rewardRate = scheduleRewards[durationUnitName[durUnit]];
      expectRewardTotal = BigInt(amount) * BigInt(rewardRate) / BigInt(ONE_ETHER);

      depositPermanentAmount = expectRewardTotal / BigInt(2);
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
      await vesting.connect(otherAccount).createVestingSchedule(otherAccount.address, startTime, durUnit, amount / BigInt(2))
      await vesting.connect(otherAccount).createVestingSchedule(otherAccount.address, startTime, durUnit, amount / BigInt(2))

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


      // Testing for 1st release on 15th day
      timeTo1 = startTime + releaseDays1 * ONE_DAY_IN_SECS;
      await time.increaseTo(timeTo1);
      console.log("\n1st release time:\t%o", new Date((timeTo1) * 1000));

      elapsed = BigInt(timeTo1 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
      console.log("elapsed:\t\t%d/%d", elapsed, duration);

      expectReleasableAmount = BigInt(0);
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

      // Testing for 2nd release on 30th day
      timeTo2 = startTime + releaseDays2 * ONE_DAY_IN_SECS;
      await time.increaseTo(timeTo2);
      console.log("\n2nd release time:\t%o", new Date((timeTo2) * 1000));

      elapsed = BigInt(timeTo2 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
      console.log("elapsed:\t\t%d/%d", elapsed, duration);

      expectReleasableAmount = amount;
      console.log("expectReleasableAmount:\t%d Ether", ethers.formatEther(expectReleasableAmount));
      expectReleasableReward = expectReleasableAmount * BigInt(rewardRate) / BigInt(ONE_ETHER);
      console.log("expectReleasableReward:\t%d Ether", ethers.formatEther(expectReleasableReward));

      [releasableAmount, releasableReward] = await vesting.getReleasableAmount(otherAccount.address)
      console.log("releasableAmount:\t%d Ether", ethers.formatEther(releasableAmount));
      console.log("releasableReward:\t%d Ether", ethers.formatEther(releasableReward));
      expect(BigInt(releasableAmount)).to.equal(expectReleasableAmount);
      expect(BigInt(releasableReward)).to.equal(expectReleasableReward);

      console.log("release for account:\t%s", otherAccount.address);
      // expect revert, because (permanentTotal - releasableReward) < 0
      await expect(
        vesting.release(otherAccount),
      ).to.be.revertedWith('VestingContract: tokens for reward is not enough');

      // deposit more tokens for releasing reward
      depositPermanentAmount = expectRewardTotal / BigInt(2);
      await token.approve(vesting, depositPermanentAmount);
      await vesting.depositPermanently(depositPermanentAmount);
      console.log("depositPermanentAmount:\t%d Ether", ethers.formatEther(depositPermanentAmount));
      contractTokenBalance = await token.balanceOf(vesting);
      console.log("contractTokenBalance:\t%d Ether", ethers.formatEther(contractTokenBalance));
      expect(contractTokenBalance).to.equal(amount + expectRewardTotal);

      await vesting.release(otherAccount),

        contractTokenBalance = await token.balanceOf(vesting);
      console.log("contractTokenBalance:\t%d Ether", ethers.formatEther(contractTokenBalance));
      expect(contractTokenBalance).to.equal(BigInt(0));

      userTokenBalanceAfter = await token.balanceOf(otherAccount.address);
      console.log("userTokenBalance:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
      expect(userTokenBalanceAfter).to.equal(releasableAmount + releasableReward);

      lockedAmount = await vesting.balanceOf(otherAccount.address)
      console.log("lockedAmount:\t\t%d Ether\n", ethers.formatEther(lockedAmount));
      expect(lockedAmount).to.equal(0);

      vesingScheduleList = await vesting.getVestingSchedule(otherAccount.address);
      expect(2, vesingScheduleList.length)

      for (let i = 0; i < vesingScheduleList.length; i++) {
        vesingSchedule = vesingScheduleList[i]
        console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether, yieldRate=%d, released=%d Ether, rewarded=%d Ether",
          i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal), vesingSchedule.yieldRate, ethers.formatEther(vesingSchedule.released), ethers.formatEther(vesingSchedule.rewarded));
      }

      // Testing for 3rd release after 30 days
      timeTo3 = startTime + releaseDays3 * ONE_DAY_IN_SECS;
      await time.increaseTo(timeTo3);
      console.log("\n3rd release time:\t%o", new Date((timeTo3) * 1000));

      elapsed = BigInt(timeTo3 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
      console.log("elapsed:\t\t%d/%d", elapsed, duration);

      [amountTotal, releasedTotal, rewardedTotal] = await vesting.getAmount(otherAccount.address)
      expectReleasableAmount = BigInt(0);
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

      // query amounts 
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


    // it("Should release the funds to the staker who deposit by Days30", async function () {
    //   const { token, vesting, owner, otherAccount, scheduleRewards, DAYS30_DURATION_MULTIPLE } = await loadFixture(
    //     deployContractFixture_testDays30
    //   );

    //   const startTime = await time.latest() + 60;

    //   // duration for deposit 
    //   const duration = 6;
    //   // durationUnit for deposit 
    //   const durUnit = durationUnit.Days30;
    //   // deposit amount
    //   const amount = ethers.parseEther("100");
    //   // set unlocktime (days)
    //   const releaseDays1 = 1 * 30;
    //   const releaseDays2 = 3 * 30;
    //   const releaseDays3 = 12 * 30;

    //   DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 1;
    //   if (durUnit == durationUnit.Days) {
    //   } else if (durUnit == durationUnit.Days30) {
    //     DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 30;
    //   } else if (durUnit == durationUnit.Days90) {
    //     DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 90;
    //   } else if (durUnit == durationUnit.Days180) {
    //     DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 180;
    //   } else if (durUnit == durationUnit.Days360) {
    //     DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 360;
    //   }
    //   // deposit tokens for releasing reward
    //   console.log("expectRewardMultiple:\t%f", multiple);
    //   rewardRate = Number(scheduleRewards[durationUnitName[durUnit]]);
    //   expectRewardTotal = BigInt(amount) * BigInt(rewardRate) / BigInt(ONE_ETHER);
    //   console.log("expectRewardTotal:\t%d Ether", ethers.formatEther(expectRewardTotal));
    //   depositPermanentAmount = expectRewardTotal;
    //   await token.approve(vesting, depositPermanentAmount);
    //   await vesting.depositPermanently(depositPermanentAmount);
    //   console.log("depositPermanentAmount:\t%d Ether", ethers.formatEther(depositPermanentAmount));
    //   contractTokenBalance = await token.balanceOf(vesting);
    //   console.log("contractTokenBalance:\t%d Ether", ethers.formatEther(contractTokenBalance));
    //   expect(contractTokenBalance).to.equal(depositPermanentAmount);

    //   tokenAddress = await vesting.token()
    //   console.log("tokenAddress:\t%s", tokenAddress);

    //   permanentTotal = await vesting.permanentTotal()
    //   console.log("permanentTotal:\t%d Ether", ethers.formatEther(permanentTotal));

    //   userTokenBalanceBefore = await token.balanceOf(otherAccount);
    //   console.log("userTokenBalanceBefore:\t%d Ether", ethers.formatEther(userTokenBalanceBefore))
    //   await token.connect(otherAccount).approve(vesting, amount)
    //   // createVestingSchedule 2 times
    //   await vesting.connect(otherAccount).createVestingSchedule(otherAccount.address, startTime, durUnit, amount / BigInt(2))
    //   await vesting.connect(otherAccount).createVestingSchedule(otherAccount.address, startTime, durUnit, amount / BigInt(2))

    //   vesingScheduleList = await vesting.getVestingSchedule(otherAccount.address);
    //   expect(2, vesingScheduleList.length)

    //   for (let i = 0; i < vesingScheduleList.length; i++) {
    //     vesingSchedule = vesingScheduleList[i]
    //     console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether, yieldRate=%d",
    //       i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal), vesingSchedule.yieldRate);
    //   }

    //   console.log("vestingTimeStart:\t%o", new Date(startTime * 1000));
    //   console.log("duration:\t\t%d", duration);
    //   console.log("durationUnit:\t\t%s", durationUnitName[durUnit]);
    //   console.log("rewardRate:\t\t%s Ether\n", ethers.formatUnits(BigInt(rewardRate), "ether"));

    //   lockedAmount = await vesting.getLockedAmount(otherAccount.address)
    //   console.log("lockedAmount:\t\t%d Ether", ethers.formatEther(lockedAmount));
    //   expect(lockedAmount).to.equal(amount);

    //   userTokenBalanceAfter = await token.balanceOf(otherAccount);
    //   console.log("userTokenBalance:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
    //   expect(userTokenBalanceAfter).to.equal(userTokenBalanceBefore - amount);

    //   contractTokenBalance = await token.balanceOf(vesting);
    //   console.log("contractTokenBalance:\t%d Ether\n", ethers.formatEther(contractTokenBalance));
    //   expect(contractTokenBalance).to.equal(amount + depositPermanentAmount);


    //   // Testing for 1st release
    //   timeTo1 = startTime + releaseDays3 * ONE_DAY_IN_SECS;
    //   await time.increaseTo(timeTo1);
    //   console.log("\n1st release time:\t%o", new Date((timeTo1) * 1000));

    //   elapsed = BigInt(timeTo1 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
    //   if (elapsed > duration) {
    //     elapsed = BigInt(duration);
    //   }
    //   console.log("elapsed:\t\t%d/%d", elapsed, duration);

    //   expectReleasableAmount = (BigInt(amount) * elapsed) / BigInt(duration);
    //   console.log("expectReleasableAmount:\t%d Ether", ethers.formatEther(expectReleasableAmount));
    //   expectReleasableReward = expectReleasableAmount * BigInt(rewardRate) / BigInt(ONE_ETHER);
    //   console.log("expectReleasableReward:\t%d Ether", ethers.formatEther(expectReleasableReward));

    //   [releasableAmount, releasableReward] = await vesting.getReleasableAmount(otherAccount.address)
    //   console.log("releasableAmount:\t%d Ether", ethers.formatEther(releasableAmount));
    //   console.log("releasableReward:\t%d Ether", ethers.formatEther(releasableReward));
    //   expect(BigInt(releasableAmount)).to.equal(expectReleasableAmount);
    //   expect(BigInt(releasableReward - expectReleasableReward)).to.lt(1e9);

    //   await vesting.release(otherAccount)
    //   console.log("release for account:\t%s", otherAccount.address);

    //   contractTokenBalance = await token.balanceOf(vesting);
    //   console.log("contractTokenBalance:\t%d Ether", ethers.formatEther(contractTokenBalance));
    //   expectTokenBalance = amount + depositPermanentAmount - expectReleasableAmount - expectReleasableReward;
    //   console.log("expectContractTokenBalance:\t%d Ether", ethers.formatEther(expectTokenBalance));

    //   userTokenBalanceAfter = await token.balanceOf(otherAccount.address);
    //   console.log("userTokenBalance:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
    //   expectUserTokenBalance = userTokenBalanceBefore - amount + expectReleasableAmount + expectReleasableReward;
    //   console.log("expectUserTokenBalance:\t%d Ether", ethers.formatEther(expectUserTokenBalance))

    //   lockedAmount = await vesting.getLockedAmount(otherAccount.address)
    //   console.log("lockedAmount:\t\t%d Ether\n", ethers.formatEther(lockedAmount));
    //   expect(lockedAmount).to.equal(amount - expectReleasableAmount);

    //   for (let i = 0; i < vesingScheduleList.length; i++) {
    //     vesingSchedule = vesingScheduleList[i]
    //     console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether, yieldRate=%d, released=%d Ether, rewarded=%d Ether",
    //       i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal), vesingSchedule.yieldRate, ethers.formatEther(vesingSchedule.released), ethers.formatEther(vesingSchedule.rewarded));
    //   }
    // });

    // it("Should release the funds to the staker who deposit by Days90", async function () {
    //   const { token, vesting, owner, otherAccount, scheduleRewards, DAYS90_DURATION_MULTIPLE } = await loadFixture(
    //     deployContractFixture_testDays90
    //   );

    //   const startTime = await time.latest() + 60;

    //   // duration for deposit 
    //   const duration = 4;
    //   // durationUnit for deposit 
    //   const durUnit = durationUnit.Days90;
    //   // deposit amount
    //   const amount = ethers.parseEther("100");
    //   // set unlocktime (days)
    //   const releaseDays1 = 1 * 90;
    //   const releaseDays2 = 3 * 90;
    //   const releaseDays3 = 4 * 90;

    //   DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 1;
    //   if (durUnit == durationUnit.Days) {
    //   } else if (durUnit == durationUnit.Days30) {
    //     DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 30;
    //   } else if (durUnit == durationUnit.Days90) {
    //     DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 90;
    //   } else if (durUnit == durationUnit.Days180) {
    //     DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 180;
    //   } else if (durUnit == durationUnit.Days360) {
    //     DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 360;
    //   }
    //   // deposit tokens for releasing reward
    //   multiple = Number(DAYS90_DURATION_MULTIPLE) / Number(ONE_ETHER);
    //   console.log("expectRewardMultiple:\t%f", multiple);
    //   rewardRate = Number(scheduleRewards[durationUnitName[durUnit]]) * (multiple ** (duration - 1));
    //   expectRewardTotal = BigInt(amount) * BigInt(rewardRate) / BigInt(ONE_ETHER);
    //   console.log("expectRewardTotal:\t%d Ether", ethers.formatEther(expectRewardTotal));
    //   depositPermanentAmount = expectRewardTotal + BigInt(0.001e18);
    //   await token.approve(vesting, depositPermanentAmount);
    //   await vesting.depositPermanently(depositPermanentAmount);
    //   console.log("depositPermanentAmount:\t%d Ether", ethers.formatEther(depositPermanentAmount));
    //   contractTokenBalance = await token.balanceOf(vesting);
    //   console.log("contractTokenBalance:\t%d Ether", ethers.formatEther(contractTokenBalance));
    //   expect(contractTokenBalance).to.equal(depositPermanentAmount);

    //   tokenAddress = await vesting.token()
    //   console.log("tokenAddress:\t%s", tokenAddress);

    //   permanentTotal = await vesting.permanentTotal()
    //   console.log("permanentTotal:\t%d Ether", ethers.formatEther(permanentTotal));

    //   userTokenBalanceBefore = await token.balanceOf(otherAccount);
    //   console.log("userTokenBalanceBefore:\t%d Ether", ethers.formatEther(userTokenBalanceBefore))
    //   await token.connect(otherAccount).approve(vesting, amount)
    //   // createVestingSchedule 2 times
    //   await vesting.connect(otherAccount).createVestingSchedule(otherAccount.address, startTime, durUnit, amount / BigInt(2))
    //   await vesting.connect(otherAccount).createVestingSchedule(otherAccount.address, startTime, durUnit, amount / BigInt(2))

    //   vesingScheduleList = await vesting.getVestingSchedule(otherAccount.address);
    //   expect(2, vesingScheduleList.length)

    //   for (let i = 0; i < vesingScheduleList.length; i++) {
    //     vesingSchedule = vesingScheduleList[i]
    //     console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether, yieldRate=%d",
    //       i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal), vesingSchedule.yieldRate);
    //   }

    //   console.log("vestingTimeStart:\t%o", new Date(startTime * 1000));
    //   console.log("duration:\t\t%d", duration);
    //   console.log("durationUnit:\t\t%s", durationUnitName[durUnit]);
    //   console.log("rewardRate:\t\t%s Ether\n", ethers.formatUnits(BigInt(rewardRate), "ether"));

    //   lockedAmount = await vesting.getLockedAmount(otherAccount.address)
    //   console.log("lockedAmount:\t\t%d Ether", ethers.formatEther(lockedAmount));
    //   expect(lockedAmount).to.equal(amount);

    //   userTokenBalanceAfter = await token.balanceOf(otherAccount);
    //   console.log("userTokenBalance:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
    //   expect(userTokenBalanceAfter).to.equal(userTokenBalanceBefore - amount);

    //   contractTokenBalance = await token.balanceOf(vesting);
    //   console.log("contractTokenBalance:\t%d Ether\n", ethers.formatEther(contractTokenBalance));
    //   expect(contractTokenBalance).to.equal(amount + depositPermanentAmount);


    //   // Testing for 1st release
    //   timeTo1 = startTime + releaseDays3 * ONE_DAY_IN_SECS;
    //   await time.increaseTo(timeTo1);
    //   console.log("\n1st release time:\t%o", new Date((timeTo1) * 1000));

    //   elapsed = BigInt(timeTo1 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
    //   if (elapsed > duration) {
    //     elapsed = BigInt(duration);
    //   }
    //   console.log("elapsed:\t\t%d/%d", elapsed, duration);

    //   expectReleasableAmount = (BigInt(amount) * elapsed) / BigInt(duration);
    //   console.log("expectReleasableAmount:\t%d Ether", ethers.formatEther(expectReleasableAmount));
    //   expectReleasableReward = expectReleasableAmount * BigInt(rewardRate) / BigInt(ONE_ETHER);
    //   console.log("expectReleasableReward:\t%d Ether", ethers.formatEther(expectReleasableReward));

    //   [releasableAmount, releasableReward] = await vesting.getReleasableAmount(otherAccount.address)
    //   console.log("releasableAmount:\t%d Ether", ethers.formatEther(releasableAmount));
    //   console.log("releasableReward:\t%d Ether", ethers.formatEther(releasableReward));
    //   expect(BigInt(releasableAmount)).to.equal(expectReleasableAmount);
    //   expect(BigInt(releasableReward - expectReleasableReward)).to.lt(1e9);

    //   // Release for account
    //   await vesting.release(otherAccount)
    //   console.log("release for account:\t%s", otherAccount.address);

    //   contractTokenBalance = await token.balanceOf(vesting);
    //   console.log("contractTokenBalance:\t%d Ether", ethers.formatEther(contractTokenBalance));
    //   expectTokenBalance = amount + depositPermanentAmount - expectReleasableAmount - expectReleasableReward;
    //   console.log("expectContractTokenBalance:\t%d Ether", ethers.formatEther(expectTokenBalance));

    //   userTokenBalanceAfter = await token.balanceOf(otherAccount.address);
    //   console.log("userTokenBalance:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
    //   expectUserTokenBalance = userTokenBalanceBefore - amount + expectReleasableAmount + expectReleasableReward;
    //   console.log("expectUserTokenBalance:\t%d Ether", ethers.formatEther(expectUserTokenBalance))

    //   lockedAmount = await vesting.getLockedAmount(otherAccount.address)
    //   console.log("lockedAmount:\t\t%d Ether\n", ethers.formatEther(lockedAmount));
    //   expect(lockedAmount).to.equal(amount - expectReleasableAmount);

    //   for (let i = 0; i < vesingScheduleList.length; i++) {
    //     vesingSchedule = vesingScheduleList[i]
    //     console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether, yieldRate=%d, released=%d Ether, rewarded=%d Ether",
    //       i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal), vesingSchedule.yieldRate, ethers.formatEther(vesingSchedule.released), ethers.formatEther(vesingSchedule.rewarded));
    //   }
    // });

  });


});
