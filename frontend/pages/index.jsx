import React, { Component, useEffect, useState } from "react";
import { ethers } from "ethers";

import { ConnectWallet } from "../components/ConnectWallet";

import auctionAddress from "../contracts/DutchAuction-contract-address.json";
import auctionArtifact from "../contracts/DutchAuction.json";

import { setIntervalAsync, clearIntervalAsync } from "set-interval-async";
import { WaitingForTransactionMessage } from "@/components/WaitingForTransaction";
import { TransactionErrorMessage } from "@/components/TransactionErrorMessage";

const HARDHAT_NETWORK_ID = "31337";
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

const Page = () => {
  let auction, provider, checkPriceInterval;
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [txBeingSent, SetTxBeingSent] = useState(null);
  const [networkError, setNetworkError] = useState(null);
  const [transactionError, setTransactionError] = useState(null);
  const [balance, setBalance] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [auctionState, setAuctionState] = useState(null);
  const [providerState, setProvederState] = useState(null);
  const [stopped, setStopped] = useState(false);

  const connectWallet = async () => {
    if (window.ethereum === undefined) {
      setNetworkError("Please install Metamask!");
      return;
    }
    if (!checkNetwork()) {
      return;
    }
    const [selectedAddress] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    setSelectedAccount(selectedAddress);
    initialize(selectedAddress);

    window.ethereum.on("accountsChanged", ([newAddress]) => {
      initialize(newAddress);
    });
  };

  const nextBlock = async () => {
    console.log(auctionState);
    await auctionState.nextBlock();
  };

  const buyClick = async () => {
    console.log(currentPrice, providerState);
    try {
      const tx = await auctionState.buy({
        value: ethers.utils.parseEther(currentPrice),
      });
      SetTxBeingSent(tx.hash);

      await tx.wait();
    } catch (error) {
      if (error === ERROR_CODE_TX_REJECTED_BY_USER) return;
      console.error(error);
      setTransactionError(error);
    } finally {
      SetTxBeingSent(null);

      // await updateBalance(providerState, selectedAccount);
      await updatedStop(auctionState);
    }
  };

  const initialize = async (selectedAddress) => {
    provider = new ethers.providers.Web3Provider(window.ethereum);

    auction = await new ethers.Contract(
      auctionAddress.DutchAuction,
      auctionArtifact.abi,
      await provider.getSigner(0)
    );

    setAuctionState(auction);
    setProvederState(provider);

    if (await updatedStop(auction)) return;

    await updateBalance(provider, selectedAddress);

    const startingPrice = await auction.startingPrice();
    const startAt = ethers.BigNumber.from(await auction.startAt());
    const discountRate = await auction.discountRate();

    checkPriceInterval = setInterval(async () => {
      const elapsed = ethers.BigNumber.from(Math.floor(Date.now() / 1000)).sub(
        startAt
      );
      const discount = discountRate.mul(elapsed);
      const newPrice = startingPrice.sub(discount);
      setCurrentPrice(ethers.utils.formatEther(newPrice));
    }, 1000);
    console.log(checkPriceInterval);
    console.log(await ethers.utils.formatEther(await auction.getPrice()));

    // const startedBlockNumber = await provider.getBlockNumber();
    // auction.on("Bought", (...args) => {
    //   const event = args[args.length - 1];
    //   if (event.blockNumber <= startedBlockNumber) return;
    //   args[0];
    // })
  };

  const updatedStop = async (auction) => {
    const st = await auction.stopped();
    if (st) {
      clearInterval(checkPriceInterval);
    }
    setStopped(st);
    console.log(st);
    return st;
  };

  const updateBalance = async (currentProvider, selectedAccount) => {
    const newBalance = (
      await currentProvider.getBalance(selectedAccount)
    ).toString();

    setBalance(newBalance);
  };

  const checkNetwork = () => {
    if (window.ethereum.networkVersion === HARDHAT_NETWORK_ID) {
      return true;
    }
    setNetworkError("Please connect to localhost:8545");

    return false;
  };

  const dismissNetworkError = () => {
    setNetworkError(null);
  };
  const dismissTransactionError = () => {
    setNetworkError(null);
  };

  if (!selectedAccount) {
    return (
      <ConnectWallet
        connectWallet={connectWallet}
        networkError={networkError}
        dismiss={dismissNetworkError}
      />
    );
  }

  const getRpcErrorMessage = (error) => {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  };
  if (stopped) {
    return <p>Auction stopped</p>;
  }
  return (
    <>
      {balance && <p>Your balance: {ethers.utils.formatEther(balance)} ETH</p>}
      <p>{`Current price: ${currentPrice} ETH`}</p>
      <button onClick={buyClick}>Buy</button>
      {txBeingSent && <WaitingForTransactionMessage txHash={txBeingSent} />}
      {transactionError && (
        <TransactionErrorMessage
          message={getRpcErrorMessage(transactionError)}
          dismiss={() => dismissTransactionError()}
        />
      )}
    </>
  );
};

export default Page;
