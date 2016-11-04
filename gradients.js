#!/usr/bin/env node
'use strict';

const gm = require('gm');
const fs = require('fs');
const handlebars = require('handlebars');

const args = process.argv.slice(2);
const input = args[0] || 'cat.jpg';

const source = gm(input);

function luma(r, g, b) {
    return .299 * r + .587 * g + .114 * b;
}

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
            const values = new Uint8Array(buffer);
            const colors = [];
            for (let i = 0; i < 9;) {
                colors.push(values.slice(i * 3, ++i * 3));
            }
            // console.log(luma(...colors[3]));
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
