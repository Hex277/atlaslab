/* ================================================
   AtlasLab Code — cpp-core.js
   C++ (wasm-clang) üçün: sürücü kodu generatoru, nəticə parser-i, icra mühərriki
   Worker-də də, Node testlərində də eyni fayl işləyir (DOM-dan asılı deyil).
   Əsas: binji/wasm-clang (Apache-2.0) — shared.js içindəki global `API` sinfi.
   ================================================ */
(function (root) {
  'use strict';

  const USER_FILE = 'user_code.cpp';
  const DRIVER_FILE = 'atlas_driver.cpp';
  const RESULT_MARK = '@@ATLAS_RESULT@@';
  const END_MARK = '@@ATLAS_END@@\n';

  // ── Tip xəritəsi (admin panelindəki tiplər) ──────────────────
  function cppTypeOf(t) {
    const map = { int: 'int', float: 'double', str: 'std::string', bool: 'bool' };
    if (map[t]) return map[t];
    const m = /^List\[(.+)\]$/.exec(t || '');
    if (m) return `std::vector<${cppTypeOf(m[1])}>`;
    throw new Error(`Dəstəklənməyən tip: ${t}`);
  }

  // ── İstifadəçi kodunu təmizlə (sətr sayını dəyişmədən) ───────
  function sanitizeUserCode(code) {
    let c = String(code).replace(/\r\n?/g, '\n');
    c = c.replace(/^[ \t]*#[ \t]*include[ \t]*[<"]bits\/stdc\+\+\.h[>"].*$/gm,
      '// (bits/stdc++.h avtomatik təmin olunur)');
    if (!c.endsWith('\n')) c += '\n';
    return c;
  }

  const PRELUDE = [
    'algorithm', 'array', 'bitset', 'cassert', 'climits', 'cmath', 'cstdio', 'cstdlib',
    'cstring', 'deque', 'functional', 'iostream', 'iterator', 'list', 'map', 'numeric',
    'queue', 'set', 'sstream', 'stack', 'string', 'tuple', 'type_traits', 'unordered_map',
    'unordered_set', 'utility', 'vector',
  ].map(h => `#include <${h}>`).join('\n') + '\nusing namespace std;\n';

  const DRIVER_HELPERS = String.raw`
namespace atlas_driver {

struct Reader {
  std::string s;
  size_t p;
  Reader(const std::string& str) : s(str), p(0) {}
  void ws() { while (p < s.size() && (s[p] == ' ' || s[p] == '\n' || s[p] == '\r' || s[p] == '\t')) ++p; }
  bool eat(char c) { ws(); if (p < s.size() && s[p] == c) { ++p; return true; } return false; }
  void fail(const char* m) { fprintf(stderr, "[atlas] input parse error: %s\n", m); abort(); }
};

inline void readValue(Reader& r, double& v) {
  r.ws();
  const char* b = r.s.c_str() + r.p;
  char* e = nullptr;
  v = strtod(b, &e);
  if (e == b) r.fail("number expected");
  r.p += (size_t)(e - b);
}
inline void readValue(Reader& r, int& v) { double d = 0; readValue(r, d); v = (int)d; }
inline void readValue(Reader& r, bool& v) {
  r.ws();
  if (r.s.compare(r.p, 4, "true") == 0) { v = true; r.p += 4; }
  else if (r.s.compare(r.p, 5, "false") == 0) { v = false; r.p += 5; }
  else r.fail("bool expected");
}
inline void appendUtf8(std::string& o, unsigned cp) {
  if (cp < 0x80) o += (char)cp;
  else if (cp < 0x800) { o += (char)(0xC0 | (cp >> 6)); o += (char)(0x80 | (cp & 0x3F)); }
  else { o += (char)(0xE0 | (cp >> 12)); o += (char)(0x80 | ((cp >> 6) & 0x3F)); o += (char)(0x80 | (cp & 0x3F)); }
}
inline void readValue(Reader& r, std::string& v) {
  if (!r.eat('"')) r.fail("string expected");
  v.clear();
  while (r.p < r.s.size() && r.s[r.p] != '"') {
    char c = r.s[r.p++];
    if (c != '\\') { v += c; continue; }
    if (r.p >= r.s.size()) r.fail("bad escape");
    char e = r.s[r.p++];
    switch (e) {
      case 'n': v += '\n'; break;
      case 't': v += '\t'; break;
      case 'r': v += '\r'; break;
      case 'b': v += '\b'; break;
      case 'f': v += '\f'; break;
      case 'u': {
        unsigned cp = 0;
        for (int k = 0; k < 4 && r.p < r.s.size(); ++k) {
          char h = r.s[r.p++];
          cp = cp * 16 + (h >= 'a' ? h - 'a' + 10 : h >= 'A' ? h - 'A' + 10 : h - '0');
        }
        appendUtf8(v, cp);
        break;
      }
      default: v += e;
    }
  }
  if (r.p >= r.s.size()) r.fail("unterminated string");
  ++r.p;
}
template <class T> inline void readValue(Reader& r, std::vector<T>& v) {
  v.clear();
  if (!r.eat('[')) r.fail("array expected");
  if (r.eat(']')) return;
  while (true) {
    T t;
    readValue(r, t);
    v.push_back(t);
    if (r.eat(',')) continue;
    if (r.eat(']')) break;
    r.fail("bad array");
  }
}

inline void dump(std::string& o, bool v) { o += v ? "true" : "false"; }
inline void dump(std::string& o, const std::string& v) {
  o += '"';
  for (size_t i = 0; i < v.size(); ++i) {
    unsigned char c = (unsigned char)v[i];
    switch (c) {
      case '"': o += "\\\""; break;
      case '\\': o += "\\\\"; break;
      case '\n': o += "\\n"; break;
      case '\r': o += "\\r"; break;
      case '\t': o += "\\t"; break;
      default:
        if (c < 0x20) { char b[8]; snprintf(b, sizeof b, "\\u%04x", c); o += b; }
        else o += (char)c;
    }
  }
  o += '"';
}
inline void dump(std::string& o, const char* v) { dump(o, std::string(v)); }
template <class T>
inline typename std::enable_if<std::is_integral<T>::value && !std::is_same<T, bool>::value>::type
dump(std::string& o, T v) { o += std::to_string((long long)v); }
template <class T>
inline typename std::enable_if<std::is_floating_point<T>::value>::type
dump(std::string& o, T v) {
  double d = (double)v;
  if (d != d || d - d != 0) { o += "null"; }
  else { char b[40]; snprintf(b, sizeof b, "%.17g", d); o += b; }
}
template <class T> inline void dump(std::string& o, const std::vector<T>& v) {
  o += '[';
  for (size_t i = 0; i < v.size(); ++i) {
    if (i) o += ',';
    const T& e = v[i];
    dump(o, e);
  }
  o += ']';
}

}  // namespace atlas_driver
`;

  // ── Tam mənbə kodunu qur ─────────────────────────────────────
  function buildCppSource(userCode, problem) {
    const params = problem.params || [];
    const className = problem.class_name || 'Solution';
    const funcName = problem.function_name;
    if (!funcName) throw new Error('function_name yoxdur');

    const decls = params.map((p, i) =>
      `    ${cppTypeOf(p.type)} __a${i};\n    atlas_driver::readValue(__r, __a${i});`).join('\n');
    const args = params.map((_, i) => `__a${i}`).join(', ');

    const mainCode = `
int main() {
  std::string __all;
  { char __buf[4096]; size_t __n; while ((__n = fread(__buf, 1, sizeof(__buf), stdin)) > 0) __all.append(__buf, __n); }
  atlas_driver::Reader __r(__all);
  int __cases = 0;
  atlas_driver::readValue(__r, __cases);
  for (int __i = 0; __i < __cases; ++__i) {
${decls}
    auto __res = ${className}().${funcName}(${args});
    std::cout.flush();
    std::string __o = "${RESULT_MARK}";
    atlas_driver::dump(__o, __res);
    __o += "\\n${END_MARK.replace('\n', '\\n')}";
    fwrite(__o.data(), 1, __o.size(), stdout);
    fflush(stdout);
  }
  return 0;
}
`;

    return PRELUDE +
      `#line 1 "${USER_FILE}"\n` + sanitizeUserCode(userCode) +
      `#line 1 "${DRIVER_FILE}"\n` + DRIVER_HELPERS + mainCode;
  }

  // ── stdin mətni: N, sonra hər test üçün hər parametr (JSON) ──
  function toByteString(str) {
    const bytes = new TextEncoder().encode(str);
    let s = '';
    for (let i = 0; i < bytes.length; i += 8192) {
      s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    }
    return s;
  }
  function byteStringToUtf8(s) {
    const u8 = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i) & 0xff;
    return new TextDecoder('utf-8').decode(u8);
  }
  function buildStdin(testInputs, params) {
    const lines = [String(testInputs.length)];
    for (const input of testInputs) {
      for (const p of params) lines.push(JSON.stringify(input[p.name]));
    }
    return lines.join('\n') + '\n';
  }

  // ── Diaqnostika formatlama ───────────────────────────────────
  const ANSI = /\x1b\[[0-9;]*m/g;
  function formatDiagnostics(raw) {
    const lines = String(raw).replace(ANSI, '').split('\n');
    let errorLine = null;
    let driverError = false;
    const out = [];
    for (const ln of lines) {
      if (/^Error: process exited/.test(ln)) continue;
      let m = /^user_code\.cpp:(\d+):(\d+): (fatal error|error|warning|note): (.*)$/.exec(ln);
      if (m) {
        if (errorLine === null && (m[3] === 'error' || m[3] === 'fatal error')) errorLine = parseInt(m[1], 10);
        out.push(`Line ${m[1]}: ${m[3]}: ${m[4]}`);
        continue;
      }
      m = /^atlas_driver\.cpp:\d+:\d+: (fatal error|error): (.*)$/.exec(ln);
      if (m) { driverError = true; out.push(`error: ${m[2]}`); continue; }
      if (/^atlas_driver\.cpp:/.test(ln)) continue;
      out.push(ln);
    }
    let text = out.join('\n').trim();
    if (driverError && errorLine === null) {
      text = 'Funksiya imzası şablona uyğun görünmür (metod adı/parametr tipləri dəyişdirilməməlidir).\n' + text;
    }
    return { text, errorLine };
  }

  function describeRuntimeError(e) {
    const msg = (e && e.message) ? String(e.message) : String(e);
    if (e && typeof e.code === 'number') return `Proqram ${e.code} kodu ilə dayandı (exit/abort).`;
    if (/out of bounds/i.test(msg)) return 'Runtime Error: massiv/yaddaş sərhədindən kənara çıxış (segmentation fault).';
    if (/unreachable/i.test(msg)) return 'Runtime Error: abort() / assert / yanlış əməliyyat (proqram qəzası).';
    if (/call stack|stack overflow/i.test(msg)) return 'Runtime Error: stack overflow (çox dərin rekursiya).';
    return 'Runtime Error: ' + msg;
  }

  // ── İcra çıxışını test nəticələrinə çevir ────────────────────
  function interpretRun(res, n) {
    if (res.stage === 'compile' || res.stage === 'link') {
      const d = formatDiagnostics(res.diagnostics);
      return [{
        resultJson: null, output: '', compileError: true,
        error: d.text || (res.stage === 'link' ? 'Link xətası' : 'Kompilyasiya xətası'),
        errorLine: d.errorLine,
      }];
    }
    const text = res.stdout;
    const results = [];
    let pos = 0;
    for (let i = 0; i < n; i++) {
      const endIdx = text.indexOf(END_MARK, pos);
      if (endIdx === -1) break;
      const chunk = text.slice(pos, endIdx);
      pos = endIdx + END_MARK.length;
      const rIdx = chunk.lastIndexOf(RESULT_MARK);
      if (rIdx === -1) {
        results.push({ resultJson: null, output: chunk.trim(), error: 'Nəticə oxuna bilmədi', errorLine: null });
      } else {
        results.push({
          resultJson: chunk.slice(rIdx + RESULT_MARK.length).replace(/\n$/, ''),
          output: chunk.slice(0, rIdx).replace(/\s+$/, ''),
          error: null, errorLine: null,
        });
      }
    }
    if (results.length < n) {
      const tail = text.slice(pos).split('\x1b[91m')[0].replace(/\s+$/, '');
      results.push({
        resultJson: null, output: tail, errorLine: null,
        error: res.runError || 'Proqram gözlənilmədən dayandı.',
      });
    }
    return results;
  }

  // ── wasm-clang icraçısı ──────────────────────────────────────
  const CLANG_FLAGS = [
    '-disable-free', '-isysroot', '/',
    '-internal-isystem', '/include/c++/v1',
    '-internal-isystem', '/include',
    '-internal-isystem', '/lib/clang/8.0.1/include',
    '-ferror-limit', '5', '-fmessage-length', '0',
    '-std=c++17', '-O2',
  ];
  const STACK_SIZE = 8 * 1024 * 1024;
  const MAX_MEMORY = 256 * 1024 * 1024;

  function createCppRunner(apiOptions) {
    let api = null;
    let phase = 'compile';
    let diag = [];
    let out = [];

    function init() {
      if (api) return api;
      // shared.js `const API` təyin edir: bu, klassik script-də window/self xassəsi DEYİL, yalnız qlobal adla əlçatandır
      const ApiClass = (typeof API !== 'undefined') ? API : root.API;
      api = new ApiClass(Object.assign({}, apiOptions, {
        hostWrite: s => (phase === 'run' ? out : diag).push(s),
      }));
      api.hostLog = () => {};
      api.hostLogAsync = (m, p) => p;
      return api;
    }

    async function warmup() {
      init();
      await api.ready;
      await api.getModule(api.clangFilename);
      await api.getModule(api.lldFilename);
    }

    async function compileAndRun({ source, stdin, onRunning }) {
      init();
      phase = 'compile'; diag = []; out = [];
      await api.ready;

      api.memfs.addFile('test.cc', source);
      const clang = await api.getModule(api.clangFilename);
      try {
        await api.run(clang, 'clang', '-cc1', '-emit-obj', ...CLANG_FLAGS,
          '-o', 'test.o', '-x', 'c++', 'test.cc');
      } catch (e) {
        return { stage: 'compile', diagnostics: diag.join('') };
      }

      const lld = await api.getModule(api.lldFilename);
      try {
        await api.run(lld, 'wasm-ld', '--no-threads', '--export-dynamic',
          '-z', `stack-size=${STACK_SIZE}`, `--max-memory=${MAX_MEMORY}`,
          '-Llib/wasm32-wasi', 'lib/wasm32-wasi/crt1.o', 'test.o',
          '-lc', '-lc++', '-lc++abi', '-o', 'test.wasm');
      } catch (e) {
        return { stage: 'link', diagnostics: diag.join('') };
      }

      const mod = await WebAssembly.compile(api.memfs.getFileContents('test.wasm'));
      phase = 'run';
      api.memfs.setStdinStr(toByteString(stdin));
      if (onRunning) onRunning();

      let runError = null;
      try {
        await api.run(mod, 'test.wasm');
      } catch (e) {
        runError = describeRuntimeError(e);
      }
      return { stage: 'run', stdout: byteStringToUtf8(out.join('')), runError };
    }

    return { warmup, compileAndRun };
  }

  // Tək çağırışla: mənbə qur + icra et + nəticələri qaytar
  async function runBatch(runner, { userCode, problem, testInputs, onRunning }) {
    const params = problem.params || [];
    let source;
    try {
      source = buildCppSource(userCode, problem);
    } catch (e) {
      return [{ resultJson: null, output: '', error: e.message, errorLine: null, compileError: true }];
    }
    const stdin = buildStdin(testInputs, params);
    const res = await runner.compileAndRun({ source, stdin, onRunning });
    return interpretRun(res, testInputs.length);
  }

  root.AtlasCpp = {
    buildCppSource, buildStdin, interpretRun, formatDiagnostics,
    createCppRunner, runBatch, sanitizeUserCode,
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);