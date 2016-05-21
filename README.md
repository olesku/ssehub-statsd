# ssehub-statsd

Collects metrics from SSEHub stats endpoint and sends them to StatsD.

## Installing
npm install

# Running
node app.js

## Environment variales

* `SSEHUB_STATS_URL` - URL to poll for stats.
* `STATSD_HOST` - Host that StatsD is running on.
* `STATSD_Port` - Port that StatsD is running on.
* `STATSD_PREFIX` - Metric prefix in StatsD.
* `POLL_INTERVAL` - How often to poll for statistics.
