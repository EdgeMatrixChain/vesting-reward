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
  async function deployOneYearLockFixture() {

    const unlockTime = (await time.latest()) + ONE_DAY_IN_SECS * 300;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();


    const initSupply = hre.ethers.parseEther("1000000");
    const token = await hre.ethers.deployContract("TestToken", [initSupply]);

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


  describe("Release", function () {
    // describe("Validations", function () {
    //   it("Should revert with the right error if called too soon", async function () {
    //     const { lock } = await loadFixture(deployOneYearLockFixture);

    //     await expect(lock.withdraw()).to.be.revertedWith(
    //       "You can't withdraw yet"
    //     );
    //   });

    //   it("Should revert with the right error if called from another account", async function () {
    //     const { lock, unlockTime, otherAccount } = await loadFixture(
    //       deployOneYearLockFixture
    //     );

    //     // We can increase the time in Hardhat Network
    //     await time.increaseTo(unlockTime);

    //     // We use lock.connect() to send a transaction from another account
    //     await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
    //       "You aren't the owner"
    //     );
    //   });

    //   it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
    //     const { lock, unlockTime } = await loadFixture(
    //       deployOneYearLockFixture
    //     );

    //     // Transactions are sent using the first signer by default
    //     await time.increaseTo(unlockTime);

    //     await expect(lock.withdraw()).not.to.be.reverted;
    //   });
    // });

    describe("Events", function () {
      it("Should emit an event on release", async function () {
        const { token, vesting, owner, otherAccount, unlockTime, scheduleRewards } = await loadFixture(
          deployOneYearLockFixture
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

        // Testing for depoit
        // await token.approve(vesting, amount)
        // await vesting.createVestingSchedule(otherAccount.address, startTime, duration, durUnit, amount)

        userTokenBalanceBefore = await token.balanceOf(owner);
        await token.approve(vesting, amount)

        await expect(vesting.createVestingSchedule(owner.address, startTime, duration, durUnit, amount))
          .to.emit(vesting, "VestingScheduleCreated")
          .withArgs(owner.address,
            startTime,
            duration,
            durUnit,
            amount);

        rewardPerGwei = scheduleRewards[durationUnitName[durUnit]];
        console.log("vestingTimeStart:\t%o", new Date(startTime * 1000));
        console.log("duration:\t\t%d", duration);
        console.log("durationUnit:\t\t%s", durationUnitName[durUnit]);
        console.log("rewardPerGwei:\t\t%s Gwei\n", ethers.formatUnits(rewardPerGwei, "gwei"));


        vestingTokenBalance = await token.balanceOf(vesting);
        console.log("vestingTokenBalance:\t%d Ether\n", ethers.formatEther(vestingTokenBalance));
        expect(vestingTokenBalance).to.equal(amount);

        // Testing for 1st release
        timeTo1 = startTime + releaseDays1 * ONE_DAY_IN_SECS;
        await time.increaseTo(timeTo1);
        console.log("1st release time:\t%o", new Date((timeTo1) * 1000));

        elapsed = BigInt(timeTo1 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
        console.log("elapsed:\t\t%d/%d", elapsed, duration);

        expectReleasableAmount = (BigInt(amount) * elapsed) / BigInt(duration);
        console.log("expectReleasableAmount:\t%d Ether", ethers.formatEther(expectReleasableAmount));
        expectReleasableReward = expectReleasableAmount * BigInt(rewardPerGwei) / BigInt(ONE_GWEI);
        console.log("expectReleasableReward:\t%d Ether", ethers.formatEther(expectReleasableReward));

        [releasableAmount, releasableReward] = await vesting.getReleasableAmount(owner.address)
        console.log("releasableAmount:\t%d Ether", ethers.formatEther(releasableAmount));
        console.log("releasableReward:\t%d Ether", ethers.formatEther(releasableReward));
        expect(BigInt(releasableAmount)).to.equal(expectReleasableAmount);
        expect(BigInt(releasableReward)).to.equal(expectReleasableReward);

        await expect(vesting.release(owner))
          .to.emit(vesting, "TokensReleased")
          .withArgs(owner.address, expectReleasableAmount, expectReleasableReward);
      });
    });

    describe("CreateVestingSchedule and Release to owner", function () {
      it("Should release the funds to the owner", async function () {
        const { token, vesting, owner, otherAccount, unlockTime, scheduleRewards } = await loadFixture(
          deployOneYearLockFixture
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

        userTokenBalanceBefore = await token.balanceOf(owner);
        await token.approve(vesting, amount)
        // deposit by 2 times
        await vesting.createVestingSchedule(owner.address, startTime, duration, durUnit, amount / BigInt(2))
        await vesting.createVestingSchedule(owner.address, startTime, duration, durUnit, amount / BigInt(2))

        vesingScheduleList = await vesting.getVestingSchedule(owner.address);
        expect(2, vesingScheduleList.length)

        for (let i = 0; i < vesingScheduleList.length; i++) {
          vesingSchedule = vesingScheduleList[i]
          console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether, rewardPerGwei=%d\n",
            i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal), vesingSchedule.rewardPerGwei);
        }

        rewardPerGwei = scheduleRewards[durationUnitName[durUnit]];
        console.log("vestingTimeStart:\t%o", new Date(startTime * 1000));
        console.log("duration:\t\t%d", duration);
        console.log("durationUnit:\t\t%s", durationUnitName[durUnit]);
        console.log("rewardPerGwei:\t\t%s Gwei\n", ethers.formatUnits(rewardPerGwei, "gwei"));

        lockedAmount = await vesting.getLockedAmount(owner.address)
        console.log("lockedAmount:\t\t%d Ether", ethers.formatEther(lockedAmount));
        expect(lockedAmount).to.equal(amount);

        userTokenBalanceAfter = await token.balanceOf(owner);
        console.log("userTokenBalance:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
        expect(userTokenBalanceAfter).to.equal(userTokenBalanceBefore - amount);

        vestingTokenBalance = await token.balanceOf(vesting);
        console.log("vestingTokenBalance:\t%d Ether\n", ethers.formatEther(vestingTokenBalance));
        expect(vestingTokenBalance).to.equal(amount);

        // Testing for 1st release
        timeTo1 = startTime + releaseDays1 * ONE_DAY_IN_SECS;
        await time.increaseTo(timeTo1);
        console.log("1st release time:\t%o", new Date((timeTo1) * 1000));

        elapsed = BigInt(timeTo1 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
        console.log("elapsed:\t\t%d/%d", elapsed, duration);

        expectReleasableAmount = (BigInt(amount) * elapsed) / BigInt(duration);
        console.log("expectReleasableAmount:\t%d Ether", ethers.formatEther(expectReleasableAmount));
        expectReleasableReward = expectReleasableAmount * BigInt(rewardPerGwei) / BigInt(ONE_GWEI);
        console.log("expectReleasableReward:\t%d Ether", ethers.formatEther(expectReleasableReward));

        [releasableAmount, releasableReward] = await vesting.getReleasableAmount(owner.address)
        console.log("releasableAmount:\t%d Ether", ethers.formatEther(releasableAmount));
        console.log("releasableReward:\t%d Ether", ethers.formatEther(releasableReward));
        expect(BigInt(releasableAmount)).to.equal(expectReleasableAmount);
        expect(BigInt(releasableReward)).to.equal(expectReleasableReward);

        await vesting.release(owner)
        console.log("release for account:\t%s", owner.address);

        vestingTokenBalance = await token.balanceOf(vesting);
        console.log("vestingTokenBalance:\t%d Ether", ethers.formatEther(vestingTokenBalance));
        expect(vestingTokenBalance).to.equal(amount - expectReleasableAmount - expectReleasableReward);

        userTokenBalanceAfter = await token.balanceOf(owner.address);
        console.log("userTokenBalance:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
        expect(userTokenBalanceAfter).to.equal(userTokenBalanceBefore - amount + expectReleasableAmount + expectReleasableReward);

        lockedAmount = await vesting.getLockedAmount(owner.address)
        console.log("lockedAmount:\t\t%d Ether\n", ethers.formatEther(lockedAmount));
        expect(lockedAmount).to.equal(amount - expectReleasableAmount);

        // Testing for 2nd release
        timeTo2 = startTime + releaseDays2 * ONE_DAY_IN_SECS;
        await time.increaseTo(timeTo2);
        console.log("2nd release time:\t%o", new Date((timeTo2) * 1000));

        elapsed = BigInt(timeTo2 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
        console.log("elapsed:\t\t%d/%d", elapsed, duration);

        latestReleasableAmount = expectReleasableAmount;
        latestReleasableReward = expectReleasableReward;

        expectReleasableAmount = (BigInt(amount) * elapsed) / BigInt(duration) - latestReleasableAmount;
        console.log("expectReleasableAmount:\t%d Ether", ethers.formatEther(expectReleasableAmount));
        expectReleasableReward = expectReleasableAmount * BigInt(rewardPerGwei) / BigInt(ONE_GWEI);
        console.log("expectReleasableReward:\t%d Ether", ethers.formatEther(expectReleasableReward));

        [releasableAmount, releasableReward] = await vesting.getReleasableAmount(owner.address)
        console.log("releasableAmount:\t%d Ether", ethers.formatEther(releasableAmount));
        console.log("releasableReward:\t%d Ether", ethers.formatEther(releasableReward));
        expect(BigInt(releasableAmount)).to.equal(expectReleasableAmount);
        expect(BigInt(releasableReward)).to.equal(expectReleasableReward);

        await vesting.release(owner)
        console.log("release for account:\t%s", owner.address);

        vestingTokenBalance = await token.balanceOf(vesting);
        console.log("vestingTokenBalance:\t%d Ether", ethers.formatEther(vestingTokenBalance));
        expect(vestingTokenBalance).to.equal(amount - expectReleasableAmount - latestReleasableAmount - releasableReward - latestReleasableReward);

        userTokenBalanceAfter = await token.balanceOf(owner.address);
        console.log("userTokenBalance:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
        expect(userTokenBalanceAfter).to.equal(userTokenBalanceBefore - amount + expectReleasableAmount + latestReleasableAmount + releasableReward + latestReleasableReward);

        lockedAmount = await vesting.getLockedAmount(owner.address)
        console.log("lockedAmount:\t\t%d Ether\n", ethers.formatEther(lockedAmount));
        expect(lockedAmount).to.equal(amount - expectReleasableAmount - latestReleasableAmount);

        vesingScheduleList = await vesting.getVestingSchedule(owner.address);
        expect(2, vesingScheduleList.length)

        for (let i = 0; i < vesingScheduleList.length; i++) {
          vesingSchedule = vesingScheduleList[i]
          console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether, rewardPerGwei=%d, released=%d Ether, rewarded=%d Ether\n",
            i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal), vesingSchedule.rewardPerGwei, ethers.formatEther(vesingSchedule.released), ethers.formatEther(vesingSchedule.rewarded));
        }

      });
    });
  });
});
