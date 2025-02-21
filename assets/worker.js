importScripts('wasm_exec.js'); // Load Go WASM runtime

const go = new Go();

onmessage = async (event) => {
  const { action } = event.data;

  if (action === "start") {
    try {
      await clearOPFS();
      const filename = "tiles.mbtiles";
      const accessHandle = await createOPFSFile(filename);
      postMessage("AccessHandle created.");

      go.argv = [
        "tilepack",
        "-dsn", `file:${filename}?vfs=opfs`,
        "-url-template", "https://tiles.openaerialmap.org/66e3bb93cd0baa0001b6210e/0/66e3bb93cd0baa0001b6210f/{z}/{x}/{y}",
        "-bounds", "5.547621,-0.223589,5.556166,-0.214256",
        "-zooms", "14",
        "-output-mode", "mbtiles",
        "-mbtiles-format", "png",
        "-ensure-gzip=false",
        "-tileset-name", "agbogloshie_drone",
      ];

      const response = await fetch("tilepack.wasm");
      const wasmModule = await WebAssembly.instantiateStreaming(response, go.importObject);
      await go.run(wasmModule.instance);

      postMessage("WASM execution completed.");

      // Read generated file from OPFS
      await accessHandle.flush();
      await accessHandle.close();
      await downloadFileFromOPFS(filename, 'tiles.mbtiles');

      postMessage("AccessHandle closed.");
    } catch (error) {
      postMessage(`Error: ${error.message}`);
    }
  }
};

async function clearOPFS() {
  postMessage("Clearing OPFS...");
  const root = await navigator.storage.getDirectory();
  for await (const entry of root.values()) {
    await root.removeEntry(entry.name, { recursive: true });
    postMessage(`Removed: ${entry.name}`);
  }
}

async function createOPFSFile(filename) {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(filename, { create: true });
    return await fileHandle.createSyncAccessHandle();
}

async function downloadFileFromOPFS(filename, downloadName) {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(filename);
    const file = await fileHandle.getFile();
    const url = URL.createObjectURL(file);

    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;
    a.click();

    URL.revokeObjectURL(url);
}
