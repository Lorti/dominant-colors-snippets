var gm = require('gm');
var km = require('node-kmeans');

gm('cat.jpg')
    .resize(1, 1)
    .toBuffer('RGB', function (error, buffer) {
        console.log('resize() #' + buffer.slice(0, 3).toString('hex'));
    });

gm('cat.jpg')
    .colors(1)
    .toBuffer('RGB', function (error, buffer) {
        console.log('colors() #' + buffer.slice(0, 3).toString('hex'));
    });

gm('cat.jpg')
    .resize(5, 5, '!')
    .toBuffer('RGB', function (error, buffer) {
        var pixels = [];
        var pixel = [];

        for (var value of buffer.values()) {
            if (pixel.length >= 3) {
                pixels.push(pixel);
                pixel = [];
            }
            pixel.push(value);
        }

        km.clusterize(pixels, {k: 1}, function (err, res) {
            if (err) console.error(err);
            else {
                res.forEach(function (cluster) {
                    console.log('k-means() #' + cluster.centroid.map(val => Math.round(val).toString(16)).join(''));
                });
            }
        });
    });
