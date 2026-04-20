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
