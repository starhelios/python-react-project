#!/bin/bash
rm -rf zenpix.zip
zip zenpix.zip -r ./* .[^.]* -x "*.zip" ".git**"
eb deploy --timeout 80
