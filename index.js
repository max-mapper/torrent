var fs = require('fs');
var torrents = require('torrent-stream');
var path = require('path');

module.exports = function (source, opts) {
  "use strict";
  var engine = torrents(source, opts);

  engine.on('ready', function () {
    engine.files.forEach(function(file) {
      file.select();
    });
  });

  return engine;
};
