import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { canonicalRelativePath, createZip, packAsset } = await import("../src/lib/neon-asset-encrypter.mjs");

const expected = "4e454f4e41535431010100001400000000000000000102030405060708090a0b0c0d0e0f4e4e4e4e4e4e4e4e4e4e4e4ede1abfbf3c8800e37e637a74ce17a2a637b800a6d5b607fd8f66ec1c09483eed52983b02";
const packed = await packAsset({
  plaintext: new Uint8Array(Buffer.from("DFF fixture bytes\x00\x01\x02", "binary")),
  key: new Uint8Array(Array.from({ length: 32 }, (_, index) => index)),
  packageId: new Uint8Array(Array.from({ length: 16 }, (_, index) => index)),
  resourceName: "neon-encrypted-assets",
  relativePath: "models/example.dff.neonasset",
  assetType: "dff",
  nonce: new Uint8Array(12).fill("N".charCodeAt(0)),
});
assert.equal(Buffer.from(packed).toString("hex"), expected, "browser packer must match the engine/Python format vector");

assert.equal(canonicalRelativePath("models/car.txd.neonasset"), "models/car.txd.neonasset");
assert.throws(() => canonicalRelativePath("models/../secret.dff.neonasset"));

const temporary = mkdtempSync(join(tmpdir(), "neon-web-zip-"));
try {
  const zipPath = join(temporary, "package.zip");
  writeFileSync(zipPath, createZip([
    { name: "models/example.dff.neonasset", data: packed },
    { name: "neon-assets.key", data: "00".repeat(32) + "\n" },
  ], new Date(2026, 7, 28, 12, 0, 0)));
  const listing = execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf8" }).trim().split("\n");
  assert.deepEqual(listing, ["models/example.dff.neonasset", "neon-assets.key"]);
  assert.equal(execFileSync("unzip", ["-p", zipPath, "models/example.dff.neonasset"]).toString("hex"), expected);
  assert.equal(readFileSync(zipPath).subarray(0, 4).toString("hex"), "504b0304");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

console.log("Neon browser asset packer: crypto vector and ZIP checks passed");
