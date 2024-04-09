const { parentPort, workerData } = require('worker_threads');
const bitcoin = require('bitcoinjs-lib');
const bip39 = require('bip39');
const { BIP32Factory } = require('bip32')
const tinysecp256k1 = require('tiny-secp256k1');
const ECPairFactory = require('ecpair').ECPairFactory;
const ecpair = ECPairFactory(tinysecp256k1);
const bip32 = BIP32Factory(tinysecp256k1)

const network = bitcoin.networks.bitcoin; // or bitcoin.networks.testnet
// This function checks if an address starts with the desired pattern
function matchesVanityPattern(address, pattern) {
    return address.startsWith(pattern);
}

function derivePublicKey(xpub, path) {
    const node = bip32.fromBase58(xpub, network);
    try {
        const child = node.derivePath(`m/48/0/0/2/0/${path}`);
        return child.publicKey;
    } catch {
        const childxPubKey = node.derive(0);
        const childpub = childxPubKey.derive(path);
        return childpub.publicKey;
    }
}
// Generate a 2-of-2 multisig address from two public keys
function generateMultisigAddress(parentPublicKey1, parentPublicKey2, path) {
    const publicKey1 = derivePublicKey(parentPublicKey1, path);
    const publicKey2 = derivePublicKey(parentPublicKey2, path);
    let address;
    if (workerData.addresstype === 'p2wsh') {
         address = bitcoin.payments.p2wsh({
            redeem: bitcoin.payments.p2ms({ m: 2, pubkeys: [publicKey2, publicKey1], network }),
            network,
        }).address;
    }
    if (workerData.addresstype === 'p2sh') {
         address = bitcoin.payments.p2sh({
            redeem: bitcoin.payments.p2ms({ m: 2, pubkeys: [publicKey2, publicKey1], network }),
            network,
        }).address;
    }
    return address;
}

for (let i = 0; i < workerData.end; i++) {
    const address = generateMultisigAddress(workerData.publicKey1, workerData.publicKey2, i);
    if (matchesVanityPattern(address, workerData.vanityPattern)) {
        parentPort.postMessage({ found: true, address: address, derivation: i })
        break;
    }/*  else {
        parentPort.postMessage({ found: false, address: address, derivation: i })
    } */
}
