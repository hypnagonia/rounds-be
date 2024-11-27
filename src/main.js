require("dotenv").config();
const { init: initApi } = require('./api/api');
const log4js = require("log4js");
const { logFilename } = require('./constants')
const { init: initScheduler } = require('./service/roundScheduler')
const { sendReward, getAward } = require('./service/roundV1Service')
const { ethers } = require("ethers")
const { saveRound } = require('./db/db')
log4js.configure({
    appenders: {
        console: { type: "console" },
        file: { type: "file", filename: logFilename },
    },
    categories: {
        default: { appenders: ["console", "file"], level: "info" },
    },
});

(async () => {
    initApi()
    initScheduler()
})()