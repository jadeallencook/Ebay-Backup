# download-image
Library with simple API to download an image from a URL to a desired location

## Installation
```bash
npm install --save-dev download-image
```

## Usage
```js
let downloadImage = require('download-image')
downloadImage('http://lorempixel.com/g/400/200/', `./image.jpg`)
downloadImage('lorempixel.com/g/400/200/', `./image2.jpg`)
```
