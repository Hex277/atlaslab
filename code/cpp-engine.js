/* AtlasLab Code — cpp-engine.js (main thread)
   cpp-worker.js ilə danışan kiçik adapter. problem-script.js bunu çağırır. */
(function (root) {
  'use strict';

  function create({ workerUrl, onStateChange, runTimeoutMs = 6000, compileTimeoutMs = 120000 }) {
    let worker = null;
    let state = 'idle';           // idle | loading | ready | error
    let readyPromise = null;
    let seq = 0;

    function setState(s) { state = s; if (onStateChange) onStateChange(s); }

    function killWorker() {
      if (worker) { worker.terminate(); worker = null; }
      readyPromise = null;
      setState('idle');
    }

    function warmUp() {
      if (state === 'ready' && worker) return Promise.resolve();
      if (state === 'loading' && readyPromise) return readyPromise;

      worker = new Worker(workerUrl);
      setState('loading');
      const w = worker;
      readyPromise = new Promise((resolve, reject) => {
        const onMsg = (ev) => {
          if (ev.data.type === 'ready') {
            w.removeEventListener('message', onMsg);
            setState('ready'); resolve();
          } else if (ev.data.type === 'init-error') {
            w.removeEventListener('message', onMsg);
            setState('error'); reject(new Error(ev.data.message));
          }
        };
        w.addEventListener('message', onMsg);
        w.addEventListener('error', (e) => { setState('error'); reject(new Error(e.message || 'worker xətası')); });
      });
      readyPromise.catch(() => {});
      w.postMessage({ type: 'warmup' });
      return readyPromise;
    }

    function fail(msg, extra) {
      return [Object.assign({ resultJson: null, output: '', errorLine: null, error: msg }, extra || {})];
    }

    async function runBatch({ userCode, problem, testCases }) {
      try {
        await warmUp();
      } catch (e) {
        killWorker();
        return fail('C++ mühiti yüklənmədi: ' + e.message);
      }
      return new Promise((resolve) => {
        const id = ++seq;
        const w = worker;
        let runTimer = null;
        const compileTimer = setTimeout(() => { killWorker(); finish(fail('Kompilyasiya çox uzun çəkdi.')); }, compileTimeoutMs);

        function finish(results) {
          clearTimeout(compileTimer); clearTimeout(runTimer);
          w.removeEventListener('message', onMsg);
          resolve(results);
        }
        function onMsg(ev) {
          const m = ev.data;
          if (m.id !== id) return;
          if (m.type === 'running') {
            clearTimeout(compileTimer);
            runTimer = setTimeout(() => {
              killWorker();
              finish(fail('Vaxt bitdi (Time Limit Exceeded) — mümkün sonsuz dövr. Kodunuzu yoxlayın.'));
            }, runTimeoutMs);
          } else if (m.type === 'result') {
            finish(m.results);
          }
        }
        w.addEventListener('message', onMsg);
        w.postMessage({
          type: 'run', id, userCode,
          problem: { class_name: problem.class_name, function_name: problem.function_name, params: problem.params, return_type: problem.return_type },
          testInputs: testCases.map(tc => tc.input_data || {}),
        });
      });
    }

    return { warmUp, runBatch, killWorker, get state() { return state; } };
  }

  root.AtlasCppEngine = { create };
})(typeof globalThis !== 'undefined' ? globalThis : self);