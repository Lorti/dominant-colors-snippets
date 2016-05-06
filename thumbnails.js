#!/usr/bin/env node
'use strict';

const gm = require('gm');
const fs = require('fs');
const handlebars = require('handlebars');

const files = ['cat.jpg', 'snake.jpg', 'bird.jpg'];
let promises = [];

files.forEach(path => {
    promises.push(new Promise((resolve, reject) => {
        let width, height;
        gm(path)
            .size((error, size) => {
                width = size.width;
                height = size.height;
            })
            .resize(3, 3, '!')
            .toBuffer('GIF', (error, buffer) => {
                resolve({
                    original: path,
                    thumbnail: 'data:image/gif;base64,' + buffer.toString('base64'),
                    padding: (height / width) * 100
                });
            });
    }));
});

Promise.all(promises)
    .then(values => {
        fs.readFile('./thumbnails.hbs', 'utf-8', (error, content) => {
            let template = handlebars.compile(content);
            fs.writeFile('./thumbnails.html', template({ images: values }));
        });
    });
