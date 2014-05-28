#!/usr/bin/env node

var minimist = require('minimist')
var log = require('single-line-log').stdout
var bytes = require('pretty-bytes')

var torrent = require('./')

var argv = minimist(process.argv.slice(2))

var source = argv._[0]

if (!argv.path) argv.path = process.cwd()

var dl = torrent(source, argv)

var status = function() {
  var down = bytes(dl.swarm.downloaded)
  var downSpeed = bytes(dl.swarm.downloadSpeed()) +'/s'
  var up = bytes(dl.swarm.uploaded)
  var upSpeed = bytes(dl.swarm.uploadSpeed()) +'/s'

  log(
    'Connected to '+dl.swarm.wires.reduce(notChoked, 0)+'/'+dl.swarm.wires.length+' peers\n'+
    'Downloaded '+down+' ('+downSpeed+') with '+hs+' hotswaps\n'+
    'Uploaded '+up+ ' ('+upSpeed+')\n'
  )
}

var hs = 0

dl.on('hotswap', function() {
  hs++
})

function notChoked(result, wire) {
  return result + (wire.peerChoking ? 0 : 1)
}

var interval = setInterval(status, 500)
status()