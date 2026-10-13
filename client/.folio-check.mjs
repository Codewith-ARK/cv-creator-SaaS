import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";

const generated = [];
function compile(source, name) {
  const target = path.resolve(name);
  const output = ts.transpileModule(fs.readFileSync(source, "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText;
  fs.writeFileSync(target, output); generated.push(target); return pathToFileURL(target).href;
}
const storage = new Map();
globalThis.window = {};
globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key,value) => storage.set(key,value), removeItem: (key) => storage.delete(key) };
let apiModule, cvId, blockId;
try {
  apiModule = await import(compile("src/lib/api.ts", ".folio-api-check.mjs"));
  const { api, login, register, setSession, getCVs, getBlocks, getSchemas, ApiError } = apiModule;
  const demo = await login("demo@folio.local", "folio-demo");
  assert.equal(demo.user.role, "client");
  const admin = await login("admin@folio.local", "folio-admin");
  assert.equal(admin.user.role, "admin");
  console.log("Authentication: demo and admin login passed.");
  await assert.rejects(() => register(" ", "invalid-email", "short"), (error) => error instanceof ApiError && error.status === 422 && !error.message.includes("[object Object]"));
  console.log("Axios validation errors: readable message passed.");
  setSession(demo.access_token, demo.user);
  const [cvs, blocks, schemas] = await Promise.all([getCVs(), getBlocks(), getSchemas()]);
  assert.ok(Array.isArray(cvs) && Array.isArray(blocks) && schemas.length > 0);
  console.log("Authenticated workspace queries passed.");
  const schema = schemas.find((item) => item.key === "summary");
  assert.ok(schema, "Summary schema is available");
  const block = await api("/blocks", { method: "POST", body: JSON.stringify({ schema_key: schema.key, title: "Folio verification detail", data: { text: "A temporary detail for checking the CV editing flow." } }) });
  blockId = block.id;
  const cv = await api("/cvs", { method: "POST", body: JSON.stringify({ name: "Folio verification draft", target_role: "Product Designer", template_key: "paper", page_size: "A4", sections: [{ key: schema.key, title: schema.label, items: [{ id: "qa-snapshot", source_block_id: block.id, snapshot_version: block.version, title: block.title, data: block.data }] }] }) });
  cvId = cv.id;
  const changed = await api("/blocks/" + blockId, { method: "PATCH", body: JSON.stringify({ schema_key: schema.key, title: block.title, data: { text: "Updated temporary detail." } }) });
  const stale = await api("/cvs/" + cvId);
  assert.equal(stale.sections[0].items[0].stale, true);
  stale.sections[0].items[0] = { ...stale.sections[0].items[0], data: changed.data, snapshot_version: changed.version };
  stale.page_size = "Letter";
  await api("/cvs/" + cvId, { method: "PUT", body: JSON.stringify(stale) });
  const saved = await api("/cvs/" + cvId);
  assert.equal(saved.page_size, "Letter");
  assert.equal(saved.sections[0].items[0].stale, false);
  assert.equal(saved.sections[0].items[0].data.text, "Updated temporary detail.");
  console.log("CV create, snapshot update, save and reload passed.");
  const { default: ResumeDocument } = await import(compile("src/components/ResumeDocument.tsx", ".folio-document-check.mjs"));
  for (const page_size of ["A4", "Letter"]) {
    const buffer = await renderToBuffer(React.createElement(ResumeDocument, { cv: { ...saved, page_size }, user: demo.user, schemas }));
    assert.ok(buffer.length > 1000);
    assert.ok(buffer.subarray(0, 4).toString() === "%PDF");
    console.log(page_size + " PDF generated: " + buffer.length + " bytes.");
  }
  for (const route of ["/landing", "/", "/editor/" + cvId]) {
    const response = await fetch("http://localhost:3000" + route);
    const html = await response.text();
    assert.equal(response.status, 200, route + " must return 200");
    assert.ok(!html.includes("Internal Server Error"));
    if (route === "/landing") assert.ok(html.includes("Your story.") && html.includes("A sample career library"));
    console.log("HTTP route passed: " + route);
  }
  const image = await fetch("http://localhost:3000/images/career-desk.png");
  assert.equal(image.status, 200);
  assert.ok(image.headers.get("content-type").includes("image/png"));
  console.log("Landing artwork served correctly.");
} finally {
  if (apiModule && cvId) await apiModule.api("/cvs/" + cvId, { method: "DELETE" });
  if (apiModule && blockId) await apiModule.api("/blocks/" + blockId, { method: "DELETE" });
  for (const file of generated) fs.unlinkSync(file);
  console.log("Temporary verification data cleaned up.");
}

