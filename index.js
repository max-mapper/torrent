var torrents = require('torrent-stream')
const process = require('process');

module.exports = function (source, opts) {
    var engine     = torrents(source, opts)
    var selectFile = opts.select;

    engine.on('ready', function () {
        engine.files.forEach(function (file) {
            if (selectFile) {
                if (file.name && file.name === selectFile) {
                    process.stdout.write('Selecting ' + file.name + ' to download');
                    file.select();
                }
            } else {
                file.select();
            }
        })
    })

    return engine
}
