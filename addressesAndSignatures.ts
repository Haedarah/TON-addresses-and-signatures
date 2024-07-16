import { mnemonicToWalletKey, sign, signVerify } from "@ton/crypto";
import { WalletContractV3R2 } from "@ton/ton";
import TonWeb from "tonweb";

import * as dotenv from 'dotenv';
dotenv.config();

const tonweb_mainnet = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC'));
const tonweb_testnet = new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC'));

async function main() {

    //In the process of creating a wallet (which is a smart contract in TON), you will get a 24-word mnemonic phrase.
    //This phrase will be used now to retrieve different forms of addresses on both existing workchains and the testnet.
    const mnemonic = process.env.DEV_SEED_PHRASE;
    
    //Checking if the mnemonic phrase is getting imported correctly.
    if (!mnemonic) {
        console.error("DEV_SEED_PHRASE is not defined in environment variables.");
        process.exit(1);
    }

    // (1) Returns a 64-byte long seed from the above mnemonic phrase. From that, the public-key and secret-key are retrieved.
    //Those keys aren't addresses. They don't have flags or workchain_ids associated with them.
    //The public key is used to receive funds, and to verify signatures.
    //The secret key is used to sign messages and transactions.
    const key = await mnemonicToWalletKey(mnemonic.split(" ")); //(1)
    console.log("======================================================================");
    console.log("Public Key: ",key.publicKey);
    console.log("Secret Key: ",key.secretKey);
    console.log("======================================================================");

    // (2)+(3) Retunrs a wallet in the form and on the workchain that we specify in its arguments.
    // `WalletContractV3R2` is the wallet type. You get to know this type from the BLOCK EXPLORER once your wallet is active.
    //Current available WalletContract types are: V1R1, V1R2, V1R3, V2R1, V2R2, V3R1, V3R2, and V4.
    //In this example, after activating my wallet address, I got to know that it is of type V3R2.
    //the following constant `wallet` represents my V3R2 BaseChain wallet contract. Let's see what we can do with that.
    const wallet_Base = WalletContractV3R2.create({ publicKey: key.publicKey, workchain: 0 }); //(2)
    const wallet_Master = WalletContractV3R2.create({ publicKey: key.publicKey, workchain: -1 }); //(3)


    //The adderss of my wallet contract on the BaseChain (workchain_id=0): 
    console.log("BaseChain wallet contract:",wallet_Base.address.toString());
    //Display the workchain:
    console.log("Workchain:", wallet_Base.address.workChain);
    //Display the balance:
    console.log("Balance:", await getWalletBalance(wallet_Base.address.toString(),"main"));
    console.log("======================================================================");
    
    await sleep(1000);

    //The address of my wallet contract - BaseChain testnet version:
    console.log("Testnet BaseChain wallet contract:",wallet_Base.address.toString({ testOnly: true }));
    //Display the workchain:
    console.log("Workchain:", wallet_Base.address.workChain);
    // Display the balance:
    console.log("Balance: ", await getWalletBalance(wallet_Base.address.toString({ testOnly: true }),"test"));
    console.log("======================================================================");

    await sleep(1000);

    //The adderss of my wallet contract on the MasterChain (workchain_id=-1): 
    console.log("MasterChain wallet contract:",wallet_Master.address.toString());
    //Display the workchain:
    console.log("Workchain:", wallet_Master.address.workChain);
    //Display the balance:
    console.log("Balance: ", await getWalletBalance(wallet_Master.address.toString(),"main"));
    console.log("======================================================================");

    await sleep(1000);

    //The address of my wallet contract - MasterChain testnet version:
    console.log("Testnet MasterChain wallet contract:",wallet_Master.address.toString({ testOnly: true }));
    //Display the workchain:
    console.log("Workchain:", wallet_Master.address.workChain);
    // Display the balance:
    console.log("Balance: ", await getWalletBalance(wallet_Master.address.toString({ testOnly: true }),"test"));
    console.log("======================================================================");
    
  ////Create a message
    //An address:
    const message_address = wallet_Base.address.toString({ testOnly: true});
    //A number:
    const message_number = 125;
    //The message:
    const message = `${message_address},${message_number}`;
    console.log("The message:",message);

  ////Sign the message we just created using our smart contract wallet's secret key:
      const signature = sign(Buffer.from(message),key.secretKey);
      console.log("Signature:", signature.toString('hex'));

  ////Verify that the above signature is valid.
      console.log("Verification result:",signVerify(Buffer.from(message), signature, key.publicKey));
      console.log("Verification result for another message:",signVerify(Buffer.from("another_message"), signature, key.publicKey))
      console.log("======================================================================");

}

async function getWalletBalance(address: string, net: string): Promise<number> {
    try {
      const walletAddress = new TonWeb.utils.Address(address);
      if(net=="main")
      {
        const balance = await tonweb_mainnet.provider.getBalance(walletAddress.toString());
        return balance/1e9; //TON has 9 decimals
      }
      else
      {
        const balance = await tonweb_testnet.provider.getBalance(walletAddress.toString());
        return balance/1e9;
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      return 0;
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

main().catch((error)=>{
    console.error("Error in main function:", error);
});