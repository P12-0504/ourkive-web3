import { Contract } from "ethers";

export const DEFAULT_COLLECTOR_FEE_DISCOUNT_BASIS_POINT = 300;

type GetCollectorFeeArgs = {
  nftPrice: bigint;
};

export async function getCollectorFee(
  memberContract: Contract,
  { nftPrice }: GetCollectorFeeArgs
) {
  return await memberContract.getCollectorFee(nftPrice);
}

type GetNFTBuyerPriceArgs = {
  nftPrice: bigint;
};

export async function getNFTBuyerPrice(
  memberContract: Contract,
  { nftPrice }: GetNFTBuyerPriceArgs
) {
  return await memberContract.getNFTBuyerPrice(nftPrice);
}
