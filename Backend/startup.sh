#!/bin/bash
cd /home/site/wwwroot
export PORT=8080
export NODE_ENV=production
npm install --production
node src/app.js 