import { WASI } from "@runno/wasi";

const result = WASI.start(fetch("/tilepack-wasi.wasm"), {
  // args: [
  //   "tilepack",
  //   "-dsn", "/test.mbtiles",
  //   "-url-template", "http://localhost:8080/proxy?url=http://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}",
  //   "-bounds", "-180,-90,180,90",
  //   "-zooms", "1-2",
  //   "-output-mode", "mbtiles",
  //   "-mbtiles-format", "jpg",
  //   "-ensure-gzip=false",
  //   "-tileset-name", "test",
  // ],
  args: [
    "tilepack",
    "-dsn", "root=/ format=jpg",
    "-url-template", "http://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}",
    "-bounds", "-180,-90,180,90",
    "-zooms", "1",
    "-output-mode", "disk",
  ],
  stdout: (out) => console.log("stdout", out),
  stderr: (err) => console.error("stderr", err),
  stdin: () => prompt("stdin:"),
});

// NOTE abandoned this implementation as the WASI runtime environment has
// no network access!! '53: write udp 127.0.0.1:8->[::1]:53: write: Connection reset by peer'