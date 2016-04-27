#!/usr/bin/env node
'use strict';

const gm = require('gm');
const km = require('node-kmeans');

const args = process.argv.slice(2);
const input = args[0] || 'cat.jpg';
const output = args[1] || 'differences.png';

const resize = new Promise((resolve, reject) => {
    gm(input)
        .resize(1, 1)
        .toBuffer('RGB', (error, buffer) => {
            if (error) reject(error);
            resolve({
                name: 'resize',
                color: '#' + buffer.slice(0, 3).toString('hex')
            });
        });
});

const colors = new Promise((resolve, reject) => {
    gm(input)
        .colors(1)
        .toBuffer('RGB', (error, buffer) => {
            if (error) reject(error);
            resolve({
                name: 'colors',
                color: '#' + buffer.slice(0, 3).toString('hex')
            });
        });
});

const kmeans = new Promise((resolve, reject) => {
    gm(input)
        .toBuffer('RGB', function (error, buffer) {
            if (error) reject(error);

            let pixels = [];
            let pixel = [];

            for (let value of buffer.values()) {
                if (pixel.length >= 3) {
                    pixels.push(pixel);
                    pixel = [];
                }
                pixel.push(value);
            }

            km.clusterize(pixels, {k: 1}, function (error, result) {
                if (error) reject(error);
                else {
                    result.forEach(function (cluster) {
                        resolve({
                            name: 'k-means',
                            color: '#' + cluster.centroid.map(value => Math.round(value).toString(16)).join('')
                        });
                    });
                }
            });
        });
});

Promise.all([resize, colors, kmeans])
    .then(values => {
        console.log(values);
        let image = gm(300, 100, '#fff');
        for (let i = 0; i < values.length; i++) {
            image.fill(values[i].color)
                .drawRectangle(100 * i, 0, 100 * (i + 1), 100);

        }
        image.write(output, (error) => {
            if (error) console.log(error);
            gm(output)
                .composite('overlay.png')
                .write(output, (error) => {
                    if (error) console.log(error);
                });
            });
    });
