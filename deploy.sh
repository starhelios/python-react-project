#!/bin/bash
rm -rf zenpix.zip
zip zenpix.zip -r ./* .[^.]* -x "*.zip" ".git**" "node_modules/*" ".env" "mathpix-markdown"
eb deploy --timeout 80
