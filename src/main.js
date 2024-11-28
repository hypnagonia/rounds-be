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


/*
[725, 2025, 2148, 18138, 321969, 375699, 5179, 534, 602, 234616, 1626, 1725, 15549, 4013, 6714, 692285, 8446, 249332, 305716, 3635, 7715, 15838, 426045, 253127, 307834, 8332, 453640, 7791, 5173, 270138, 9166, 8080, 479, 374498, 281676, 337018, 274563, 380950, 6373, 8447, 12626, 11599, 17866, 318447, 535389, 539, 196957, 3, 514366, 423040, 441956, 616, 349331, 553423, 403507, 330083, 191503, 422233, 195117, 323501, 11782, 332502, 4479, 476679, 478906, 333524, 461302, 239748, 324781, 308410, 671554, 398596, 10095, 13874, 350139, 403619, 516495, 375831, 430484, 201299, 489156, 498134, 407704, 268833, 501701, 484444, 534280, 428725, 481476, 502822, 269141, 431233, 4567, 243719, 419748, 277454, 288579, 641489, 304465, 390737]
*/

(async () => {
    initApi()
    initScheduler()
})()