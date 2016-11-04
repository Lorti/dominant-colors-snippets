#!/usr/bin/env node
'use strict';

const gm = require('gm');
const fs = require('fs');
const handlebars = require('handlebars');

const args = process.argv.slice(2);
const input = args[0] || 'space.jpg';
const x = parseInt(args[1], 10) || 3;
const y = parseInt(args[2], 10) || 3;

const source = gm(input);

function luma(r, g, b) {
    return .299 * r + .587 * g + .114 * b;
}

function round(value) {
    return Math.round(value * 1000) / 10;
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
        .resize(x, y, '!')
        .toBuffer('RGB', (error, buffer) => {
            if (error) {
                reject(error);
            }
            const values = new Uint8Array(buffer);
            const colors = [];
            for (let i = 0; i < x * y; i++) {
                colors.push(values.slice(i * 3, (i + 1) * 3));
            }
            resolve(colors);
        });
});

function gradients(colors, width, height) {
    let rgb, x, y;
    const innerRadius = .5 / Math.max(width, height);
    const outerRadius = Math.sqrt(2 * Math.pow(1 / Math.max(width, height), 2));
    const gradients = [];

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            rgb = colors[row * width + col].join(', ');
            x = (1 / width) * col + .5 / width;
            y = (1 / height) * row + .5 / height;
            gradients.push({
                luma: luma(...colors[row * width + col]),
                gradient: `radial-gradient(ellipse at ${round(x)}% ${round(y)}%, rgba(${rgb}, 1) ${round(innerRadius)}%, rgba(${rgb}, 0) ${round(outerRadius)}%)`
            });
        }
    }

    gradients.sort((a, b) => {
        return b.luma - a.luma;
    });

    return gradients.map(obj => obj.gradient);
}

Promise.all([dominant, colors])
    .then((values) => {
        fs.readFile('./gradients.hbs', 'utf-8', (error, content) => {
            let template = handlebars.compile(content);
            fs.writeFile('./gradients.html', template({
                image: input,
                dominant: values[0],
                gradients: gradients(values[1], x, y).join(',')
            }));
        });
    });
