let http = require('http'),
    fs = require('fs'),
    url = require('url')

module.exports = (_href, _filepath) => {
  // prepend 'http://' automatically if href doesn't start with it
  const hrefStartsWithHttp = _href.indexOf('http') !== 0
  const href = hrefStartsWithHttp ? ('http://' + _href) : _href
  const parsedURL = url.parse(href)

  // if filepath is not passed, generate a filename based on the url joined by '_' characters
  const filepath = _filepath || parsedURL.pathname.split('/').join('_')

  console.log('downloading', href, '...')
  http.get({
    host: parsedURL.host,
    path: parsedURL.pathname
  }, function(res) {
    let chunks = [];

    res.on('data', function(chunk) {
      chunks.push(chunk)
    })

    res.on('end', function() {
      const buffer = Buffer.concat(chunks)
      fs.writeFile(filepath, buffer, function(err) {
        if (err) throw err
        console.log('saved', filepath)
      })
    })

  })
}
