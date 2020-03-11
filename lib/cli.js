#!/usr/bin/env node
const spawn = require('child_process').spawn;

console.log('CLI test!');
const child = spawn('npm init');

child.stdout.on('data', data => {
    process.stdout.write(data);
});

child.stderr.on('data', data => {
    process.stdout.write(data);
});

child.on('exit', data => {
    process.stdout.write('I\'m done!');
});

child.on('error', data => {
    process.stdout.write('error: ' + data);
});
