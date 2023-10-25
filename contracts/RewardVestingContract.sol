// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
// import "https://github.com/abdk-consulting/abdk-libraries-solidity/blob/master/ABDKMath64x64.sol";
import "./lib/ABDKMath64x64.sol";

/// @title RewardVestingContract
/// @notice  The RewardVesing Smart Contract that allows to create vesting schedules for a beneficiary with 1 day/30 days/90 days/180 days/360 days cliff unlocking.
//  Staker can receive corresponding rewards based on the duration and cliff period(1 day/30 days/90 days/180 days/360 days).
/// This is a rewriting of [VestingContract.sol](https://github.com/andreitoma8/vesting-contract/blob/master/contracts/VestingContract.sol), modified for adding reward functions.
contract RewardVesting {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    /**
     * @notice The token to be vested
     */
    IERC20 public immutable token;

    address public operator;

    // total reward of tokens can be released;
    uint256 public permanentTotal;

    enum DurationUnits {
        Days,
        Days30,
        Days90,
        Days180,
        Days360
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
        // yield rate , yieldRate = durationUnitRewards[durationUnitRewards] * (multiple ** (duration - 1)
        uint256 yieldRate;
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
     * @notice Multiple of schedule durationUnits
     */
    mapping(DurationUnits => uint256) public durationUnitMultiple;

    /**
     * @notice Emitted when a vesting schedule is created
     * @param beneficiary The address of the beneficiary
     * @param start The start UNIX timestamp of the vesting period
     * @param duration The duration of the vesting period in DurationUnits
     * @param durationUnits The units of the duration(0 = days, 1 = days30, 2 = days90, 3 = days180,  4 = days360)
     * @param yieldRate Rreward per Ether token
     */
    event VestingScheduleCreated(
        address indexed beneficiary,
        uint256 start,
        uint256 duration,
        DurationUnits durationUnits,
        uint256 amountTotal,
        uint256 yieldRate
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
     * @param daysBaseRate Base rate by DurationUnits.Days,
     * @param daysDurationMultiple Multiple for durations by DurationUnits.Days,
     * @param days30BaseRate Base rate by DurationUnits.Days30
     * @param days30DurationMultiple Multiple for durations by DurationUnits.Days30
     * @param days90BaseRate Base rate by DurationUnits.Days90
     * @param days90DurationMultiple Multiple for durations by DurationUnits.Days90
     * @param days180BaseRate Base rate by DurationUnits.Days180
     * @param days180DurationMultiple Multiple for durations by DurationUnits.Days180
     * @param days360BaseRate Base rate by DurationUnits.Days360
     * @param days360DurationMultiple Multiple for durations by DurationUnits.Days360
     * @dev Assuming that 1e18 = 100% and 1e16 = 1% and 1ee14 = 0.01%.
     */
    constructor(
        IERC20 _token,
        uint256 daysBaseRate,
        uint256 daysDurationMultiple,
        uint256 days30BaseRate,
        uint256 days30DurationMultiple,
        uint256 days90BaseRate,
        uint256 days90DurationMultiple,
        uint256 days180BaseRate,
        uint256 days180DurationMultiple,
        uint256 days360BaseRate,
        uint256 days360DurationMultiple
    ) {
        token = _token;
        operator = msg.sender;
        durationUnitRewards[DurationUnits.Days] = daysBaseRate;
        durationUnitRewards[DurationUnits.Days30] = days30BaseRate;
        durationUnitRewards[DurationUnits.Days90] = days90BaseRate;
        durationUnitRewards[DurationUnits.Days180] = days180BaseRate;
        durationUnitRewards[DurationUnits.Days360] = days360BaseRate;

        durationUnitMultiple[DurationUnits.Days] = daysDurationMultiple;
        durationUnitMultiple[DurationUnits.Days30] = days30DurationMultiple;
        durationUnitMultiple[DurationUnits.Days90] = days90DurationMultiple;
        durationUnitMultiple[DurationUnits.Days180] = days180DurationMultiple;
        durationUnitMultiple[DurationUnits.Days360] = days360DurationMultiple;
    }

    function setOperator(address _op) external {
        require(msg.sender == operator, "!auth");
        operator = _op;
    }

    /**
     * @notice Set reward of schedule durationUnits
     * @param daysBaseRate Base rate by DurationUnits.Days,
     * @param daysDurationMultiple Multiple for durations by DurationUnits.Days,
     * @param days30BaseRate Base rate by DurationUnits.Days30
     * @param days30DurationMultiple Multiple for durations by DurationUnits.Days30
     * @param days90BaseRate Base rate by DurationUnits.Days90
     * @param days90DurationMultiple Multiple for durations by DurationUnits.Days90
     * @param days180BaseRate Base rate by DurationUnits.Days180
     * @param days180DurationMultiple Multiple for durations by DurationUnits.Days180
     * @param days360BaseRate Base rate by DurationUnits.Days360
     * @param days360DurationMultiple Multiple for durations by DurationUnits.Days360
     * @dev Assuming that 1e18 = 100% and 1e16 = 1% and 1e14 = 0.01%.
     */
    function setDurationUnitRewards(
        uint256 daysBaseRate,
        uint256 daysDurationMultiple,
        uint256 days30BaseRate,
        uint256 days30DurationMultiple,
        uint256 days90BaseRate,
        uint256 days90DurationMultiple,
        uint256 days180BaseRate,
        uint256 days180DurationMultiple,
        uint256 days360BaseRate,
        uint256 days360DurationMultiple
    ) external {
        require(msg.sender == operator, "!auth");

        durationUnitRewards[DurationUnits.Days] = daysBaseRate;
        durationUnitRewards[DurationUnits.Days30] = days30BaseRate;
        durationUnitRewards[DurationUnits.Days90] = days90BaseRate;
        durationUnitRewards[DurationUnits.Days180] = days180BaseRate;
        durationUnitRewards[DurationUnits.Days360] = days360BaseRate;

        durationUnitMultiple[DurationUnits.Days] = daysDurationMultiple;
        durationUnitMultiple[DurationUnits.Days30] = days30DurationMultiple;
        durationUnitMultiple[DurationUnits.Days90] = days90DurationMultiple;
        durationUnitMultiple[DurationUnits.Days180] = days180DurationMultiple;
        durationUnitMultiple[DurationUnits.Days360] = days360DurationMultiple;
    }

    /**
     * @notice Returns reward of schedule durationUnits
     */
    function getDurationUnitRewards()
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        return (
            durationUnitRewards[DurationUnits.Days],
            durationUnitMultiple[DurationUnits.Days],
            durationUnitRewards[DurationUnits.Days30],
            durationUnitMultiple[DurationUnits.Days30],
            durationUnitRewards[DurationUnits.Days90],
            durationUnitMultiple[DurationUnits.Days90],
            durationUnitRewards[DurationUnits.Days180],
            durationUnitMultiple[DurationUnits.Days180],
            durationUnitRewards[DurationUnits.Days360],
            durationUnitMultiple[DurationUnits.Days360]
        );
    }

    /**
     * @notice Deposit tokens permanently(CAN NOT DOING WITHDRAW FOREVER!)
     * @param _amount The amount of tokens to be locked
     * @dev Approve the contract to transfer the tokens before calling this function
     */

    function depositPermanently(uint _amount) external {
        require(_amount > 0, "VestingContract: amount is 0");

        // transfer the tokens to be locked to the contract
        token.safeTransferFrom(msg.sender, address(this), _amount);
        permanentTotal = permanentTotal.add(_amount);
    }

    /**
     * @notice Creates a vesting schedule
     * @param _beneficiary The address of the beneficiary
     * @param _start The start UNIX timestamp of the vesting period
     * @param _duration The duration of the vesting period in DurationUnits
     * @param _durationUnits The units of the duration(0 = days, 1 = months, 2 = quarters, 3 = years)
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
        uint256 yieldRate = _yieldRate(_durationUnits, _duration);

        vestingSchedules[_beneficiary].push(
            VestingSchedule({
                beneficiary: _beneficiary,
                start: _start,
                duration: _duration,
                durationUnits: _durationUnits,
                amountTotal: _amountTotal,
                released: 0,
                yieldRate: yieldRate,
                rewarded: 0
            })
        );

        emit VestingScheduleCreated(
            _beneficiary,
            _start,
            _duration,
            _durationUnits,
            _amountTotal,
            yieldRate
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
                schedule.released = schedule.released.add(amountToSend);
                if (rewardToSend > 0) {
                    schedule.rewarded = schedule.rewarded.add(rewardToSend);
                    // update the total rewarded amount
                    totalReward = totalReward.add(rewardToSend);
                    // update the total permanet amount
                    require(
                        permanentTotal >= rewardToSend,
                        "VestingContract: tokens for reward is not enough"
                    );

                    permanentTotal = permanentTotal.sub(rewardToSend);
                }
                // update the total released amount
                totalRelease = totalRelease.add(amountToSend);
                // transfer the tokens to the beneficiary
                token.safeTransfer(
                    schedule.beneficiary,
                    amountToSend.add(rewardToSend)
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
            amountToSend = amountToSend.add(amount);
            rewardToSend = rewardToSend.add(reward);
        }
        return (amountToSend, rewardToSend);
    }

    /**
     * @notice Returns the amount of tokens for a beneficiary (amountTotal, releasedTotal, rewardedTotal)
     * @param _beneficiary The address of the beneficiary
     */
    function getAmount(
        address _beneficiary
    ) external view returns (uint256, uint256, uint256) {
        VestingSchedule[] memory schedules = vestingSchedules[_beneficiary];
        if (schedules.length == 0) return (0, 0, 0);

        uint256 amountTotal = 0;
        uint256 releasedTotal = 0;
        uint256 rewardedTotal = 0;
        for (uint256 i = 0; i < schedules.length; i++) {
            VestingSchedule memory schedule = vestingSchedules[_beneficiary][i];
            amountTotal = amountTotal.add(schedule.amountTotal);
            releasedTotal = releasedTotal.add(schedule.released);
            rewardedTotal = rewardedTotal.add(schedule.rewarded);
        }
        return (amountTotal, releasedTotal, rewardedTotal);
    }

    /**
     * @notice Returns the releasable amount of tokens for a vesting schedule
     * @param _schedule The vesting schedule
     */
    function releasableAmount(
        VestingSchedule memory _schedule
    ) public view returns (uint256, uint256) {
        (uint256 amount, uint256 reward) = vestedAmount(_schedule);
        return (amount.sub(_schedule.released), reward.sub(_schedule.rewarded));
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
        } else if (_schedule.durationUnits == DurationUnits.Days30) {
            sliceInSeconds = 30 days;
        } else if (_schedule.durationUnits == DurationUnits.Days90) {
            sliceInSeconds = 90 days;
        } else if (_schedule.durationUnits == DurationUnits.Days180) {
            sliceInSeconds = 180 days;
        } else if (_schedule.durationUnits == DurationUnits.Days360) {
            sliceInSeconds = 360 days;
        }
        if (block.timestamp < _schedule.start) {
            return (0, 0);
        } else if (
            block.timestamp >=
            _schedule.start.add(_schedule.duration.mul(sliceInSeconds))
        ) {
            return (
                _schedule.amountTotal,
                _schedule.amountTotal.mul(_schedule.yieldRate).div(1e18)
            );
        } else {
            uint256 passed = (block.timestamp.sub(_schedule.start)).div(
                sliceInSeconds
            );
            uint256 amount = _schedule.amountTotal.mul(passed).div(
                _schedule.duration
            );
            return (amount, amount.mul(_schedule.yieldRate).div(1e18));
        }
    }

    /**
     * @notice Returns the final yield rate = baseRate * (multiple ** (duration - 1));
     * @param _durationUnit The units of the duration(0 = days, 1 = days30, 2 = days90, 3 = days180,  4 = days360)
     */
    function _yieldRate(
        DurationUnits _durationUnit,
        uint256 _duirations
    ) internal view returns (uint256) {
        uint256 finalRate = 0;

        int128 baseRate = ABDKMath64x64.fromUInt(
            durationUnitRewards[_durationUnit]
        );
        int128 multiple = ABDKMath64x64.divu(
            durationUnitMultiple[_durationUnit],
            1e18
        );
        uint256 powValue = _duirations - 1;

        finalRate = ABDKMath64x64.toUInt(
            ABDKMath64x64.mul(ABDKMath64x64.pow(multiple, powValue), baseRate)
        );

        return finalRate;
    }

    function _lockedAmount(
        address _beneficiary
    ) internal view returns (uint256) {
        VestingSchedule[] memory schedules = vestingSchedules[_beneficiary];
        if (schedules.length == 0) return 0;

        uint256 lockedAmount = 0;
        for (uint256 i = 0; i < schedules.length; i++) {
            VestingSchedule memory schedule = vestingSchedules[_beneficiary][i];
            lockedAmount = lockedAmount.add(
                schedule.amountTotal - schedule.released
            );
        }
        return lockedAmount;
    }

    /**
     * @notice Returns the locked amount of tokens for a beneficiary
     * @param _beneficiary The address of the beneficiary
     */
    function getLockedAmount(
        address _beneficiary
    ) external view returns (uint256) {
        return _lockedAmount(_beneficiary);
    }

    /**
     * @notice Provided to other governance contract calls
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(address account) external view returns (uint256) {
        return _lockedAmount(account);
    }
}
