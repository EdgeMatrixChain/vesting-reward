const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

function Enum(...options) {
  return Object.fromEntries(options.map((key, i) => [key, i]));
}
const durationUnit = Enum('Days30', 'Days90', 'Days180', 'Days360');
const durationUnitName = ['Days30', 'Days90', 'Days180', 'Days360'];
const ONE_DAY_IN_SECS = 24 * 60 * 60;
const ONE_ETHER = BigInt(1e18);


describe("ReleaseVestingContract", function () {
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

    const vesting = await hre.ethers.deployContract("ReleaseVestingV1", [token, 360]);
    await vesting.waitForDeployment();

    return { token, vesting, owner, otherAccount, unlockTime };
  }

  describe("ReleaseVestingContract Events", function () {
    it("Should emit an event on release", async function () {
      const { token, vesting, owner, otherAccount } = await loadFixture(
        deployContractFixture
      );

      const startTime = await time.latest() + 360 * ONE_DAY_IN_SECS + 60; // startime: now + 360 days + 60s

      // duration for deposit 

      const duration = 4;
      // durationUnit for deposit 
      const durUnit = durationUnit.Days30;
      // deposit amount
      const amount = ethers.parseEther("100");
      // set unlocktime (days)
      const releaseDays1 = 1 * 30;
      const releaseDays2 = 4 * 30;

      DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 1;
      if (durUnit == durationUnit.Days30) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 30;
      } else if (durUnit == durationUnit.Days90) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 90;
      } else if (durUnit == durationUnit.Days180) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 180;
      } else if (durUnit == durationUnit.Days360) {
        DURATION_UNIT_IN_SECS = ONE_DAY_IN_SECS * 360;
      }

      // create vesing schedule
      userTokenBalanceBefore = await token.balanceOf(otherAccount);
      await token.connect(otherAccount).approve(vesting, amount)
      await expect(vesting.connect(otherAccount).createVestingSchedule(otherAccount.address, startTime, duration, durUnit, amount))
        .to.emit(vesting, "VestingScheduleCreated")
        .withArgs(otherAccount.address,
          startTime,
          duration,
          durUnit,
          amount);


      // Testing for 1st release
      timeTo1 = startTime + releaseDays1 * ONE_DAY_IN_SECS;
      await time.increaseTo(timeTo1);

      expectReleasableAmount = ethers.parseEther("25");
      console.log("expectReleasableAmount:\t\t%d", hre.ethers.formatUnits(expectReleasableAmount, 18), expectReleasableAmount);

      releasableAmount = await vesting.getReleasableAmount(otherAccount.address)
      expect(BigInt(releasableAmount)).to.equal(expectReleasableAmount);

      await expect(vesting.release(otherAccount))
        .to.emit(vesting, "TokensReleased")
        .withArgs(otherAccount.address, expectReleasableAmount);

      // Testing for 2nd release
      timeTo2 = startTime + releaseDays2 * ONE_DAY_IN_SECS;
      await time.increaseTo(timeTo2);

      expectReleasableAmount = ethers.parseEther("75");
      console.log("expectReleasableAmount:\t\t%d", hre.ethers.formatUnits(expectReleasableAmount, 18), expectReleasableAmount);

      releasableAmount = await vesting.getReleasableAmount(otherAccount.address)
      expect(BigInt(releasableAmount)).to.equal(expectReleasableAmount);

      await expect(vesting.release(otherAccount))
        .to.emit(vesting, "TokensReleased")
        .withArgs(otherAccount.address, expectReleasableAmount);

    });


  });



  describe("ReleaseVestingContract CreateVestingSchedule and Release to staker", function () {
    it("Should release the funds to the staker", async function () {
      const { token, vesting, owner, otherAccount, unlockTime, scheduleRewards } = await loadFixture(
        deployContractFixture
      );

      const startTime = await time.latest() + 360 * ONE_DAY_IN_SECS + 60; // startime: now + 360 days + 60s

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

      tokenAddress = await vesting.token()
      console.log("tokenAddress:\t%s", tokenAddress);

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
        console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether",
          i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal));
      }

      console.log("vestingTimeStart:\t%o", new Date(startTime * 1000));
      console.log("duration:\t\t%d", duration);
      console.log("durationUnit:\t\t%s", durationUnitName[durUnit]);

      lockedAmount = await vesting.getLockedAmount(otherAccount.address)
      console.log("lockedAmount:\t\t%d Ether", ethers.formatEther(lockedAmount));
      expect(lockedAmount).to.equal(amount);

      userTokenBalanceAfter = await token.balanceOf(otherAccount);
      console.log("userTokenBalance:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
      expect(userTokenBalanceAfter).to.equal(userTokenBalanceBefore - amount);


      // Testing for 1st release
      timeTo1 = startTime + releaseDays1 * ONE_DAY_IN_SECS;
      await time.increaseTo(timeTo1);
      console.log("\n1st release time:\t%o", new Date((timeTo1) * 1000));

      elapsed = BigInt(timeTo1 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
      console.log("elapsed:\t\t%d/%d", elapsed, duration);

      expectReleasableAmount = ethers.parseEther("25")
      console.log("expectReleasableAmount:\t%d Ether", ethers.formatEther(expectReleasableAmount));

      releasableAmount = await vesting.getReleasableAmount(otherAccount.address)
      console.log("releasableAmount:\t%d Ether", ethers.formatEther(releasableAmount));
      expect(BigInt(releasableAmount)).to.equal(expectReleasableAmount);

      await vesting.release(otherAccount)
      console.log("release for account:\t%s", otherAccount.address);

      contractTokenBalance = await token.balanceOf(vesting);
      console.log("contractTokenBalance:\t%d Ether", ethers.formatEther(contractTokenBalance));
      expect(contractTokenBalance).to.equal(ethers.parseEther("75"));

      userTokenBalanceAfter = await token.balanceOf(otherAccount.address);
      console.log("userTokenBalance:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
      expect(userTokenBalanceAfter).to.equal(userTokenBalanceBefore - amount + ethers.parseEther("25"));

      lockedAmount = await vesting.getLockedAmount(otherAccount.address)
      console.log("lockedAmount:\t\t%d Ether\n", ethers.formatEther(lockedAmount));
      expect(lockedAmount).to.equal(ethers.parseEther("75"));

      // Testing for 2nd release
      timeTo2 = startTime + releaseDays2 * ONE_DAY_IN_SECS;
      await time.increaseTo(timeTo2);
      console.log("\n2nd release time:\t%o", new Date((timeTo2) * 1000));

      elapsed = BigInt(timeTo2 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
      console.log("elapsed:\t\t%d/%d", elapsed, duration);

      latestReleasableAmount = expectReleasableAmount;

      expectReleasableAmount = ethers.parseEther("50")
      console.log("expectReleasableAmount:\t%d Ether", ethers.formatEther(expectReleasableAmount));

      releasableAmount = await vesting.getReleasableAmount(otherAccount.address)
      console.log("releasableAmount:\t%d Ether", ethers.formatEther(releasableAmount));
      expect(BigInt(releasableAmount)).to.equal(BigInt(expectReleasableAmount));

      await vesting.release(otherAccount)
      console.log("release for account:\t%s", otherAccount.address);

      contractTokenBalance = await token.balanceOf(vesting);
      console.log("contractTokenBalance:\t%d Ether", ethers.formatEther(contractTokenBalance));
      expect(contractTokenBalance).to.equal(BigInt(ethers.parseEther("25")));

      userTokenBalanceAfter = await token.balanceOf(otherAccount.address);
      console.log("userTokenBalance:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
      expect(userTokenBalanceAfter).to.equal(userTokenBalanceBefore - amount + BigInt(ethers.parseEther("75")));

      lockedAmount = await vesting.balanceOf(otherAccount.address)
      console.log("lockedAmount:\t\t%d Ether\n", ethers.formatEther(lockedAmount));
      expect(lockedAmount).to.equal(BigInt(ethers.parseEther("25")));

      // Testing for 3rd release
      timeTo3 = startTime + releaseDays3 * ONE_DAY_IN_SECS;
      await time.increaseTo(timeTo3);
      console.log("\n3rd release time:\t%o", new Date((timeTo3) * 1000));

      elapsed = BigInt(timeTo3 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
      console.log("elapsed:\t\t%d/%d", elapsed, duration);

      [amountTotal, releasedTotal] = await vesting.getAmount(otherAccount.address)
      expectReleasableAmount = (BigInt(amount) * elapsed) / BigInt(duration) - releasedTotal;
      console.log("expectReleasableAmount:\t%d Ether", ethers.formatEther(expectReleasableAmount));

      releasableAmount = await vesting.getReleasableAmount(otherAccount.address)
      console.log("releasableAmount:\t%d Ether", ethers.formatEther(releasableAmount));
      expect(BigInt(releasableAmount)).to.equal(BigInt(ethers.parseEther("25")));

      await vesting.release(otherAccount)
      console.log("release for account:\t%s", otherAccount.address);

      [amountTotal, releasedTotal] = await vesting.getAmount(otherAccount.address)
      console.log("amountTotal:\t%d Ether", ethers.formatEther(amountTotal));
      console.log("releasedTotal:\t%d Ether", ethers.formatEther(releasedTotal));

      expect(BigInt(amountTotal)).to.equal(BigInt(ethers.parseEther("100")));
      expect(BigInt(releasedTotal)).to.equal(BigInt(ethers.parseEther("100")));

      contractTokenBalance = await token.balanceOf(vesting);
      console.log("contractTokenBalance:\t%d Ether", ethers.formatEther(contractTokenBalance));

      userTokenBalanceAfter = await token.balanceOf(otherAccount.address);
      console.log("userTokenBalanceAfter:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
      userTokenBalanceExpect = userTokenBalanceBefore;
      console.log("userTokenBalanceExpect:\t%d Ether", ethers.formatEther(userTokenBalanceExpect))
      expect(userTokenBalanceAfter).to.equal(BigInt(userTokenBalanceExpect));

      lockedAmount = await vesting.balanceOf(otherAccount.address)
      console.log("lockedAmount:\t\t%d Ether\n", ethers.formatEther(lockedAmount));
      expect(lockedAmount).to.equal(BigInt(0));

      vesingScheduleList = await vesting.getVestingSchedule(otherAccount.address);
      expect(2, vesingScheduleList.length)

      for (let i = 0; i < vesingScheduleList.length; i++) {
        vesingSchedule = vesingScheduleList[i]
        console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether, released=%d Ether",
          i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal), ethers.formatEther(vesingSchedule.released));
      }
    });
    it("Should release the funds to the staker after 360 days", async function () {
      const { token, vesting, owner, otherAccount, unlockTime, scheduleRewards } = await loadFixture(
        deployContractFixture
      );

      const now = await time.latest();
      const startTime = await time.latest() + 360 * ONE_DAY_IN_SECS + 60; // startime: now + 360 days + 60s

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

      tokenAddress = await vesting.token()
      console.log("tokenAddress:\t%s", tokenAddress);

      userTokenBalanceBefore = await token.balanceOf(otherAccount);
      console.log("userTokenBalanceBefore:\t%d Ether", ethers.formatEther(userTokenBalanceBefore))
      await token.connect(otherAccount).approve(vesting, amount)

      // attempt to createVestingSchedule
      await expect(vesting.connect(otherAccount).createVestingSchedule(otherAccount.address, now, duration, durUnit, amount / BigInt(2)))
        .to.be.revertedWith("VestingContract: invalid start time");
      await expect(vesting.connect(otherAccount).createVestingSchedule(otherAccount.address, startTime - 120, duration, durUnit, amount / BigInt(2)))
        .to.be.revertedWith("VestingContract: invalid start time");

      // createVestingSchedule 2 times
      await vesting.connect(otherAccount).createVestingSchedule(otherAccount.address, startTime, duration, durUnit, amount / BigInt(2))
      await vesting.connect(otherAccount).createVestingSchedule(otherAccount.address, startTime, duration, durUnit, amount / BigInt(2))

      vesingScheduleList = await vesting.getVestingSchedule(otherAccount.address);
      expect(2, vesingScheduleList.length)

      for (let i = 0; i < vesingScheduleList.length; i++) {
        vesingSchedule = vesingScheduleList[i]
        console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether",
          i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal));
      }

      console.log("vestingTimeStart:\t%o", new Date(startTime * 1000));
      console.log("duration:\t\t%d", duration);
      console.log("durationUnit:\t\t%s", durationUnitName[durUnit]);

      lockedAmount = await vesting.getLockedAmount(otherAccount.address)
      console.log("lockedAmount:\t\t%d Ether", ethers.formatEther(lockedAmount));
      expect(lockedAmount).to.equal(amount);

      userTokenBalanceAfter = await token.balanceOf(otherAccount);
      console.log("userTokenBalance:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
      expect(userTokenBalanceAfter).to.equal(userTokenBalanceBefore - amount);


      // Testing for release before startTime
      timeTo1 = now + 30 * ONE_DAY_IN_SECS; // after 30 days
      await time.increaseTo(timeTo1);
      console.log("\nattempt time1:\t%o", new Date((timeTo1) * 1000));
      expectReleasableAmount = ethers.parseEther("0")
      console.log("expectReleasableAmount:\t%d Ether", ethers.formatEther(expectReleasableAmount));
      releasableAmount = await vesting.getReleasableAmount(otherAccount.address)
      console.log("releasableAmount:\t%d Ether", ethers.formatEther(releasableAmount));
      expect(BigInt(releasableAmount)).to.equal(expectReleasableAmount);

      timeTo2 = now + 361 * ONE_DAY_IN_SECS; // after 361 days
      await time.increaseTo(timeTo2);
      console.log("\nattempt time2:\t%o", new Date((timeTo2) * 1000));
      expectReleasableAmount = ethers.parseEther("0")
      console.log("expectReleasableAmount:\t%d Ether", ethers.formatEther(expectReleasableAmount));
      releasableAmount = await vesting.getReleasableAmount(otherAccount.address)
      console.log("releasableAmount:\t%d Ether", ethers.formatEther(releasableAmount));
      expect(BigInt(releasableAmount)).to.equal(expectReleasableAmount);


      // Testing for 1st release
      timeTo1 = startTime + releaseDays1 * ONE_DAY_IN_SECS; // after 361 days + 30 days
      await time.increaseTo(timeTo1);
      console.log("\n1st release time:\t%o", new Date((timeTo1) * 1000));

      elapsed = BigInt(timeTo1 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
      console.log("elapsed:\t\t%d/%d", elapsed, duration);

      expectReleasableAmount = ethers.parseEther("25")
      console.log("expectReleasableAmount:\t%d Ether", ethers.formatEther(expectReleasableAmount));

      releasableAmount = await vesting.getReleasableAmount(otherAccount.address)
      console.log("releasableAmount:\t%d Ether", ethers.formatEther(releasableAmount));
      expect(BigInt(releasableAmount)).to.equal(expectReleasableAmount);

      await vesting.release(otherAccount)
      console.log("release for account:\t%s", otherAccount.address);

      contractTokenBalance = await token.balanceOf(vesting);
      console.log("contractTokenBalance:\t%d Ether", ethers.formatEther(contractTokenBalance));
      expect(contractTokenBalance).to.equal(ethers.parseEther("75"));

      userTokenBalanceAfter = await token.balanceOf(otherAccount.address);
      console.log("userTokenBalance:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
      expect(userTokenBalanceAfter).to.equal(userTokenBalanceBefore - amount + ethers.parseEther("25"));

      lockedAmount = await vesting.getLockedAmount(otherAccount.address)
      console.log("lockedAmount:\t\t%d Ether\n", ethers.formatEther(lockedAmount));
      expect(lockedAmount).to.equal(ethers.parseEther("75"));

      // Testing for 2nd release
      timeTo2 = startTime + releaseDays2 * ONE_DAY_IN_SECS;
      await time.increaseTo(timeTo2);
      console.log("\n2nd release time:\t%o", new Date((timeTo2) * 1000));

      elapsed = BigInt(timeTo2 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
      console.log("elapsed:\t\t%d/%d", elapsed, duration);

      latestReleasableAmount = expectReleasableAmount;

      expectReleasableAmount = ethers.parseEther("50")
      console.log("expectReleasableAmount:\t%d Ether", ethers.formatEther(expectReleasableAmount));

      releasableAmount = await vesting.getReleasableAmount(otherAccount.address)
      console.log("releasableAmount:\t%d Ether", ethers.formatEther(releasableAmount));
      expect(BigInt(releasableAmount)).to.equal(BigInt(expectReleasableAmount));

      await vesting.release(otherAccount)
      console.log("release for account:\t%s", otherAccount.address);

      contractTokenBalance = await token.balanceOf(vesting);
      console.log("contractTokenBalance:\t%d Ether", ethers.formatEther(contractTokenBalance));
      expect(contractTokenBalance).to.equal(BigInt(ethers.parseEther("25")));

      userTokenBalanceAfter = await token.balanceOf(otherAccount.address);
      console.log("userTokenBalance:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
      expect(userTokenBalanceAfter).to.equal(userTokenBalanceBefore - amount + BigInt(ethers.parseEther("75")));

      lockedAmount = await vesting.balanceOf(otherAccount.address)
      console.log("lockedAmount:\t\t%d Ether\n", ethers.formatEther(lockedAmount));
      expect(lockedAmount).to.equal(BigInt(ethers.parseEther("25")));

      // Testing for 3rd release
      timeTo3 = startTime + releaseDays3 * ONE_DAY_IN_SECS;
      await time.increaseTo(timeTo3);
      console.log("\n3rd release time:\t%o", new Date((timeTo3) * 1000));

      elapsed = BigInt(timeTo3 - startTime) / BigInt(DURATION_UNIT_IN_SECS);
      console.log("elapsed:\t\t%d/%d", elapsed, duration);

      [amountTotal, releasedTotal] = await vesting.getAmount(otherAccount.address)
      expectReleasableAmount = (BigInt(amount) * elapsed) / BigInt(duration) - releasedTotal;
      console.log("expectReleasableAmount:\t%d Ether", ethers.formatEther(expectReleasableAmount));

      releasableAmount = await vesting.getReleasableAmount(otherAccount.address)
      console.log("releasableAmount:\t%d Ether", ethers.formatEther(releasableAmount));
      expect(BigInt(releasableAmount)).to.equal(BigInt(ethers.parseEther("25")));

      await vesting.release(otherAccount)
      console.log("release for account:\t%s", otherAccount.address);

      [amountTotal, releasedTotal] = await vesting.getAmount(otherAccount.address)
      console.log("amountTotal:\t%d Ether", ethers.formatEther(amountTotal));
      console.log("releasedTotal:\t%d Ether", ethers.formatEther(releasedTotal));

      expect(BigInt(amountTotal)).to.equal(BigInt(ethers.parseEther("100")));
      expect(BigInt(releasedTotal)).to.equal(BigInt(ethers.parseEther("100")));

      contractTokenBalance = await token.balanceOf(vesting);
      console.log("contractTokenBalance:\t%d Ether", ethers.formatEther(contractTokenBalance));

      userTokenBalanceAfter = await token.balanceOf(otherAccount.address);
      console.log("userTokenBalanceAfter:\t%d Ether", ethers.formatEther(userTokenBalanceAfter))
      userTokenBalanceExpect = userTokenBalanceBefore;
      console.log("userTokenBalanceExpect:\t%d Ether", ethers.formatEther(userTokenBalanceExpect))
      expect(userTokenBalanceAfter).to.equal(BigInt(userTokenBalanceExpect));

      lockedAmount = await vesting.balanceOf(otherAccount.address)
      console.log("lockedAmount:\t\t%d Ether\n", ethers.formatEther(lockedAmount));
      expect(lockedAmount).to.equal(BigInt(0));

      vesingScheduleList = await vesting.getVestingSchedule(otherAccount.address);
      expect(2, vesingScheduleList.length)

      for (let i = 0; i < vesingScheduleList.length; i++) {
        vesingSchedule = vesingScheduleList[i]
        console.log("vesingSchedule[%d]: beneficiary=%s, start=%d, duration=%d, durationUnits=%d, amountTotal=%d Ether, released=%d Ether",
          i, vesingSchedule.beneficiary, vesingSchedule.start, vesingSchedule.duration, vesingSchedule.durationUnits, ethers.formatEther(vesingSchedule.amountTotal), ethers.formatEther(vesingSchedule.released));
      }
    });

  });


});
