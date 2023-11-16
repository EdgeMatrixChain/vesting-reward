// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/// @title ConsumptionV1
contract ConsumptionV1 {
    /**
     * @notice Token contract address
     */
    ERC20Burnable public immutable consumptionToken;

    IERC20 public immutable fundToken;

    address public beneficiary; // address of the beneficiary for token sales

    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    /**
     * @dev Throws if called by any account other than the beneficiary.
     */
    modifier onlyBeneficiary() {
        require(
            beneficiary == msg.sender,
            "ConsumptionV1: caller is not the beneficiary"
        );
        _;
    }

    event FundClaimed(address holder, uint256 amount);

    // update the beneficiary.
    function setBeneficiary(address _beneficiary) public onlyBeneficiary {
        require(
            msg.sender != address(0),
            "ConsumptionV1: transfer beneficiary to the zero address"
        );
        beneficiary = _beneficiary;
    }

    function claimFund(uint256 amount) public onlyBeneficiary {
        uint256 balance = fundToken.balanceOf(address(this));

        require(balance >= amount, "ConsumptionV1: exceed balance");

        fundToken.safeTransfer(msg.sender, amount);

        emit FundClaimed(msg.sender, amount);
    }

    event ConsumptionBurned(address account, uint256 amount, string memo);

    event FundConsumptionBurned(
        address account,
        uint128 fundAmount,
        uint256 amount,
        string memo
    );

    constructor(address _consumptionToken, address _fundToken) {
        fundToken = IERC20(_fundToken);
        consumptionToken = ERC20Burnable(_consumptionToken);
    }

    // calculate consumption amount based on cex token pair
    function getConsumptionAmount(
        uint128 fundAmount
    ) public pure returns (uint256 consumptionAmount, uint8 decimal) {
        uint256 priceRate = 1e18;
        consumptionAmount = (fundAmount * 1e18) / priceRate;
        decimal = 18;
    }

    function burnByUSDT(uint128 fundAmount, string memory memo) external {
        require(fundAmount > 0, "ConsumptionV1: fundAmount Error");

        (uint256 consumptionAmount, uint8 decimal) = getConsumptionAmount(
            fundAmount
        );
        uint256 consumptionTokenBalance = consumptionToken.balanceOf(
            address(this)
        );

        require(
            consumptionTokenBalance >= consumptionAmount,
            "ConsumptionV1: consumptionAmount exceed balance"
        );

        require(
            fundToken.allowance(msg.sender, address(this)) >= fundAmount,
            "ConsumptionV1: checkFundTokenAllowance Error"
        );

        // receive fund tokens
        fundToken.safeTransferFrom(msg.sender, address(this), fundAmount);

        // burn tokens
        consumptionToken.burnFrom(msg.sender, consumptionAmount);

        emit FundConsumptionBurned(
            msg.sender,
            fundAmount,
            consumptionAmount,
            memo
        );
    }

    function burn(uint256 amount, string memory memo) external {
        require(amount > 0, "ConsumptionV1: amount Error");

        require(
            consumptionToken.allowance(msg.sender, address(this)) >= amount,
            "ConsumptionV1: checkTokenAllowance Error"
        );

        // burn tokens
        consumptionToken.burnFrom(msg.sender, amount);

        emit ConsumptionBurned(msg.sender, amount, memo);
    }
}
