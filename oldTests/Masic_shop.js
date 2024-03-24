const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokenJson = require("../artifacts/contracts/ERC20.sol/masicToken.json");

describe("MasicShop", function () {
  let owner, buyer, shop, erc20;

  beforeEach(async function () {
    [owner, buyer] = await ethers.getSigners();

    const MasicShop = await ethers.getContractFactory("masicShop", owner);
    shop = await MasicShop.deploy();

    erc20 = await new ethers.Contract(await shop.token(), tokenJson.abi, owner);
  });

  it("should have an owner and a token", async function () {
    expect(await shop.owner()).to.eq(owner.address);
    expect(await shop.token()).to.be.properAddress;
  });

  it("allows to buy", async function () {
    const tokenAmount = 3;

    const txData = {
      value: 3,
      to: await shop.getAddress(),
    };

    const tx = await buyer.sendTransaction(txData);

    await tx.wait();

    expect(await erc20.balanceOf(buyer.address)).to.eq(tokenAmount);

    await expect(() => tx).to.changeEtherBalance(shop, tokenAmount);
    await expect(tx)
      .to.emit(shop, "Bought")
      .withArgs(tokenAmount, buyer.address);
  });

  it("allows to sell", async function () {
    const tokenAmount = 3;

    const txData = {
      value: 3,
      to: await shop.getAddress(),
    };

    const tx = await buyer.sendTransaction(txData);

    await tx.wait();

    expect(await erc20.balanceOf(buyer.address)).to.eq(tokenAmount);

    await expect(() => tx).to.changeEtherBalance(shop, tokenAmount);
    await expect(tx)
      .to.emit(shop, "Bought")
      .withArgs(tokenAmount, buyer.address);

    const approval = await erc20
      .connect(buyer)
      .approve(await shop.getAddress(), tokenAmount);
    await approval.wait();

    console.log(
      await erc20.connect(buyer).allowance(buyer.address, shop.getAddress())
    );

    const txSell = await shop.connect(buyer).sell(tokenAmount);

    await expect(() => txSell).to.changeEtherBalance(shop, -tokenAmount);

    await expect(txSell)
      .to.emit(shop, "Sold")
      .withArgs(tokenAmount, buyer.address);
  });
});
