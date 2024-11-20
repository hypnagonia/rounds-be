require("dotenv").config();
const {init} = require('./api');
const log4js = require("log4js");

log4js.configure({
    appenders: {
        console: { type: "console" },
        file: { type: "file", filename: "app.log" },
    },
    categories: {
        default: { appenders: ["console", "file"], level: "info" },
    },
});

init()