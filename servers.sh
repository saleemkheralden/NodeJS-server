#!/bin/bash
peerjs --port 3002 &
node streaming.js &
node home.js &
jobs -l
wait
trap "kill 0" EXIT

