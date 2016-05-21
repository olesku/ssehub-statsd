#!/usr/bin/node

const config = {
  ssehubUrl:    process.env.SSEHUB_STATS_URL    || 'http://127.0.0.1/stats',
  statsdHost:   process.env.STATSD_HOST         || '127.0.0.1',
  statsdPort:   process.env.STATSD_PORT         || 8125,
  statsdPrefix: process.env.STATSD_PREFIX       || 'ssehub.',
  interval:     process.env.POLL_INTERVAL       || 10
}

var request = require('request');
var StatsD  = require('node-statsd');

var statsdClient = new StatsD({
  host: config.statsdHost,
  port: config.statsdPort,
  prefix: config.statsdPrefix
});

function submitData(id, obj) {
  Object.keys(obj).forEach(function(key) {
    if (key == 'uptime' || key == 'id') return;
    const metricKey = id + '.' + key;
    const metricVal = parseInt(obj[key]);
    
    if (metricVal == NaN) return;
    statsdClient.gauge(metricKey, metricVal);
    console.log(metricKey, ':', metricVal);
  });

  console.log();
}

function fetchData() {
    request(config.ssehubUrl, function(err, resp, body) {
      if (!err && resp.statusCode == 200) {
        const statsObj = JSON.parse(body);
        
        // Global stats. 
        submitData('global', statsObj.global);
        
        // Channel spesific stats.
        statsObj.channels.forEach(function(chan) {
          submitData(chan.id, chan);
        });
      }
    });

    setTimeout(fetchData, (config.interval * 1000));
}

fetchData();
