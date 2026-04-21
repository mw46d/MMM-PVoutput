/*
 * MagicMirror²
 * Node Helper: MMM-PVoutput
 *
 * By Martin van Es
 * MIT Licensed.
 * Heavily changed by Marco Walther
 */

const NodeHelper = require("node_helper");
const HTTPFetcher = require("#http_fetcher");
const Log = require("logger");

module.exports = NodeHelper.create({
  // Override start method.
  start: function () {
    this.fetcher = null;
    this.onDataCallback = null;
    this.onErrorCallback = null;
    this.extData = false;

    Log.info(`Starting node helper for: ${this.name}`);
  },

  // Override socketNotificationReceived method.
  socketNotificationReceived: function (notification, payload) {
    if (notification === "INIT_PVONLINE") {
      this.initPvOnline(payload);
    }
  },

  initPvOnline: function (payload) {
    let url = "http://pvoutput.org/service/r2/getstatus.jsp";
    url += "?h=1";
    url += "&asc=1";
    url += "&limit=288";

    if (payload.extData) {
      this.extData = true;
      url += "&ext=1";
    }

    this.fetcher = new HTTPFetcher(url, {
      reloadInterval: payload.updateInterval,
      headers: {
        "X-Pvoutput-SystemId": payload.sid,
        "X-Pvoutput-Apikey": payload.apiKey,
      },
      logContext: "MMM-PVoutput",
    });

    this.fetcher.on("response", async (response) => {
      try {
        const body = await response.text();
        const processed = this.processData(body, this);
        if (this.onDataCallback) {
          this.onDataCallback(processed);
        }
      } catch (error) {
        Log.error("[MMM-PVoutput] Failed to handle response: ", error);
      }
    });

    this.fetcher.on("error", (errorInfo) => {
      // HTTPFetcher already logged the error with logContext
      if (this.onErrorCallback) {
        this.onErrorCallback(errorInfo);
      }
    });

    this.fetcher.startPeriodicFetch();
  },

  processData: function (body, self) {
    const generationPower = [];
    const generationEnergy = [];
    const consumptionPower = [];
    const consumptionEnergy = [];
    const homePower = [];
    const homeEnergy = [];
    const timeStamps = [];
    let curGenerationPower = 0;
    let curGenerationEnergy = 0;
    let curConsumptionPower = 0;
    let curConsumptionEnergy = 0;
    let curHomePower = 0;
    let curHomeEnergy = 0;

    const lines = body.split(";");
    // 20260420,12:15,8547,1.221,2157,2160,0.309,8572,2157,0.0,248.0,697.270,NaN,NaN,NaN,NaN,7120.072
    //    0 - date
    //           1 - time
    //                 2 - Gen Energy (Wh)
    //                       3 - Efficiency (kWh/kw)
    //                            4 - Gen Power (W)
    //                                 5 - Average (Wh)
    //                                       6 - ?
    //                                           7 - Used Energy (Wh)
    //                                                8 - Used Power (W)
    //                                                     9 - Temp (C)
    //                                                         10 - Voltage (V)
    //                                                                11 (v7) - House Power (W)
    //                                                                                         16 (v12) - House Energy (Wh)

    for (let i = 0; i < lines.length; i++) {
      const values = lines[i].split(",");
      curGenerationEnergy = (values[2] == "NaN" ? 0 : values[2]) / 1000.0;
      curGenerationPower = (values[4] == "NaN" ? 0 : values[4]) / 1000.0;
      curConsumptionEnergy = (values[7] == "NaN" ? 0 : values[7]) / 1000.0;
      curConsumptionPower = (values[8] == "NaN" ? 0 : values[8]) / 1000.0;
      if (self.extData) {
        curHomePower = (values[11] == "NaN" ? 0 : values[11]) / 1000.0;
        curHomeEnergy = (values[16] == "NaN" ? 0 : values[16]) / 1000.0;
      } else {
        curHomePower = 0;
        curHomeEnergy = 0;
      }

      generationPower.push(curGenerationPower);
      generationEnergy.push(curGenerationEnergy);
      consumptionPower.push(curConsumptionPower);
      consumptionEnergy.push(curConsumptionEnergy);
      homePower.push(curHomePower);
      homeEnergy.push(curHomeEnergy);
      timeStamps.push(values[1]);
    }

    self.sendSocketNotification("NEW_PVONLINE_DATA", {
      generationPower: generationPower,
      generationEnergy: generationEnergy,
      consumptionPower: consumptionPower,
      consumptionEnergy: consumptionEnergy,
      homePower: homePower,
      homeEnergy: homeEnergy,
      timeStamps: timeStamps,
      curGenerationPower: curGenerationPower,
      curGenerationEnergy: curGenerationEnergy,
      curConsumptionPower: curConsumptionPower,
      curConsumptionEnergy: curConsumptionEnergy,
      curHomePower: curHomePower,
      curHomeEnergy: curHomeEnergy,
    });
  },
});
