// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "./Ilogger.sol";
contract Demo {
    Ilogger logger;
    constructor(address _logger) {
        logger = Ilogger(_logger);
    }

    function payment(address _from, uint _index) public view returns(uint) {
        return logger.getEntry(_from, _index);
    }

    receive() external payable {
        logger.log(msg.sender, msg.value);
    }
}