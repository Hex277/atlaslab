/* ================================================
   AtlasLab Code — java-driver.js
   Java üçün: sürücü (Main.java) generatoru + nəticə/ECJ-xəta parser-i.
   İcra mühərrikindən (CheerpJ və s.) asılı deyil — yalnız mənbə kodu qurur.
   Protokol: sürücü stdin/fayl oxuyur, nəticələri stdout/fayla yazır (C++ ilə eyni markerlər).
   Java 8 uyğundur (CheerpJ default Java 8-dir).
   ================================================ */
(function (root) {
  'use strict';

  const RESULT_MARK = '@@ATLAS_RESULT@@';
  const ERROR_MARK = '@@ATLAS_ERROR@@';
  const END_MARK = '@@ATLAS_END@@\n';

  const BOX = { int: 'Integer', float: 'Double', str: 'String', bool: 'Boolean' };

  function javaType(t) {
    const prim = { int: 'int', float: 'double', str: 'String', bool: 'boolean' };
    if (prim[t]) return prim[t];
    const m = /^List\[(.+)\]$/.exec(t || '');
    if (m) return `List<${javaBoxed(m[1])}>`;
    throw new Error(`Dəstəklənməyən tip: ${t}`);
  }
  function javaBoxed(t) {
    if (BOX[t]) return BOX[t];
    return javaType(t);
  }

  // JSON-ağacından (Object) tipli dəyərə çevirən ifadə
  function conv(t, expr, depth) {
    if (t === 'int') return `((Number) ${expr}).intValue()`;
    if (t === 'float') return `((Number) ${expr}).doubleValue()`;
    if (t === 'str') return `((String) ${expr})`;
    if (t === 'bool') return `((Boolean) ${expr})`;
    const m = /^List\[(.+)\]$/.exec(t || '');
    if (m) {
      const v = `__e${depth}`;
      return `AtlasDriver.<${javaBoxed(m[1])}>toList(${expr}, ${v} -> ${conv(m[1], v, depth + 1)})`;
    }
    throw new Error(`Dəstəklənməyən tip: ${t}`);
  }

  function sanitizeUserCode(code) {
    let c = String(code).replace(/\r\n?/g, '\n');
    if (!c.endsWith('\n')) c += '\n';
    return c;
  }

  const DRIVER_CLASS = String.raw`
class AtlasDriver {
  static <T> List<T> toList(Object o, java.util.function.Function<Object, T> f) {
    List<?> src = (List<?>) o;
    List<T> r = new ArrayList<T>();
    for (Object x : src) r.add(f.apply(x));
    return r;
  }

  static class Parser {
    final String s; int p = 0;
    Parser(String s) { this.s = s; }
    void ws() { while (p < s.length() && Character.isWhitespace(s.charAt(p))) p++; }
    Object value() {
      ws();
      char c = s.charAt(p);
      if (c == '[') {
        p++; List<Object> list = new ArrayList<Object>();
        ws();
        if (s.charAt(p) == ']') { p++; return list; }
        while (true) {
          list.add(value()); ws();
          char d = s.charAt(p++);
          if (d == ',') continue;
          if (d == ']') break;
          throw new RuntimeException("bad array");
        }
        return list;
      }
      if (c == '"') return str();
      if (s.startsWith("true", p)) { p += 4; return Boolean.TRUE; }
      if (s.startsWith("false", p)) { p += 5; return Boolean.FALSE; }
      if (s.startsWith("null", p)) { p += 4; return null; }
      int st = p;
      while (p < s.length() && "+-0123456789.eE".indexOf(s.charAt(p)) >= 0) p++;
      String num = s.substring(st, p);
      if (num.indexOf('.') < 0 && num.indexOf('e') < 0 && num.indexOf('E') < 0) return Long.valueOf(num);
      return Double.valueOf(num);
    }
    String str() {
      p++; StringBuilder sb = new StringBuilder();
      while (s.charAt(p) != '"') {
        char c = s.charAt(p++);
        if (c != '\\') { sb.append(c); continue; }
        char e = s.charAt(p++);
        switch (e) {
          case 'n': sb.append('\n'); break;
          case 't': sb.append('\t'); break;
          case 'r': sb.append('\r'); break;
          case 'b': sb.append('\b'); break;
          case 'f': sb.append('\f'); break;
          case 'u': sb.append((char) Integer.parseInt(s.substring(p, p + 4), 16)); p += 4; break;
          default: sb.append(e);
        }
      }
      p++;
      return sb.toString();
    }
  }

  static void dump(StringBuilder sb, Object v) {
    if (v == null) { sb.append("null"); return; }
    if (v instanceof Boolean || v instanceof Integer || v instanceof Long || v instanceof Short || v instanceof Byte) { sb.append(v.toString()); return; }
    if (v instanceof Double || v instanceof Float) {
      double d = ((Number) v).doubleValue();
      if (Double.isNaN(d) || Double.isInfinite(d)) sb.append("null"); else sb.append(Double.toString(d));
      return;
    }
    if (v instanceof Character) { dumpStr(sb, v.toString()); return; }
    if (v instanceof CharSequence) { dumpStr(sb, v.toString()); return; }
    if (v instanceof Iterable) {
      sb.append('['); boolean first = true;
      for (Object x : (Iterable<?>) v) { if (!first) sb.append(','); first = false; dump(sb, x); }
      sb.append(']'); return;
    }
    if (v.getClass().isArray()) {
      sb.append('[');
      int n = java.lang.reflect.Array.getLength(v);
      for (int i = 0; i < n; i++) { if (i > 0) sb.append(','); dump(sb, java.lang.reflect.Array.get(v, i)); }
      sb.append(']'); return;
    }
    dumpStr(sb, v.toString());
  }

  static void dumpStr(StringBuilder sb, String s) {
    sb.append('"');
    for (int i = 0; i < s.length(); i++) {
      char c = s.charAt(i);
      switch (c) {
        case '"': sb.append("\\\""); break;
        case '\\': sb.append("\\\\"); break;
        case '\n': sb.append("\\n"); break;
        case '\r': sb.append("\\r"); break;
        case '\t': sb.append("\\t"); break;
        default:
          if (c < 0x20) sb.append(String.format("\\u%04x", (int) c)); else sb.append(c);
      }
    }
    sb.append('"');
  }

  static byte[] readAll(java.io.InputStream in) throws java.io.IOException {
    java.io.ByteArrayOutputStream bo = new java.io.ByteArrayOutputStream();
    byte[] buf = new byte[8192]; int n;
    while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
    return bo.toByteArray();
  }
}
`;

  // ── Main.java mənbəyini qur ───────────────────────────────────
  // userLines: istifadəçi kodunun sətr sayı (xəta sətrini süzmək üçün)
  function buildJavaSource(userCode, problem) {
    const params = problem.params || [];
    const className = problem.class_name || 'Solution';
    const funcName = problem.function_name;
    if (!funcName) throw new Error('function_name yoxdur');

    const user = sanitizeUserCode(userCode);
    const userLines = user.split('\n').length - 1;

    const decls = params.map((p, i) =>
      `        ${javaType(p.type)} __a${i} = ${conv(p.type, '__ps.value()', 0)};`).join('\n');
    const args = params.map((_, i) => `__a${i}`).join(', ');

    const mainClass = `
public class Main {
  static final int USER_LINES = ${userLines};
  public static void main(String[] args) throws Exception {
    String inPath = args.length > 0 ? args[0] : "-";
    String outPath = args.length > 1 ? args[1] : "-";
    byte[] raw = inPath.equals("-") ? AtlasDriver.readAll(System.in)
        : java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(inPath));
    AtlasDriver.Parser __ps = new AtlasDriver.Parser(new String(raw, "UTF-8"));
    int __cases = ((Number) __ps.value()).intValue();
    StringBuilder out = new StringBuilder();
    for (int __i = 0; __i < __cases; __i++) {
      java.io.PrintStream __orig = System.out;
      java.io.ByteArrayOutputStream __cap = new java.io.ByteArrayOutputStream();
      System.setOut(new java.io.PrintStream(__cap, true, "UTF-8"));
      Object __res = null; Throwable __err = null;
      try {
${decls}
        __res = new ${className}().${funcName}(${args});
      } catch (Throwable t) { __err = t; }
      System.out.flush();
      System.setOut(__orig);
      out.append(new String(__cap.toByteArray(), "UTF-8"));
      if (__err == null) {
        out.append("${RESULT_MARK}");
        AtlasDriver.dump(out, __res);
      } else {
        int line = 0;
        for (StackTraceElement f : __err.getStackTrace()) {
          if ("Main.java".equals(f.getFileName()) && f.getLineNumber() > 0 && f.getLineNumber() <= USER_LINES) { line = f.getLineNumber(); break; }
        }
        out.append("${ERROR_MARK}{\\"type\\":");
        AtlasDriver.dumpStr(out, __err.getClass().getName());
        out.append(",\\"message\\":");
        AtlasDriver.dumpStr(out, String.valueOf(__err.getMessage()));
        out.append(",\\"line\\":").append(line).append("}");
      }
      out.append("\\n${END_MARK.replace('\n', '\\n')}");
      if (__err != null) break;
    }
    byte[] bytes = out.toString().getBytes("UTF-8");
    if (outPath.equals("-")) { System.out.write(bytes, 0, bytes.length); System.out.flush(); }
    else { java.nio.file.Files.write(java.nio.file.Paths.get(outPath), bytes); }
  }
}
`;
    // Prefiks (import-lar) istifadəçinin 1-ci sətri ilə EYNİ sətirdədir → sətr nömrələri dəyişmir
    return 'import java.util.*; import java.util.function.*; ' + user + DRIVER_CLASS + mainClass;
  }

  function buildStdin(testInputs, params) {
    const lines = [String(testInputs.length)];
    for (const input of testInputs) for (const p of params) lines.push(JSON.stringify(input[p.name]));
    return lines.join('\n') + '\n';
  }

  // ── Çıxışı test nəticələrinə çevir ────────────────────────────
  function interpretOutput(text, n, fallbackError) {
    const results = [];
    let pos = 0;
    for (let i = 0; i < n; i++) {
      const endIdx = text.indexOf(END_MARK, pos);
      if (endIdx === -1) break;
      const chunk = text.slice(pos, endIdx);
      pos = endIdx + END_MARK.length;
      const eIdx = chunk.lastIndexOf(ERROR_MARK);
      if (eIdx !== -1) {
        let info = { type: 'Exception', message: '', line: 0 };
        try { info = JSON.parse(chunk.slice(eIdx + ERROR_MARK.length)); } catch (_) {}
        results.push({
          resultJson: null, output: chunk.slice(0, eIdx).replace(/\s+$/, ''),
          error: `${info.type}${info.message && info.message !== 'null' ? ': ' + info.message : ''}`,
          errorLine: info.line > 0 ? info.line : null,
        });
        continue;
      }
      const rIdx = chunk.lastIndexOf(RESULT_MARK);
      if (rIdx === -1) {
        results.push({ resultJson: null, output: chunk.trim(), error: 'Nəticə oxuna bilmədi', errorLine: null });
      } else {
        results.push({
          resultJson: chunk.slice(rIdx + RESULT_MARK.length).replace(/\n$/, ''),
          output: chunk.slice(0, rIdx).replace(/\s+$/, ''), error: null, errorLine: null,
        });
      }
    }
    if (results.length < n && !(results.length && results[results.length - 1].error)) {
      results.push({ resultJson: null, output: '', errorLine: null,
        error: fallbackError || 'Proqram gözlənilmədən dayandı (System.exit və ya qəza).' });
    }
    return results;
  }

  // ── ECJ log formatı: "1. ERROR in /str/Main.java (at line 5)" ──
  // userLines: istifadəçi kodunun sətr sayı. Bundan sonrakı sətirlərdəki xətalar sürücüyə aiddir
  // (adətən funksiya imzası dəyişdirilib) — belə xətalar üçün sətr vurğulanmır.
  function parseEcjLog(raw, userLines) {
    const text = String(raw).replace(/\r/g, '');
    const blocks = text.split(/^-{10,}\s*$/m).map(b => b.trim()).filter(Boolean);
    const out = [];
    let errorLine = null;
    let driverError = false;
    for (const b of blocks) {
      const m = /^\d+\.\s+(ERROR|WARNING)\s+in\s+\S*Main\.java\s+\(at line (\d+)\)\s*\n([\s\S]*)$/.exec(b);
      if (!m) { if (/problem/.test(b) && /error/i.test(b)) out.push(b); continue; }
      if (m[1] !== 'ERROR') continue;
      const line = parseInt(m[2], 10);
      const body = m[3].split('\n');
      const msg = body[body.length - 1].trim();
      if (userLines && line > userLines) { driverError = true; out.push(`error: ${msg}`); continue; }
      if (errorLine === null) errorLine = line;
      out.push(`Line ${line}: error: ${msg}\n${body.slice(0, -1).join('\n')}`);
    }
    let result = out.join('\n\n').trim();
    if (driverError && errorLine === null) {
      result = 'Funksiya imzası şablona uyğun görünmür (metod adı/parametr tipləri dəyişdirilməməlidir).\n' + result;
    }
    return { text: result, errorLine };
  }

  function countUserLines(code) { return sanitizeUserCode(code).split('\n').length - 1; }

  root.AtlasJava = { buildJavaSource, buildStdin, interpretOutput, parseEcjLog, countUserLines, javaType };
})(typeof globalThis !== 'undefined' ? globalThis : self);