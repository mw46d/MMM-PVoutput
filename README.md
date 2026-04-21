# MMM-PVoutput
PVOutput module for MagicMirror

```js
{
	module: 'MMM-PVoutput',
	position: 'lower_third',
	config: {
		sid: <Your pvoutput SystemID>,
		apiKey: "<Your pvoutput.org api Key>",
		width: 500,
		height: 300,
		lineWidth: 2,
		showConsumption: true,
		genLineColor: "#e0ffe0",
		genFillColor: "rgba(100, 200, 100, 0.2)",
		consLineColor: "#ffe0e0",
		consFillColor: "rgba(200, 100, 100, 0.2)",
		maxPower: 2500,
		updateInterval: 300000,
	}
}
```

# Heavily changed:

* Now using https://www.chartjs.org to create the chart
* Now using the `#http_fetcher` from the base to fetch the data

# An example graph from my sytem on a cloudy day

![Screenshot](PVoutput_screenshot.png "Screenshot")

* Green are the generated power & energy
* Blue are the 'used' power & energy. They include the charging of the
  battery. The power line is mostly hidden behind the 'generation power'
  until the battery is completely charged.
* Red are the actual usage power & eneregy of the home. They use
  extented data points for PVoutput, so they would only be available
  with a donation-account. I'm using v7 for the 'home power' and v12 for
  the 'home energy'.
