const { ethers } = require("hardhat");
const { exprct, expect } = require("chai");

describe("Demo", function () {
  let owner;
  let demo;
  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    const Logger = await ethers.getContractFactory("Logger", owner);
    const logger = await Logger.deploy();

    const Demo = await ethers.getContractFactory("Demo", owner);
    demo = await Demo.deploy(await logger.getAddress());
  });

  it("allows to pay and get payment info", async function () {
    const sum = 100;
    const txData = {
      value: sum,
      to: await demo.getAddress(),
    };
    const tx = await owner.sendTransaction(txData);
    await tx.wait();

    await expect(tx).to.changeEtherBalance(demo, 100);

    const amount = await demo.payment(await owner.getAddress(), 0);
    expect(amount).to.eq(sum);
  });
});
