import torrents from "torrent-stream";

export default function (source, opts) {
  const engine = torrents(source, opts);

  engine.on("ready", function () {
    engine.files.forEach(function (file) {
      file.select();
    });
  });

  return engine;
};
