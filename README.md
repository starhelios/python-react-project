# Tutorial (Ubuntu)

## Submodules

This repo depends on two other repos which are submodules:

https://github.com/Mathpix/annotorious
https://github.com/Mathpix/mathpix-markdown

To clone the repo with all submodules, do:

```
git clone --recurse-submodules git@github.com:Mathpix/zenpix.git
```

## Annotorious build (optional)

Annotorious (http://annotorious.github.io/getting-started.html) is a library we use to annotate images with boxes.
This data is used to train our machine learning algorithms.
The built annotorious files are available at `static/annotorious.min.js` and `static/annotorious.css`.  The built files are bundled as part of the repo, so you don't need to worry about building annotorious unless you want to make edits to the source code.

To build these files, you must follow the instructions in `annotorious/README.md`:

```
cd annotorious
java -jar plovr/plovr.jar build standalone.json > ../static/annotorious.min.js
```

To make the built files easier to edit and understand, you can edit `annotorious/standalone.json` options, for example:

```
{
  "id": "annotorious",
  "define": {
    "goog.DEBUG": true,
    "goog.dom.ASSUME_STANDARDS_MODE": true
  },
  "inputs": [
    "src/annotorious.js",
    "src/api.js"           // exports JS API and sets up the plugin namespace
  ],
  "paths": [
    "src",
    "templates"
  ],
  "externs": [
    "externs/api.externs.js",
    "externs/openlayers.externs.js",
    "externs/openseadragon.externs.js",
    "externs/jquery.externs.js",
    "//json.js",
    "//webkit_console.js"
  ],
  "mode": "ADVANCED",      // "RAW" or "ADVANCED"
  "level": "VERBOSE",      // "DEFAULT" or "VERBOSE"
  "pretty-print": true,
  "debug": true
}
```

and then rerun 

```
java -jar plovr/plovr.jar build standalone.json > ../static/annotorious.min.js
```

## Setup 

Install Postgresql via:
```
$ sudo apt-get install python-psycopg2
```

Install redis via:
```
sudo apt-get install redis-server
```

```
$ sudo apt-get install python-psycopg2
```

Install nodejs via
```
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install nodejs
sudo apt-get install npm
```


Install dependencies:
```
$ sudo pip install -r requirements.txt
```

To create entries for the work queue:
```
$ ./import_redis.py
```

Install javascript modules:
```
$ npm install
```

Compile javascript files:
```
$ webpack --production
```

Run Flask app:
```
$ ./run.py
```

This will run the app on port 8000.  You can view the website in your web browser by navigating to: http://0.0.0.0:8000/

In production, the instance receives traffic from the AWS ELB which the `mymathpix.com` domain points to.
