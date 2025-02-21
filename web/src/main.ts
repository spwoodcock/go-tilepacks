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
    "-dsn", "root=/destdir format=jpg",
    "-url-template", "http://localhost:8080/proxy?url=http://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}",
    "-bounds", "-180,-90,180,90",
    "-zooms", "1",
    "-output-mode", "disk",
  ],

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
