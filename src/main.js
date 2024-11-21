require("dotenv").config();
const { init } = require('./api');
const log4js = require("log4js");
const { logFilename } = require('./constants')

log4js.configure({
    appenders: {
        console: { type: "console" },
        file: { type: "file", filename: logFilename },
    },
    categories: {
        default: { appenders: ["console", "file"], level: "info" },
    },
});

init()