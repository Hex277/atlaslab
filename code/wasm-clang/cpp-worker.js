/* AtlasLab Code — cpp-worker.js
   Web Worker: wasm-clang ilə C++ kompilyasiya + icra. Main thread-i dondurmur.
   Fayllar eyni qovluqda olmalıdır: shared.js, cpp-core.js, clang.wasm, lld.wasm, memfs.wasm, sysroot.tar */
importScripts('shared.js', 'cpp-core.js');

async function fetchOk(name) {
  const resp = await fetch(name);
  if (!resp.ok) throw new Error(`${name} yüklənmədi (HTTP ${resp.status})`);
  return resp;
}

const runner = AtlasCpp.createCppRunner({
  clang: 'clang.wasm',
  lld: 'lld.wasm',
  memfs: 'memfs.wasm',
  sysroot: 'sysroot.tar',
  async readBuffer(name) { return (await fetchOk(name)).arrayBuffer(); },
  async compileStreaming(name) {
    const resp = await fetchOk(name);
    const type = resp.headers.get('content-type') || '';
    if (WebAssembly.compileStreaming && type.includes('application/wasm')) {
      return WebAssembly.compileStreaming(resp);
    }
    return WebAssembly.compile(await resp.arrayBuffer());
  },
});

self.onmessage = async (ev) => {
  const m = ev.data;
  if (m.type === 'warmup') {
    try {
      await runner.warmup();
      postMessage({ type: 'ready' });
    } catch (e) {
      postMessage({ type: 'init-error', message: String((e && e.message) || e) });
    }
    return;
  }
  if (m.type === 'run') {
    try {
      const results = await AtlasCpp.runBatch(runner, {
        userCode: m.userCode,
        problem: m.problem,
        testInputs: m.testInputs,
        onRunning: () => postMessage({ type: 'running', id: m.id }),
      });
      postMessage({ type: 'result', id: m.id, results });
    } catch (e) {
      postMessage({
        type: 'result', id: m.id,
        results: [{ resultJson: null, output: '', errorLine: null,
                    error: 'Mühərrik xətası: ' + String((e && e.message) || e) }],
      });
    }
  }
};