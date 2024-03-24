// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract AucEngine {
    address public owner;
    uint constant DURATION = 2 days;
    uint constant FEE = 10;

    struct Auction {
        address payable seller;
        uint startingPrice;
        uint finalPrice;
        uint startAt;
        uint endsAt;
        uint discountRate;
        string item;
        bool stopped;
    }

    Auction[] public auctions;

    event AuctionCreated(uint index, string itemName, uint startingPrice, uint duration);
    event AuctionEnded(uint index, uint finalPrice, address winner);

    constructor() {
        owner = msg.sender;
    }

    function createAuctions(uint _startingPrice, uint _discountRate, string calldata _item, uint _duration ) external {
        uint duration = _duration == 0 ? DURATION : _duration;
        require(_startingPrice >= _discountRate * duration, 'Incorrect starting price');

        Auction memory newAuction = Auction({
            seller: payable(msg.sender),
            startingPrice: _startingPrice,
            finalPrice: _startingPrice,
            discountRate: _discountRate,
            startAt: block.timestamp,
            endsAt: block.timestamp + duration,
            item: _item,
            stopped: false
        });

        auctions.push(newAuction);

        emit AuctionCreated(auctions.length - 1, _item, _startingPrice, duration);
    }

    function getPriceView(uint index) public view returns(uint) {
        Auction memory curAuction = auctions[index];
        require(!curAuction.stopped, 'stopped!');
        uint elapsed = block.timestamp - curAuction.startAt;
        return curAuction.startAt - curAuction.discountRate * elapsed;
    }

    function buy(uint index) public payable{
        Auction storage curAuction = auctions[index];
        require(!curAuction.stopped, 'stopped!');
        require(curAuction.endsAt > block.timestamp , 'ended!');
        uint currentPrice = getPriceView(index);
        require(currentPrice <= msg.value, 'not enought funds');
        curAuction.stopped = true;
        curAuction.finalPrice = currentPrice;
        uint refund = msg.value - currentPrice;
        if (refund > 0) {
            payable(msg.sender).transfer(refund);
        }
        curAuction.seller.transfer(
            currentPrice - ((currentPrice * FEE) / 10)
        );

        emit AuctionEnded(index, currentPrice, msg.sender);
    }
}