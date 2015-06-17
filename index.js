var torrents = require('torrent-stream')

module.exports = function (source, opts) {
  var engine = torrents(source, opts)

  engine.on('ready', function () {
    engine.files.forEach(function (file) {
      file.select()
    })
  })

  return engine
}
