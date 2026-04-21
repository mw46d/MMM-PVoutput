/* global Module */

/*
 * MagicMirror²
 * Module: MMM-PVoutput
 *
 * By Martin van Es
 * MIT Licensed.
 * Heavily changed by Marco Walther
 */

Module.register("MMM-PVoutput", {
  // Define module defaults
  defaults: {
    sid: null,
    apiKey: null,

    lineWidth: 1,
    pointRadius: 1,
    displayLegend: false,
    displayScales: false,
    showConsumption: true,
    extData: true,
    generationPowerLineColor: "#90ff90",
    generationEnergyFillColor: "rgba(100, 200, 100, 0.2)",
    consumptionPowerLineColor: "#9090ff",
    consumptionEnergyFillColor: "rgba(100, 100, 200, 0.2)",
    homePowerLineColor: "#ff9090",
    homeEnergyFillColor: "rgba(200, 100, 100, 0.2)",
    maxPower: 10000,
    // ── Size & position ──────────────────────────────────────────────────
    width: "400px", // e.g., '380px'
    height: "150px", // e.g., '220px'
    posRight: null, // CSS translateX
    posDown: null, // CSS translateY

    // ── Update & fetch behavior ──────────────────────────────────────────
    updateInterval: 5 * 60 * 1000, // Milliseconds between refreshes
    errorMessage: "Data could not be fetched.",
    loadingMessage: "Loading data...",
    customFont:
      "@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300&display=swap'); font-family: 'Roboto', sans-serif;", // e.g.  "@import url('https://fonts.googleapis.com/css2?family=Rubik:wght@300&display=swap'); font-family: 'Rubik', sans-serif;"
  },

  // Override start method.
  start: function () {
    Log.log(`Starting module: ${this.name}`);

    // add identifier to the config
    this.config.identifier = this.identifier;

    this.error = false;
    this.payload = false;

    this.sendSocketNotification("INIT_PVONLINE", {
      sid: this.config.sid,
      apiKey: this.config.apiKey,
      updateInterval: this.config.updateInterval,
      extData: this.config.extData,
    });
  },

  // Define required scripts.
  getScripts: function () {
    return [ this.file('node_modules/chart.js/dist/chart.umd.min.js') ];
  },

  // Override socket notification handler.
  socketNotificationReceived: function (notification, payload) {
    if (notification == "ERROR") {
      this.setError(`Data fetch issue: ${payload.error || "Unknown error"}`);
    } else if (notification == "NEW_PVONLINE_DATA") {
      this.error = false;
      this.payload = payload;
    } else {
      return;
    }
    this.updateDom();
  },

  setError: function (message) {
    this.error = true;
    this.payload = false;
    this.errorMessage = message || this.config.errorMessage;
    this.updateDom();
    setTimeout(() => this.scheduleUpdate(), 30 * 60 * 1000);
  },

  getDecimalPlaces: function () {
    const n = Number(this.config.yDecimals);
    if (!Number.isFinite(n)) {
      return 2;
    }
    return Math.max(0, Math.min(6, Math.trunc(n)));
  },

  // Override dom generator.
  getDom: function () {
    const wrapper = document.createElement("div");
    if (this.config.width) {
      wrapper.style.width = this.config.width;
      wrapper.style.transform = `translate(${this.config.posRight}, ${this.config.posDown})`;
    }
    if (this.config.height) {
      wrapper.style.height = this.config.height;
    }

    if (this.error) {
      wrapper.innerHTML = this.errorMessage || this.config.errorMessage;
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    if (!this.payload) {
      wrapper.innerHTML = this.config.loadingMessage;
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    // Guard: Chart.js not loaded yet
    if (typeof Chart === "undefined") {
      wrapper.innerHTML = "Loading chart library...";
      wrapper.className = "dimmed light small";
      setTimeout(() => this.updateDom(), 3000);
      return wrapper;
    }

    // --- Chart DOM ---
    const chart = document.createElement("div");
    chart.className = "small light";
    const canvas = document.createElement("canvas");
    canvas.id = "PVOnlineGraph";
    if (wrapper.style.width) {
      canvas.width = wrapper.style.width.replace(/px$/, "");
    }
    if (wrapper.style.height) {
      canvas.height = wrapper.style.height.replace(/px$/, "");
    }

    // Build chart (guarded)
    let myChart = null;

    try {
      datasets = [
        {
          borderColor: this.config.generationPowerLineColor,
          backgroundColor: this.config.generationPowerLineColor,
          cubicInterpolationMode: "monotone",
          label: "Generated Power",
          data: this.payload.generationPower,
          borderWidth: this.config.lineWidth,
          pointRadius: this.config.pointRadius,
          yAxisID: "yWaxis",
        },
        {
          borderColor: this.config.generationEnergyFillColor,
          backgroundColor: this.config.generationEnergyFillColor,
          fill: "origin",
          cubicInterpolationMode: "monotone",
          label: "Generated Energy",
          data: this.payload.generationEnergy,
          borderWidth: this.config.lineWidth,
          pointRadius: this.config.pointRadius,
          yAxisID: "yWhaxis",
        },
      ];

      if (this.config.showConsumption) {
        datasets.splice(1, 0, {
          borderColor: this.config.consumptionPowerLineColor,
          backgroundColor: this.config.consumptionPowerLineColor,
          cubicInterpolationMode: "monotone",
          label: "Consumed Power",
          data: this.payload.consumptionPower,
          borderWidth: this.config.lineWidth,
          pointRadius: this.config.pointRadius,
          yAxisID: "yWaxis",
        });
        datasets.push({
          borderColor: this.config.consumptionEnergyFillColor,
          backgroundColor: this.config.consumptionEnergyFillColor,
          fill: "origin",
          cubicInterpolationMode: "monotone",
          label: "Consumed Energy",
          data: this.payload.consumptionEnergy,
          borderWidth: this.config.lineWidth,
          pointRadius: this.config.pointRadius,
          yAxisID: "yWhaxis",
        });
      }
      if (this.config.extData) {
        datasets.splice(1, 0, {
          borderColor: this.config.homePowerLineColor,
          backgroundColor: this.config.homePowerLineColor,
          cubicInterpolationMode: "monotone",
          label: "Actual Home Power",
          data: this.payload.homePower,
          borderWidth: this.config.lineWidth,
          pointRadius: this.config.pointRadius,
          yAxisID: "yWaxis",
        });
        datasets.push({
          borderColor: this.config.homeEnergyFillColor,
          backgroundColor: this.config.homeEnergyFillColor,
          fill: "origin",
          cubicInterpolationMode: "monotone",
          label: "Actual Home Energy",
          data: this.payload.homeEnergy,
          borderWidth: this.config.lineWidth,
          pointRadius: this.config.pointRadius,
          yAxisID: "yWhaxis",
        });
      }
      myChart = new Chart(canvas, {
        type: "line",
        data: {
          labels: this.payload.timeStamps,
          datasets: datasets,
        },
        options: {
          plugins: {
            legend: {
              display: this.config.displayLegend,
            },
          },
          scales: {
            x: {
              display: false,
              grid: {
                display: this.config.displayScales,
              },
              ticks: {
                callback: function (value) {
                  const val = this.getLabelForValue(value);
                  const hh = parseInt(String(val).slice(0, 2), 10);
                  const mm = parseInt(String(val).slice(3, 3 + 2), 10);
                  if (mm == 0 && hh % 3 == 0) {
                    return val;
                  }
                  return "";
                },
              },
            },
            yWaxis: {
              display: this.config.displayScales,
              beginAtZero: true,
              grid: {
                display: false,
              },
              title: {
                align: "end",
                color: "red",
                display: true,
                text: "kW",
              },
            },
            yWhaxis: {
              display: this.config.displayScales,
              position: "right",
              beginAtZero: true,
              grid: {
                display: false,
              },
              title: {
                align: "end",
                color: "red",
                display: true,
                text: "kWh",
              },
            },
          },
        },
      });
    } catch (err) {
      console.error("Chart init failed, retrying:", err);
      wrapper.innerHTML = "Initializing chart…";
      wrapper.className = "dimmed light small";
      setTimeout(() => this.updateDom(), 1500);
      return wrapper;
    }

    myChart.update("none");

    chart.appendChild(canvas);
    wrapper.appendChild(chart);
    return wrapper;
  },
});
