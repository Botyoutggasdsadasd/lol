#!/bin/bash
nohup python bot.py > /dev/null 2>&1 &
disown
npm start
