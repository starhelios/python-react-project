#!/usr/bin/env bash
cd /home/ubuntu/annotations
echo "Starting deployment.."
git pull
npm install
echo "Running webpack"
webpack --production
echo "Killing python..."
sudo killall python
echo "Running python..."
nohup python run.py > /dev/null 2>&1 &
echo "Done." >> remote.log
