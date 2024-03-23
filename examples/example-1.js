const logger = require("../lib/index.js");

(async () => {
    const sleep = (ms) => new Promise(resolve => { setTimeout(resolve, ms); });
    const LOG = new logger.Logger({
        output: {
            file: {
                enabled: true
            }
        }
    });

    await sleep (5);
    LOG.log("Test 1");
    
    let resC;
    do {
        const [ x, y ] = LOG.close();
        console.log("CLOSE", x, y);
        resC = x;
    } while (!resC);
    
    LOG.log("Test 2");
    
    let resO;
    do {
        const [ x, y ] = LOG.open();
        console.log("OPEN", x, y);
        resO = x;
    } while (!resO);
    
    LOG.log("Test 3");
})()