// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IERC20.sol";

contract ERC20 is IERC20 {
    address owner;
    mapping(address => uint) balances;
    mapping(address => mapping(address => uint)) public allowances;
    string _name;
    string _symbol;
    uint totalTokens;

    modifier enoughTokens(address _from, uint _amount) {
        require(balanceOf(_from) >= _amount, "Not enough tokens!");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not an owner!");
        _;
    }
    constructor(string memory name_, string memory symbol_, uint initialSupply, address shop) {
        _name = name_;
        _symbol = symbol_;
        owner = msg.sender;
        mint(initialSupply, shop);
    }

    function name() external view override returns (string memory) {
        return _name;
    }

    function symbol() external view override returns (string memory) {
        return _symbol;
    }

    function mint(uint amount, address shop) public onlyOwner {
        _beforeTokensTransfer(address(0), shop, amount);
        balances[shop] += amount;
        totalTokens += amount;
        emit Transfer(address(0), shop, amount);
    }

    function burn(address _from, uint amount) public onlyOwner{
        _beforeTokensTransfer(_from, address(0), amount);
        balances[_from] -= amount;
        totalTokens -= amount;
    } 

    function decimals() external pure override returns (uint) {
        return 18;
    }

    function totalSupply() external view override returns (uint) {
        return totalTokens;
    }

    function balanceOf(address account) public view override returns (uint) {
        return balances[account];
    }

    function transfer(address to, uint amount) external override enoughTokens(msg.sender, amount){
        _beforeTokensTransfer(msg.sender, to, amount);
        balances[msg.sender] -= amount;
        balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
    }

    function _beforeTokensTransfer(
        address from,
        address to,
        uint amount
    ) internal virtual {

    }

    function allowance(
        address _owner,
        address spender
    ) public view override returns (uint) {
        return allowances[_owner][spender];
    }

    function approve(address sender, uint amount) external override {
        _approve(msg.sender, sender, amount);
    }

    function _approve(address _from, address sender, uint amount) internal virtual {
        allowances[_from][sender] = amount;
        emit Approve(_from, sender, amount);

    }
    
    function transferFrom(
        address sender,
        address recipient,
        uint amount
    ) external override enoughTokens(sender, amount){
        _beforeTokensTransfer(sender, recipient, amount);
        require(allowances[sender][recipient] >= amount, "Check allownce!");
        allowances[sender][recipient] -= amount;
        balances[sender] -= amount;
        balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }
}

contract masicToken is ERC20 {
    constructor(address shop) ERC20("masicToken", "MSCT", 20, shop) {}
}

contract masicShop {
    IERC20 public token;
    address payable public owner;
    event Bought(uint _amount, address indexed _buyer);
    event Sold(uint _amount, address indexed _solder);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not an owner!");
        _;
    }

    constructor() {
        token = new masicToken(address(this));
        owner = payable(msg.sender);
    }

    receive() external payable {
        uint tokensToBuy = msg.value;
        require(tokensToBuy > 0, "Not enough balance");

        require(tokensToBuy <= tokenBalance(), "Not enough tokens!");

        token.transfer(msg.sender, tokensToBuy);
        emit Bought(tokensToBuy, msg.sender);
    }

    function sell(uint _amountToSell) external {
        require(_amountToSell > 0 && token.balanceOf(msg.sender) >= _amountToSell, "Not enough tokens!");
        require(token.allowance(msg.sender, address(this)) >= _amountToSell, "Check allowance");
        token.transferFrom(msg.sender, address(this), _amountToSell);
        payable(msg.sender).transfer(_amountToSell);

        emit Sold(_amountToSell, msg.sender);
    }

    function tokenBalance() public view returns(uint){
        return token.balanceOf(address(this));
    }
}