// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// import "hardhat/console.sol";

/// @title RewardVestingContract
/// @notice  The contract that allows to create vesting schedules for a beneficiary with daily/weekly/monthly/quarterly cliff unlocking.
//  Staker can receive corresponding rewards based on the duration and cliff period(daily/weekly/monthly/quarterly).
/// This is a rewriting of [VestingContract.sol](https://github.com/andreitoma8/vesting-contract/blob/master/contracts/VestingContract.sol), modified for adding reward functions.
contract RewardVestingContract {
    using SafeERC20 for IERC20;

    /**
     * @notice The token to be vested
     */
    IERC20 public immutable token;

    address public operator;

    enum DurationUnits {
        Days,
        Weeks,
        Months,
        Quarters
    }

    struct VestingSchedule {
        // beneficiary of tokens after they are released
        address beneficiary;
        // start time of the vesting period
        uint256 start;
        // duration of the vesting period in DurationUnits
        uint256 duration;
        // units of the duration
        DurationUnits durationUnits;
        // total amount of tokens to be released at the end of the vesting;
        uint256 amountTotal;
        // amount of tokens released
        uint256 released;
        // reward per Gwei token
        uint256 rewardPerGwei;
        // amount of tokens rewarded
        uint256 rewarded;
    }

    /**
     * @notice List of vesting schedules for each beneficiary
     */
    mapping(address => VestingSchedule[]) public vestingSchedules;

    /**
     * @notice Reward of schedule durationUnits
     */
    mapping(DurationUnits => uint256) public durationUnitRewards;

    /**
     * @notice Emitted when a vesting schedule is created
     * @param beneficiary The address of the beneficiary
     * @param start The start UNIX timestamp of the vesting period
     * @param duration The duration of the vesting period in DurationUnits
     * @param durationUnits The units of the duration(0 = days, 1 = weeks, 2 = months)
     */
    event VestingScheduleCreated(
        address indexed beneficiary,
        uint256 start,
        uint256 duration,
        DurationUnits durationUnits,
        uint256 amountTotal
    );

    /**
     * @notice Emitted when tokens are released
     * @param beneficiary The address of the beneficiary
     * @param amount The amount of tokens released
     * @param reward The amount of tokens rewarded
     */
    event TokensReleased(
        address indexed beneficiary,
        uint256 amount,
        uint256 reward
    );

    /**
     * @param _token The token to be vested
     * @param dayRewardPerGwei The rward to be vested by DurationUnits.Days
     * @param weekRewardPerGwei The token to be vested by DurationUnits.Weeks
     * @param monthRewardPerGwei The token to be vested by DurationUnits.Months
     * @param quarterRewardPerGwei The token to be vested by DurationUnits.Quarters
     */
    constructor(
        IERC20 _token,
        uint256 dayRewardPerGwei,
        uint256 weekRewardPerGwei,
        uint256 monthRewardPerGwei,
        uint256 quarterRewardPerGwei
    ) {
        token = _token;
        operator = msg.sender;
        durationUnitRewards[DurationUnits.Days] = dayRewardPerGwei;
        durationUnitRewards[DurationUnits.Weeks] = weekRewardPerGwei;
        durationUnitRewards[DurationUnits.Months] = monthRewardPerGwei;
        durationUnitRewards[DurationUnits.Quarters] = quarterRewardPerGwei;
    }

    function setOperator(address _op) external {
        require(msg.sender == operator, "!auth");
        operator = _op;
    }
        
    /**
     * @notice Set reward of schedule durationUnits
     * @param dayRewardPerGwei The rward to be vested by DurationUnits.Days
     * @param weekRewardPerGwei The token to be vested by DurationUnits.Weeks
     * @param monthRewardPerGwei The token to be vested by DurationUnits.Months
     * @param quarterRewardPerGwei The token to be vested by DurationUnits.Quarters
     */
    function setDelegate(uint256 dayRewardPerGwei,
        uint256 weekRewardPerGwei,
        uint256 monthRewardPerGwei,
        uint256 quarterRewardPerGwei) external{
        require(msg.sender == operator, "!auth");

        durationUnitRewards[DurationUnits.Days] = dayRewardPerGwei;
        durationUnitRewards[DurationUnits.Weeks] = weekRewardPerGwei;
        durationUnitRewards[DurationUnits.Months] = monthRewardPerGwei;
        durationUnitRewards[DurationUnits.Quarters] = quarterRewardPerGwei;
    }

    /**
     * @notice Creates a vesting schedule
     * @param _beneficiary The address of the beneficiary
     * @param _start The start UNIX timestamp of the vesting period
     * @param _duration The duration of the vesting period in DurationUnits
     * @param _durationUnits The units of the duration(0 = days, 1 = weeks, 2 = months, 3 = quarters)
     * @param _amountTotal The total amount of tokens to be vested
     * @dev Approve the contract to transfer the tokens before calling this function
     */
    function createVestingSchedule(
        address _beneficiary,
        uint256 _start,
        uint256 _duration,
        DurationUnits _durationUnits,
        uint256 _amountTotal
    ) external {
        // perform input checks
        require(
            _beneficiary != address(0),
            "VestingContract: beneficiary is the zero address"
        );
        require(_amountTotal > 0, "VestingContract: amount is 0");
        require(
            _start >= block.timestamp,
            "VestingContract: start is before current time"
        );

        // transfer the tokens to be locked to the contract
        token.safeTransferFrom(msg.sender, address(this), _amountTotal);

        // create the vesting schedule and add it to the list of schedules for the beneficiary
        vestingSchedules[_beneficiary].push(
            VestingSchedule({
                beneficiary: _beneficiary,
                start: _start,
                duration: _duration,
                durationUnits: _durationUnits,
                amountTotal: _amountTotal,
                released: 0,
                rewardPerGwei: _reward(_durationUnits),
                rewarded: 0
            })
        );

        emit VestingScheduleCreated(
            _beneficiary,
            _start,
            _duration,
            _durationUnits,
            _amountTotal
        );
    }

    /**
     * @notice Releases the vested tokens for a beneficiary
     * @param _beneficiary The address of the beneficiary
     */
    function release(address _beneficiary) external {
        VestingSchedule[] storage schedules = vestingSchedules[_beneficiary];
        uint256 schedulesLength = schedules.length;
        require(
            schedulesLength > 0,
            "VestingContract: no vesting schedules for beneficiary"
        );

        uint256 totalRelease;
        uint256 totalReward;

        for (uint256 i = 0; i < schedulesLength; i++) {
            VestingSchedule storage schedule = schedules[i];

            // calculate the releasable amount
            (uint256 amountToSend, uint256 rewardToSend) = releasableAmount(
                schedule
            );
            if (amountToSend > 0) {
                // update the released amount
                schedule.released += amountToSend;
                if (rewardToSend > 0) {
                    schedule.rewarded += rewardToSend;
                    // update the total rewarded amount
                    totalReward += rewardToSend;
                }
                // update the total released amount
                totalRelease += amountToSend;
                // transfer the tokens to the beneficiary
                token.safeTransfer(
                    schedule.beneficiary,
                    amountToSend + rewardToSend
                );
            }
        }

        emit TokensReleased(_beneficiary, totalRelease, totalReward);
    }

    /**
     * @notice Returns vesting schedules of a beneficiary
     * @param _beneficiary The address of the beneficiary
     */
    function getVestingSchedule(
        address _beneficiary
    ) public view returns (VestingSchedule[] memory) {
        VestingSchedule[] memory schedules = vestingSchedules[_beneficiary];
        uint256 schedulesLength = schedules.length;
        require(
            schedulesLength > 0,
            "VestingContract: no vesting schedules for beneficiary"
        );

        return schedules;
    }

    /**
     * @notice Returns the releasable amount of tokens for a beneficiary
     * @param _beneficiary The address of the beneficiary
     */
    function getReleasableAmount(
        address _beneficiary
    ) external view returns (uint256, uint256) {
        VestingSchedule[] memory schedules = vestingSchedules[_beneficiary];
        if (schedules.length == 0) return (0, 0);

        uint256 amountToSend = 0;
        uint256 rewardToSend = 0;
        for (uint256 i = 0; i < schedules.length; i++) {
            VestingSchedule memory schedule = vestingSchedules[_beneficiary][i];
            (uint256 amount, uint256 reward) = releasableAmount(schedule);
            amountToSend += amount;
            rewardToSend += reward;
        }
        return (amountToSend, rewardToSend);
    }

    /**
     * @notice Returns the releasable amount of tokens for a vesting schedule
     * @param _schedule The vesting schedule
     */
    function releasableAmount(
        VestingSchedule memory _schedule
    ) public view returns (uint256, uint256) {
        // console.log(
        //     "vestedAmount----> beneficiary=%s, start=%d, duration=%d",
        //     _schedule.beneficiary,
        //     _schedule.start,
        //     _schedule.duration
        // );
        // console.log(
        //     "vestedAmount----> released=%d,amountTotal=%d",
        //     _schedule.released,
        //     _schedule.amountTotal
        // );
        (uint256 amount, uint256 reward) = vestedAmount(_schedule);
        return (amount - _schedule.released, reward - _schedule.rewarded);
    }

    /**
     * @notice Returns the vested amount of tokens for a vesting schedule
     * @param _schedule The vesting schedule
     */
    function vestedAmount(
        VestingSchedule memory _schedule
    ) public view returns (uint256, uint256) {
        if (_schedule.duration == 0) {
            if (block.timestamp >= _schedule.start) {
                return (_schedule.amountTotal, 0);
            } else {
                return (0, 0);
            }
        }
        uint256 sliceInSeconds;
        if (_schedule.durationUnits == DurationUnits.Days) {
            sliceInSeconds = 1 days;
        } else if (_schedule.durationUnits == DurationUnits.Weeks) {
            sliceInSeconds = 7 days;
        } else if (_schedule.durationUnits == DurationUnits.Months) {
            sliceInSeconds = 30 days;
        } else if (_schedule.durationUnits == DurationUnits.Quarters) {
            sliceInSeconds = 90 days;
        }
        if (block.timestamp < _schedule.start) {
            return (0, 0);
        } else if (
            block.timestamp >=
            _schedule.start + _schedule.duration * sliceInSeconds
        ) {
            return (
                _schedule.amountTotal,
                (_schedule.amountTotal * _schedule.rewardPerGwei) / 1 gwei
            );
        } else {
            uint256 passed = (block.timestamp - _schedule.start) /
                sliceInSeconds;
            uint256 reward = (_schedule.amountTotal * passed) /
                _schedule.duration;
            return (reward, (reward * _schedule.rewardPerGwei) / 1 gwei);
        }
    }

    /**
     * @notice Returns the reward amount per gwei tokens
     * @param _durationUnit The units of the duration(0 = days, 1 = weeks, 2 = months, 3 = quarters)
     */
    function _reward(
        DurationUnits _durationUnit
    ) private view returns (uint256) {
        uint256 reward = 0;
        if (_durationUnit == DurationUnits.Days) {
            reward = durationUnitRewards[DurationUnits.Days];
        } else if (_durationUnit == DurationUnits.Weeks) {
            reward = durationUnitRewards[DurationUnits.Weeks];
        } else if (_durationUnit == DurationUnits.Months) {
            reward = durationUnitRewards[DurationUnits.Months];
        } else if (_durationUnit == DurationUnits.Quarters) {
            reward = durationUnitRewards[DurationUnits.Quarters];
        }
        return reward;
    }

    /**
     *
     */
    function getLockedAmount(
        address _beneficiary
    ) external view returns (uint256) {
        VestingSchedule[] memory schedules = vestingSchedules[_beneficiary];
        if (schedules.length == 0) return 0;

        uint256 lockedAmount = 0;
        for (uint256 i = 0; i < schedules.length; i++) {
            VestingSchedule memory schedule = vestingSchedules[_beneficiary][i];
            lockedAmount += schedule.amountTotal - schedule.released;
        }
        return lockedAmount;
    }
}
