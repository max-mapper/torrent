#!/usr/bin/env node

var minimist = require('minimist')
var fs = require('fs')
var log = require('single-line-log').stdout
var bytes = require('pretty-bytes')

var pkg = require('./package.json')
var torrent = require('./')
var createTorrent = require('create-torrent')
var parseTorrent = require('parse-torrent')
var concat = require('concat-stream')
var humanSize = require('human-format')

var argv = minimist(process.argv.slice(2), {
  alias: { outfile: 'o' }
})

if (argv.version) {
  console.log(pkg.version)
  return;
}

if (argv.help || argv._.length === 0) {
  fs.createReadStream(__dirname + '/usage.txt').pipe(process.stdout)
  return
}

var source = argv._.shift()

if (source === 'create') {
  var dir = argv._.shift()
  var outfile = argv.outfile
  if (outfile === '-') outfile = null

  if (outfile && fs.existsSync(outfile)) {
    console.error('refusing to overwrite existing torrent file')
    process.exit(1)
  }

  createTorrent(dir, function (err, torrent) {
    if (err) {
      console.error(err.stack)
      process.exit(1)
    }
    else if (outfile) {
      fs.writeFile(outfile, torrent, function (err) {
        if (err) {
          console.error(err.stack)
          process.exit(1)
        }
      })
    }
    else process.stdout.write(torrent)
  })

  return
} else if (source === 'info') {
  var infile = argv._.shift()
  getInfo(infile, function (parsed) {
    delete parsed.infoBuffer
    delete parsed.info.pieces
    console.log(JSON.stringify(toString(parsed), null, 2))

    function toString (obj) {
      if (Array.isArray(obj)) {
        return obj.map(toString)
      } else if (Buffer.isBuffer(obj)) {
        return obj.toString('utf8')
      } else if (typeof obj === 'object') {
        return Object.keys(obj).reduce(function (acc, key) {
          acc[key] = toString(obj[key])
          return acc
        }, {})
      }
      else return obj
    }
  })
  return
} else if (source === 'ls' || source === 'list') {
  var infile = argv._.shift()
  getInfo(infile, function (parsed) {
    parsed.files.forEach(function (file) {
      var prefix = '';
      if (argv.s && argv.h) {
        prefix = humanSize(file.length).replace(/(\d)B$/, '$1 B')
        prefix = Array(10-prefix.length).join(' ') + prefix + ' '
      } else if (argv.s) {
        prefix = String(file.length)
        prefix = Array(10-prefix.length).join(' ') + prefix + ' '
      }
      console.log(prefix + file.path)
    })
  })
  return
}

function getInfo (infile, cb) {
  var instream = !infile || infile === '-'
    ? process.stdin
    : fs.createReadStream(infile)
  instream.pipe(concat(function (body) {
    try {
      var parsed = parseTorrent(body)
    } catch (err) {
      console.error(err.stack)
      process.exit(1)
    }
    cb(parsed)
  }))
}

if (source.indexOf('.torrent') > -1) source = fs.readFileSync(source)

if (!argv.path) argv.path = process.cwd()

var dl = torrent(source, argv)

dl.on('ready', function() {
  var fileCount = dl.files.length
  console.log(fileCount.toString(), (fileCount === 1 ? 'file' : 'files'), 'in torrent')
  console.log(dl.files.map(function(f){ return f.name.trim() }).join('\n'))

  var status = function() {
    var down = bytes(dl.swarm.downloaded)
    var downSpeed = bytes(dl.swarm.downloadSpeed()) +'/s'
    var up = bytes(dl.swarm.uploaded)
    var upSpeed = bytes(dl.swarm.uploadSpeed()) +'/s'

    log(
      'Connected to '+dl.swarm.wires.reduce(notChoked, 0)+'/'+dl.swarm.wires.length+' peers\n'+
      'Downloaded '+down+' ('+downSpeed+')\n'+
      'Uploaded '+up+ ' ('+upSpeed+')\n'
    )
  }

  var interval = setInterval(status, 500)
  status()
})

function notChoked(result, wire) {
  return result + (wire.peerChoking ? 0 : 1)
}

