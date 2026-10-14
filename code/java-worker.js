/* AtlasLab Code — java-worker.js
   Web Worker: CheerpJ (JIT-based WASM JVM) + ECJ ilə Java kompilyasiya + icra.
   Protokol cpp-worker.js ilə EYNİDİR (AtlasCppEngine hər ikisini idarə edə bilir):
     { type: 'warmup' }                     -> { type: 'ready' } | { type: 'init-error', message }
     { type: 'run', id, userCode, problem, testInputs }
       -> (kompilyasiya bitəndə)  { type: 'running', id }
       -> (son)                   { type: 'result', id, results }
   Fayllar eyni qovluqda olmalıdır: java-driver.js, ecj.jar.
   ECJ_PATH bu worker faylının öz yerləşdiyi qovluğa görə avtomatik hesablanır. */
importScripts('java-driver.js');
importScripts('https://cjrtnc.leaningtech.com/4.3/loader.js');

const WORKER_DIR = self.location.pathname.replace(/[^/]*$/, '');
const ECJ_PATH = '/app' + WORKER_DIR + 'ecj.jar';
const ECJ_MAIN = 'org.eclipse.jdt.internal.compiler.batch.Main';

let initPromise = null;
function init() {
  if (!initPromise) initPromise = cheerpjInit();
  return initPromise;
}

async function readTextFile(path) {
  const blob = await cjFileBlob(path);
  return blob.text();
}

async function compileAndRun(userCode, problem, testInputs, onRunning) {
  await init();

  const source = AtlasJava.buildJavaSource(userCode, problem);
  const stdin = AtlasJava.buildStdin(testInputs, problem.params || []);
  cheerpOSAddStringFile('/str/Main.java', source);
  cheerpOSAddStringFile('/str/in.txt', stdin);

  const compileExit = await cheerpjRunMain(ECJ_MAIN, ECJ_PATH,
    '-1.8', '-nowarn', '-d', '/files', '-log', '/files/ecj.log', '/str/Main.java');

  if (compileExit !== 0) {
    let log = '';
    try { log = await readTextFile('/files/ecj.log'); } catch (e) { /* log yoxdursa aşağıda ümumi mesajla gedir */ }
    const userLines = AtlasJava.countUserLines(userCode);
    const parsed = log ? AtlasJava.parseEcjLog(log, userLines) : { text: null, errorLine: null };
    return [{
      resultJson: null, output: '', compileError: true,
      error: parsed.text || `ECJ exit kodu ${compileExit} (log oxunmadı).`,
      errorLine: parsed.errorLine,
    }];
  }

  if (onRunning) onRunning();

  const runExit = await cheerpjRunMain('Main', '/files', '/str/in.txt', '/files/out.txt');

  let outText = '';
  try { outText = await readTextFile('/files/out.txt'); } catch (e) { /* aşağıda fallback mesajla əvəzlənir */ }

  const fallback = runExit === 0
    ? 'Proqram gözlənilmədən dayandı (nəticə faylı yazılmadı).'
    : `Proqram ${runExit} kodu ilə dayandı (System.exit və ya JVM qəzası).`;

  return AtlasJava.interpretOutput(outText, testInputs.length, fallback);
}

self.onmessage = async (ev) => {
  const m = ev.data;

  if (m.type === 'warmup') {
    try {
      await init();
      postMessage({ type: 'ready' });
    } catch (e) {
      postMessage({ type: 'init-error', message: String((e && e.message) || e) });
    }
    return;
  }

  if (m.type === 'run') {
    try {
      const results = await compileAndRun(
        m.userCode, m.problem, m.testInputs,
        () => postMessage({ type: 'running', id: m.id })
      );
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