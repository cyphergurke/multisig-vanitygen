const { Worker } = require('worker_threads');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
// test xpubs
/* const publicKey1 = "xpub6DdWQUqa5cGtS6HJByj1u2r3QLg9zGh3uWnnJC9n2kRVAuXRDep7WyzLirVfQyiEWvfGXcwSH5jTfwPBr3grjDAUGkDzuSc4yPsr9TBjphK"
const publicKey2 = "xpub6EoaJhcmBJNkMSbSwRQtukLfxUKQbxoMM5YWtAzZ4jfzBsbyvhqA5Bz11wPCWJE9diP5XMfgL3EbthL7zpinWxUuSby9Jfsh3jAHWG3n9a5"
*/

rl.question('Enter the first master public key: ', (key1) => {
    rl.question('Enter the second master public key: ', (key2) => {
        const publicKey1 = key1.trim();
        const publicKey2 = key2.trim();

        rl.question('Enter the Address type (p2sh, p2wsh): ', (addrt) => {
            let addrtype;
            if (addrt === 'p2sh') {
                addrtype = '3'
            } else if (addrt === 'p2wsh') {
                addrtype = 'bc1q'
            }

            rl.question('Enter the number of threads: ', (threads) => {
                const maxCount = 1000000;
                const rangePerWorker = Math.ceil(maxCount / threads);
                

                // Ask for vanity pattern
                rl.question('Enter the vanity pattern: ', (vanityPattern) => {
                    const workers = [];
                    for (let i = 0; i < threads; i++) {
                        const start = i * rangePerWorker;
                        const end = start + rangePerWorker;
                        const worker = new Worker('./worker.js', {
                            workerData: {
                                start: start,
                                end: end,
                                publicKey1: publicKey1,
                                publicKey2: publicKey2,
                                addresstype: addrt,
                                vanityPattern: addrtype + vanityPattern.trim()
                            }
                        });

                        worker.on('message', (msg) => {
                            if (msg.found) {
                                console.log(`Vanity address found: ${msg.address} path ${msg.derivation}`);
                                workers.forEach(w => w.terminate());
                                process.exit();
                            }
                        });

                        worker.on('error', (err) => {
                            console.error(err);
                        });

                        worker.on('exit', (code) => {
                            if (code !== 0) console.error(`Worker stopped with exit code ${code}`);
                        });

                        workers.push(worker);
                    }
                    rl.close();
                });
            });
        });
    });
});
