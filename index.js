import { VersionedTransaction, Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import fs from "fs";
import fetch from "node-fetch"; // Ensure node-fetch is installed

const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com/"; // Use a valid Solana RPC endpoint
const web3Connection = new Connection(RPC_ENDPOINT, "confirmed");

async function sendLocalCreateTx() {
    const signerKeyPair = Keypair.fromSecretKey(
        bs58.decode(
            "6749GN8qcoVHxmzvK1TMXKvxby52E6ToV8AiW1QNwHgr8aLDK4CCdrEVKwgkKKmb84Ew8sNKX8MjEMh8cGhHNFzz"
        )
    );

    // Generate a random keypair for the token
    const mintKeypair = Keypair.generate();

    // Define token metadata
    const formData = new FormData();

    // Read the image file as a buffer
    const imageBuffer = fs.readFileSync("./image.png");
    formData.append("file", new Blob([imageBuffer]), "image.png");

    formData.append("name", "PPTest");
    formData.append("symbol", "TEST");
    formData.append(
        "description",
        "This is an example token created via PumpPortal.fun"
    );
    formData.append("twitter", "https://x.com/a1lon9/status/1812970586420994083");
    formData.append(
        "telegram",
        "https://x.com/a1lon9/status/1812970586420994083"
    );
    formData.append("website", "https://pumpportal.fun");
    formData.append("showName", "true");

    // Create IPFS metadata storage
    const metadataResponse = await fetch("https://pump.fun/api/ipfs", {
        method: "POST",
        body: formData,
    });
    const metadataResponseJSON = "";
    if (metadataResponse.ok) {
        const textResponse = await metadataResponse.text();

        metadataResponseJSON = JSON.parse(textResponse);
        // Ensure the response was parsed correctly
        console.log("Parsed response:", metadataResponseJSON);

        // Proceed with further processing
    } else {
        console.error(
            "Failed to fetch metadata:",
            metadataResponse.status,
            metadataResponse.statusText
        );
    }

    // Get the create transaction
    const response = await fetch("https://pumpportal.fun/api/trade-local", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            publicKey: "Ek2aDDXsqJam4mBm96UrfmwMB88aPoLSKXXJU2cCyDXQ",
            action: "create",
            tokenMetadata: {
                name: metadataResponseJSON.name,
                symbol: metadataResponseJSON.symbol,
                uri: metadataResponseJSON.metadataUri,
            },
            mint: mintKeypair.publicKey.toBase58(),
            denominatedInSol: "true",
            amount: 0, // dev buy of 1 SOL
            slippage: 10,
            priorityFee: 0.0005,
            pool: "pump",
        }),
    });

    if (response.status === 200) {
        const data = await response.arrayBuffer();

        // Convert to Uint8Array safely
        try {
            const uint8ArrayData = new Uint8Array(data);
            const tx = VersionedTransaction.deserialize(uint8ArrayData);
            tx.sign([mintKeypair, signerKeyPair]);

            // Send the transaction
            const signature = await web3Connection.sendTransaction(tx);
            console.log("Transaction: https://solscan.io/tx/" + signature);
        } catch (error) {
            console.error("Error during deserialization or transaction signing:", error);
        }
    } else {
        console.log(response.statusText); // log error
    }
}

sendLocalCreateTx();