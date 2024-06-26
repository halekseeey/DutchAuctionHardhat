const hre = require("hardhat");
const { ethers, network } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  const [deployer] = await ethers.getSigners();

  console.log("Deploying with", await deployer.getAddress());

  const DutchAuction = await ethers.getContractFactory(
    "DutchAuction",
    deployer
  );
  const auction = await DutchAuction.deploy(
    ethers.parseEther("2.0"),
    1,
    "Motorbike"
  );

  // await auction.waitForDeployment();
  console.log(await auction.getAddress());

  saveFrontendFiles({
    DutchAuction: auction,
  });
}

function saveFrontendFiles(contracts) {
  const contractsDir = path.join(__dirname, "/..", "frontend/contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  Object.entries(contracts).forEach(async (contract_item) => {
    const [name, contract] = contract_item;
    // console.log(name, await contract.target);

    if (contract) {
      fs.writeFileSync(
        path.join(contractsDir, "/", name + "-contract-address.json"),
        JSON.stringify({ [name]: contract.target }, undefined, 2)
      );
    }

    const ContractArtifact = hre.artifacts.readArtifactSync(name);

    fs.writeFileSync(
      path.join(contractsDir, "/", name + ".json"),
      JSON.stringify(ContractArtifact, null, 2)
    );
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
