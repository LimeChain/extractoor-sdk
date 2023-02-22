import { OptimismExtractoorClient } from 'extractoor'
const dotenv = require('dotenv');
dotenv.config()

async function run() {
    const fetcher = new OptimismExtractoorClient(process.env.OPTIMISM_GOERLI_RPC_URL || "", process.env.GOERLI_RPC_URL || "");

    const block = 5737708;
    const res = await fetcher.optimism.getProof("0xcA7B05255F52C700AE25C278DdB03C02459F7AE8", "0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563", `0x${block.toString(16)}`);

    console.log(res);
}

run()
