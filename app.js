#!/usr/bin/node

var Promise = require('bluebird');
var request = require('request-promise');
var StatsD  = require('node-statsd');

var config = {
  ssehubUrls:   (process.env.SSEHUB_STATS_URLS   || '').split(','),
  statsdHost:   (process.env.STATSD_HOST         || '127.0.0.1'),
  statsdPort:   (process.env.STATSD_PORT         || 8125),
  statsdPrefix: (process.env.STATSD_PREFIX       || 'ssehub'),
  interval:     (process.env.POLL_INTERVAL       || 10)
}

console.log('Starting up with config:');
console.log(JSON.stringify(config));
console.log();

var statsdClient = new StatsD({
  host: config.statsdHost,
  port: config.statsdPort,
  prefix: config.statsdPrefix
});

function submitData(id, obj) {
  Object.keys(obj).forEach(function(key) {
    if (key == 'uptime' || key == 'id') return;
    var metricKey = id + '.' + key;
    var metricVal = parseInt(obj[key], 10);

    if (metricVal == NaN) return;
    console.log(metricKey, ':', metricVal);
  });

  console.log();
}

function mergeStats(target, source) {
    Object.keys(source).forEach(function(key) {
        if (key === 'uptime' || key === 'id') {
            return;
        } else {
            var val = parseInt(source[key], 10);

            if (val == NaN) {
                return;
            }

            if (!target[key]) {
                target[key] = 0;
            }

            target[key] += val;
        }
    });
}

function fetchData() {
    var data = {
        global: {},
        channels: {}
    }

    Promise.each(config.ssehubUrls, function(url) {
        return request(url).then(function(body) {
            var statsObj;
            try {
                statsObj = JSON.parse(body);
            } catch(err) {
                var msg = err.message ? err.message : err;
                console.error('Unable to parse stats object from %s: %s', url, msg);
            }

            if (!statsObj) {
                return;
            }
            // Global stats.
            mergeStats(data.global, statsObj.global);

            // Channel spesific stats.
            statsObj.channels.forEach(function(chan) {
                if (!data.channels[chan.id]) {
                    data.channels[chan.id] = {};
                }
                mergeStats(data.channels[chan.id], chan);
            });
        }).catch(function(err) {
            var msg = err.message ? err.message : err;
            console.error('Error fetching data from %s: %s', url, msg);
        });
    }).then(function() {
        // Global stats.
        submitData('global', data.global);

        // Channel spesific stats.
        Object.keys(data.channels).forEach(function(id) {
          submitData(id, data.channels[id]);
        });
    });

    setTimeout(fetchData, (config.interval * 1000));
}

fetchData();