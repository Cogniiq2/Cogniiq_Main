// Minimal, dependency-free ZIP writer using the STORE method (no compression). An .xlsx file is a
// ZIP container of XML parts; producing a valid ZIP by hand lets us emit real spreadsheets without
// pulling a multi-hundred-kB dependency into the bundle. STORE keeps the implementation small and
// fully deterministic — adequate for the modest finance datasets we export. The module is loaded via
// dynamic import so none of this ships in the initial application bundle.

interface ZipEntry {
  name: string;
  data: Uint8Array;
  crc: number;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export class ZipBuilder {
  private entries: ZipEntry[] = [];

  /** Add a text file (UTF-8) at the given archive path, e.g. "xl/workbook.xml". */
  addText(name: string, text: string): void {
    const data = utf8(text);
    this.entries.push({ name, data, crc: crc32(data) });
  }

  /** Serialize to a complete ZIP byte array (local headers + central directory + EOCD). */
  build(): Uint8Array {
    const chunks: Uint8Array[] = [];
    const central: Uint8Array[] = [];
    let offset = 0;

    // Fixed DOS timestamp for determinism (1980-01-01 00:00:00).
    const dosTime = 0;
    const dosDate = 0x0021;

    for (const entry of this.entries) {
      const nameBytes = utf8(entry.name);
      const local = new Uint8Array(30 + nameBytes.length);
      const dv = new DataView(local.buffer);
      dv.setUint32(0, 0x04034b50, true); // local file header signature
      dv.setUint16(4, 20, true); // version needed
      dv.setUint16(6, 0x0800, true); // general purpose flag: UTF-8 names
      dv.setUint16(8, 0, true); // method: store
      dv.setUint16(10, dosTime, true);
      dv.setUint16(12, dosDate, true);
      dv.setUint32(14, entry.crc, true);
      dv.setUint32(18, entry.data.length, true); // compressed size
      dv.setUint32(22, entry.data.length, true); // uncompressed size
      dv.setUint16(26, nameBytes.length, true);
      dv.setUint16(28, 0, true); // extra length
      local.set(nameBytes, 30);
      chunks.push(local, entry.data);

      const cd = new Uint8Array(46 + nameBytes.length);
      const cdv = new DataView(cd.buffer);
      cdv.setUint32(0, 0x02014b50, true); // central dir signature
      cdv.setUint16(4, 20, true); // version made by
      cdv.setUint16(6, 20, true); // version needed
      cdv.setUint16(8, 0x0800, true); // UTF-8 flag
      cdv.setUint16(10, 0, true); // method store
      cdv.setUint16(12, dosTime, true);
      cdv.setUint16(14, dosDate, true);
      cdv.setUint32(16, entry.crc, true);
      cdv.setUint32(20, entry.data.length, true);
      cdv.setUint32(24, entry.data.length, true);
      cdv.setUint16(28, nameBytes.length, true);
      cdv.setUint16(30, 0, true); // extra
      cdv.setUint16(32, 0, true); // comment
      cdv.setUint16(34, 0, true); // disk number
      cdv.setUint16(36, 0, true); // internal attrs
      cdv.setUint32(38, 0, true); // external attrs
      cdv.setUint32(42, offset, true); // local header offset
      cd.set(nameBytes, 46);
      central.push(cd);

      offset += local.length + entry.data.length;
    }

    const centralSize = central.reduce((s, c) => s + c.length, 0);
    const eocd = new Uint8Array(22);
    const edv = new DataView(eocd.buffer);
    edv.setUint32(0, 0x06054b50, true); // EOCD signature
    edv.setUint16(4, 0, true);
    edv.setUint16(6, 0, true);
    edv.setUint16(8, this.entries.length, true);
    edv.setUint16(10, this.entries.length, true);
    edv.setUint32(12, centralSize, true);
    edv.setUint32(16, offset, true);
    edv.setUint16(20, 0, true);

    const totalSize = offset + centralSize + eocd.length;
    const out = new Uint8Array(totalSize);
    let pos = 0;
    for (const chunk of chunks) { out.set(chunk, pos); pos += chunk.length; }
    for (const cd of central) { out.set(cd, pos); pos += cd.length; }
    out.set(eocd, pos);
    return out;
  }
}
