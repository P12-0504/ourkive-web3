import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Contract } from "ethers";

export default function connectMethodToCaller(
  contract: Contract,
  caller: HardhatEthersSigner,
  functionName: string
) {
  return contract.connect(caller).getFunction(functionName);
}
