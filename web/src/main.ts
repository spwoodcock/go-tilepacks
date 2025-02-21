import { createFS } from "./go-fs.ts";
import { process } from "./go-process.ts";
import { Go } from "./wasm_exec@1.23.4.ts";

const log = (msg: string): void => {
  const logEl = document.getElementById("log");
  if (logEl) logEl.textContent += `${msg}\n`;
};

export async function tilepack(): Promise<void> {
  log("Initializing filesystem...");
  const fs = await createFS();
  const go = new Go(fs, process);

  go.argv = [
    "tilepack",
    "-dsn", "/test.mbtiles",
    "-url-template", "http://localhost:8080/proxy?url=https://tiles.openaerialmap.org/66e3bb93cd0baa0001b6210e/0/66e3bb93cd0baa0001b6210f/{z}/{x}/{y}",
    "-bounds", "5.547621,-0.223589,5.556166,-0.214256",
    "-zooms", "14",
    "-output-mode", "mbtiles",
    "-mbtiles-format", "png",
    "-ensure-gzip=false",
    "-tileset-name", "test",
  ];

  log("Loading tilepack.wasm...");
  const response = await fetch(
    // Load from public dir
    new URL("/tilepack.wasm", import.meta.url).toString(),
  );
  const wasmModule = await WebAssembly.instantiateStreaming(
    response,
    go.importObject,
  );

  log("Running tilepack...");
  await go.run(wasmModule.instance);

  const mbtileData = await fs.open('/test.mbtiles');
  log(mbtileData)

  const { stdout, stderr } = fs.finalize();
  stderr ? log(`Error: ${stderr}`) : log(`Success: ${stdout}`);
}

// Invoke immediately
await tilepack();
