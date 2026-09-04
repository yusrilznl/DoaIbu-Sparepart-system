import { SparePart } from '../types/inventory';

/**
 * Smart Search Helper for Spareparts
 * Matches query against kodeItem, namaSparepart, oemNumber, nomorPartPabrikan, brand, lokasiRak, kategori, deskripsi
 * Supports normalized matching (ignores spaces/hyphens/case) and multi-word token matching.
 */
export const matchSparePartSearch = (part: SparePart, query: string): boolean => {
  if (!query || !query.trim()) return true;
  if (!part) return false;

  const rawQuery = query.trim().toLowerCase();
  // Normalized query without whitespace/dashes
  const normQuery = rawQuery.replace(/[\s\-_]+/g, '');

  // Extract all searchable values
  const itemCode = (part.kodeItem || (part as any).partNumber || '').toLowerCase();
  const nama = (part.namaSparepart || '').toLowerCase();
  const oem = (part.oemNumber || (part as any).nomorPartPabrikan || '').toLowerCase();
  const brand = (part.brand || '').toLowerCase();
  const rak = (part.lokasiRak || '').toLowerCase();
  const kategori = (part.kategori || '').toLowerCase();
  const deskripsi = (part.deskripsi || '').toLowerCase();

  // Combined full text for token search
  const combinedText = `${itemCode} ${nama} ${oem} ${brand} ${rak} ${kategori} ${deskripsi}`;
  const combinedNorm = combinedText.replace(/[\s\-_]+/g, '');

  // 1. Direct or normalized substring match
  if (combinedText.includes(rawQuery) || combinedNorm.includes(normQuery)) {
    return true;
  }

  // 2. Tokenized multi-word search (all tokens must match combined text)
  const tokens = rawQuery.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    return tokens.every(token => {
      const normToken = token.replace(/[\-_]+/g, '');
      return combinedText.includes(token) || combinedNorm.includes(normToken);
    });
  }

  return false;
};

/**
 * Deduplicates an array of SparePart objects by normalized item code
 */
export const deduplicatePartsList = (parts: SparePart[]): SparePart[] => {
  const map = new Map<string, SparePart>();
  parts.forEach(p => {
    if (!p) return;
    const code = (p.kodeItem || (p as any).partNumber || '').replace(/[\s\u00a0]+/g, '').toLowerCase();
    if (code && !map.has(code)) {
      map.set(code, p);
    }
  });
  return Array.from(map.values());
};
