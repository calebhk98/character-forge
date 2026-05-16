/**
 * @file Utility for embedding JSON metadata into PNG tEXt chunks.
 * Produces card-compatible PNGs with ccv3 and chara keywords as required
 * by the Character Card V3 specification used by SillyTavern.
 */

/** @type {Uint32Array} Precomputed CRC32 lookup table (IEEE polynomial). */
const CRC_TABLE = buildCrcTable();

/**
 * Build the CRC32 lookup table using the IEEE polynomial 0xEDB88320.
 *
 * @returns {Uint32Array} 256-entry CRC table
 */
function buildCrcTable() {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c;
    }
    return table;
}

/**
 * Compute CRC32 checksum of a byte array.
 *
 * @param {Uint8Array} bytes - input bytes
 * @returns {number} unsigned 32-bit CRC
 */
function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (const byte of bytes) {
        crc = CRC_TABLE[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Write a big-endian uint32 into a Uint8Array at the given offset.
 *
 * @param {Uint8Array} bytes - target buffer
 * @param {number} offset - byte offset
 * @param {number} value - value to write
 */
function writeUint32BE(bytes, offset, value) {
    bytes[offset] = (value >>> 24) & 0xFF;
    bytes[offset + 1] = (value >>> 16) & 0xFF;
    bytes[offset + 2] = (value >>> 8) & 0xFF;
    bytes[offset + 3] = value & 0xFF;
}

/**
 * Read a big-endian uint32 from a Uint8Array at the given offset.
 *
 * @param {Uint8Array} bytes - source buffer
 * @param {number} offset - byte offset
 * @returns {number} unsigned 32-bit value
 */
function readUint32BE(bytes, offset) {
    return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) |
        (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

/**
 * Build a PNG tEXt chunk for the given keyword and text value.
 *
 * @param {string} keyword - tEXt keyword (ASCII, max 79 chars, no null)
 * @param {string} text - text value (ASCII/Latin-1)
 * @returns {Uint8Array} complete chunk bytes (length + type + data + CRC)
 */
function buildTextChunk(keyword, text) {
    const enc = new TextEncoder();
    const keyBytes = enc.encode(keyword);
    const textBytes = enc.encode(text);

    // chunk data = keyword + null separator + text
    const data = new Uint8Array(keyBytes.length + 1 + textBytes.length);
    data.set(keyBytes, 0);
    data[keyBytes.length] = 0;
    data.set(textBytes, keyBytes.length + 1);

    // CRC covers type bytes + data bytes
    const typeBytes = enc.encode('tEXt');
    const typeAndData = new Uint8Array(typeBytes.length + data.length);
    typeAndData.set(typeBytes, 0);
    typeAndData.set(data, typeBytes.length);

    const checksum = crc32(typeAndData);

    // chunk = 4-byte length + 4-byte type + data + 4-byte CRC
    const chunk = new Uint8Array(4 + 4 + data.length + 4);
    writeUint32BE(chunk, 0, data.length);
    chunk.set(typeBytes, 4);
    chunk.set(data, 8);
    writeUint32BE(chunk, 8 + data.length, checksum);

    return chunk;
}

/**
 * Find the byte offset of the IEND chunk within a PNG buffer.
 *
 * @param {Uint8Array} png - PNG bytes (signature already validated)
 * @returns {number} byte offset of the IEND length field
 * @throws {Error} if no IEND chunk is found
 */
function findIendOffset(png) {
    let offset = 8; // skip PNG signature
    while (offset < png.length) {
        const dataLen = readUint32BE(png, offset);
        const type = String.fromCharCode(png[offset + 4], png[offset + 5], png[offset + 6], png[offset + 7]);
        if (type === 'IEND') {
            return offset;
        }
        offset += 4 + 4 + dataLen + 4;
    }
    throw new Error('Invalid PNG: no IEND chunk found');
}

/**
 * Encode a JavaScript object as base64 UTF-8 JSON.
 * Uses TextEncoder to handle non-ASCII characters correctly.
 *
 * @param {object} obj - object to encode
 * @returns {string} base64 string
 */
function toBase64Json(obj) {
    const json = JSON.stringify(obj);
    const utf8 = new TextEncoder().encode(json);
    return btoa(String.fromCharCode(...utf8));
}

/** Base64 of a minimal 1×1 grey PNG placeholder image. */
const PLACEHOLDER_PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * Create a minimal 1×1 grey PNG as a placeholder avatar.
 *
 * @returns {Uint8Array} PNG bytes
 */
export function createPlaceholderPng() {
    const binary = atob(PLACEHOLDER_PNG_B64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/** PNG file signature bytes. */
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

/**
 * Embed a Character Card V3 JSON object into a PNG file as tEXt chunks.
 * Inserts both ccv3 (preferred) and chara (compatibility) chunks immediately
 * before the IEND marker. Returns a new Uint8Array; the original is unchanged.
 *
 * @param {Uint8Array} pngBytes - source PNG bytes
 * @param {object} cardJson - Character Card V3 JSON to embed
 * @returns {Uint8Array} new PNG bytes with embedded JSON
 * @throws {Error} if pngBytes does not begin with the PNG signature
 */
export function embedJsonInPng(pngBytes, cardJson) {
    for (let i = 0; i < 8; i++) {
        if (pngBytes[i] !== PNG_SIGNATURE[i]) {
            throw new Error('Invalid PNG: incorrect file signature');
        }
    }

    const iendOffset = findIendOffset(pngBytes);
    const b64 = toBase64Json(cardJson);
    const ccv3Chunk = buildTextChunk('ccv3', b64);
    const charaChunk = buildTextChunk('chara', b64);

    const beforeIend = pngBytes.slice(0, iendOffset);
    const iendChunk = pngBytes.slice(iendOffset);

    const result = new Uint8Array(
        beforeIend.length + ccv3Chunk.length + charaChunk.length + iendChunk.length,
    );
    let pos = 0;
    result.set(beforeIend, pos); pos += beforeIend.length;
    result.set(ccv3Chunk, pos); pos += ccv3Chunk.length;
    result.set(charaChunk, pos); pos += charaChunk.length;
    result.set(iendChunk, pos);

    return result;
}
