#!/usr/bin/env node
'use strict';

const gm = require('gm');
const fs = require('fs');
const handlebars = require('handlebars');

const args = process.argv.slice(2);
const input = args[0] || 'cat.jpg';

function hexToRgb(hex) {
    var parts = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return [
        parseInt(parts[1], 16),
        parseInt(parts[2], 16),
        parseInt(parts[3], 16)
    ].join(', ');
}

const source = gm(input);

const dominant = new Promise((resolve, reject) => {
    source
        .colors(1)
        .toBuffer('RGB', (error, buffer) => {
            if (error) {
                reject(error);
            }
            resolve('#' + buffer.slice(0, 3).toString('hex'));
        });
});

const colors = new Promise((resolve, reject) => {
    source
        .resize(3, 3, '!')
        .toBuffer('RGB', (error, buffer) => {
            if (error) {
                reject(error);
            }
            const string = buffer.toString('hex');
            const colors = [];
            for (let i = 0; i < 9;) {
                colors.push(hexToRgb(string.slice(i * 6, ++i * 6)));
            }
            resolve(colors);
        });
});

Promise.all([dominant, colors])
    .then((values) => {
        fs.readFile('./gradients.hbs', 'utf-8', (error, content) => {
            let template = handlebars.compile(content);
            fs.writeFile('./gradients.html', template({
                image: input,
                dominant: values[0],
                colors: values[1]
            }));
        });
    });
