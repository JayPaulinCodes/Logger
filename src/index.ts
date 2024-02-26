import { Logger } from "./classes/Logger";

(async () => {
    const LOGGER = new Logger({
        logPrefixFormat: "[hh:MM:ss.l Z] "
    });
    await LOGGER.awaitInit();
    LOGGER.debug("test");
    LOGGER.log("test");
    LOGGER.warn("test");
    LOGGER.error("test");
})()