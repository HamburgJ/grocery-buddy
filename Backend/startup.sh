#!/bin/bash
cd /home/site/wwwroot/Backend
export PORT=8080
export NODE_ENV=production
npm install --production
node src/app.js 