const encoder = new TextEncoder();

export const MAX_PLAINTEXT_SIZE = 64 * 1024 * 1024;
export const TYPE_IDS = Object.freeze({ dff: 1, txd: 2, col: 3 });

const MAGIC = encoder.encode("NEONAST1");
const FORMAT_VERSION = 1;
const HEADER_SIZE = 48;
const ZIP_UTF8_FLAG = 0x0800;

function requireCrypto() {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
    throw new Error("This browser does not provide the Web Crypto API.");
  }
  return globalThis.crypto;
}

function concatBytes(...parts) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function littleEndian16(value) {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
}

export function bytesToHex(bytes) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export function canonicalRelativePath(value) {
  if (!value || value.startsWith("/") || value.endsWith("/") || value.includes("\\") || /[:*?"<>|]/u.test(value)) {
    throw new Error("Asset paths must be relative and use forward slashes.");
  }
  const parts = value.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) {
    throw new Error("Asset paths cannot contain empty, dot, or parent components.");
  }
  if (encoder.encode(value).length > 0xffff) {
    throw new Error("Asset path is too long.");
  }
  return value;
}

function buildAad(header, resourceName, relativePath) {
  const resource = encoder.encode(resourceName);
  const path = encoder.encode(canonicalRelativePath(relativePath));
  if (!resource.length || resource.length > 0xffff) {
    throw new Error("Resource name must contain between 1 and 65,535 UTF-8 bytes.");
  }
  return concatBytes(header, littleEndian16(resource.length), resource, littleEndian16(path.length), path);
}

export function generatePackageSecrets() {
  const cryptoApi = requireCrypto();
  return {
    key: cryptoApi.getRandomValues(new Uint8Array(32)),
    packageId: cryptoApi.getRandomValues(new Uint8Array(16)),
  };
}

export async function packAsset({ plaintext, key, packageId, resourceName, relativePath, assetType, nonce }) {
  if (!(plaintext instanceof Uint8Array) || plaintext.length < 1 || plaintext.length > MAX_PLAINTEXT_SIZE) {
    throw new Error(`Each asset must contain between 1 byte and ${MAX_PLAINTEXT_SIZE} bytes.`);
  }
  if (!(key instanceof Uint8Array) || key.length !== 32 || !(packageId instanceof Uint8Array) || packageId.length !== 16) {
    throw new Error("Invalid content key or package id.");
  }
  if (!(assetType in TYPE_IDS)) {
    throw new Error("Only DFF, TXD, and COL assets are supported.");
  }

  const cryptoApi = requireCrypto();
  const iv = nonce ?? cryptoApi.getRandomValues(new Uint8Array(12));
  if (!(iv instanceof Uint8Array) || iv.length !== 12) {
    throw new Error("AES-GCM nonce must contain exactly 12 bytes.");
  }

  const header = new Uint8Array(HEADER_SIZE);
  header.set(MAGIC, 0);
  header[8] = FORMAT_VERSION;
  header[9] = TYPE_IDS[assetType];
  new DataView(header.buffer).setBigUint64(12, BigInt(plaintext.length), true);
  header.set(packageId, 20);
  header.set(iv, 36);

  const importedKey = await cryptoApi.subtle.importKey("raw", key, { name: "AES-GCM" }, false, ["encrypt"]);
  const encrypted = await cryptoApi.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: buildAad(header, resourceName, relativePath), tagLength: 128 },
    importedKey,
    plaintext,
  );
  return concatBytes(header, new Uint8Array(encrypted));
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function dosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

export function createZip(entries, modifiedAt = new Date()) {
  if (!Array.isArray(entries) || entries.length < 1 || entries.length > 0xffff) {
    throw new Error("ZIP package must contain between 1 and 65,535 files.");
  }

  const localParts = [];
  const centralParts = [];
  const seenNames = new Set();
  const timestamp = dosDateTime(modifiedAt);
  let localOffset = 0;

  for (const entry of entries) {
    const name = canonicalRelativePath(entry.name);
    if (seenNames.has(name)) {
      throw new Error(`Duplicate ZIP path: ${name}`);
    }
    seenNames.add(name);
    const nameBytes = encoder.encode(name);
    const data = entry.data instanceof Uint8Array ? entry.data : encoder.encode(String(entry.data));
    if (data.length > 0xffffffff || localOffset > 0xffffffff) {
      throw new Error("ZIP64 packages are not supported.");
    }
    const checksum = crc32(data);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, ZIP_UTF8_FLAG, true);
    localView.setUint16(10, timestamp.time, true);
    localView.setUint16(12, timestamp.date, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, ZIP_UTF8_FLAG, true);
    centralView.setUint16(12, timestamp.time, true);
    centralView.setUint16(14, timestamp.date, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, localOffset, true);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    localOffset += localHeader.length + data.length;
  }

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  if (localOffset + centralSize + 22 > 0xffffffff) {
    throw new Error("ZIP64 packages are not supported.");
  }
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, localOffset, true);
  return concatBytes(...localParts, ...centralParts, end);
}
