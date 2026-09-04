import { SparePart } from '../types/inventory';

/**
 * Normalizes a part code to a canonical key for comparison and deduplication.
 * e.g., "60193267 | 601931266" -> "60193267"
 * e.g., "FF5052 " -> "ff5052"
 */
export const normalizePartCode = (code: string): string => {
  if (!code) return '';
  // Get primary part number before '|' or ','
  const primary = String(code).split(/[|,]/)[0].trim();
  // Strip all non-alphanumeric characters
  return primary.toLowerCase().replace(/[^a-z0-9]/gi, '');
};

/**
 * Deduplicates an array of SparePart objects by normalized item code.
 * Merges duplicate entries safely while preserving the best properties (e.g. OEM number, images, stock).
 */
export const deduplicatePartsList = (parts: SparePart[]): SparePart[] => {
  const map = new Map<string, SparePart>();

  parts.forEach(p => {
    if (!p) return;
    const rawCode = p.kodeItem || (p as any).partNumber || '';
    let normKey = normalizePartCode(rawCode);
    if (!normKey && p.namaSparepart) {
      normKey = p.namaSparepart.toLowerCase().replace(/[^a-z0-9]/gi, '');
    }
    if (!normKey) return;

    // Clean primary kodeItem if it contains '|'
    const cleanKodeItem = rawCode.includes('|')
      ? rawCode.split('|')[0].trim()
      : rawCode.trim();

    // Extract extra OEM numbers if present in kodeItem
    const extraOems = rawCode.includes('|')
      ? rawCode.split('|').slice(1).map(s => s.trim()).join(' | ')
      : '';

    const finalOemNumber = p.oemNumber && p.oemNumber !== '-'
      ? (extraOems ? `${p.oemNumber} | ${extraOems}` : p.oemNumber)
      : (extraOems || p.oemNumber || '');

    const cleanPart: SparePart = {
      ...p,
      kodeItem: cleanKodeItem,
      oemNumber: finalOemNumber,
    };

    if (!map.has(normKey)) {
      map.set(normKey, cleanPart);
    } else {
      const existing = map.get(normKey)!;
      // Merge best properties
      const merged: SparePart = {
        ...existing,
        oemNumber: existing.oemNumber && existing.oemNumber !== '-' ? existing.oemNumber : cleanPart.oemNumber,
        namaSparepart: existing.namaSparepart.length >= cleanPart.namaSparepart.length ? existing.namaSparepart : cleanPart.namaSparepart,
        stokRealtime: Math.max(Number(existing.stokRealtime || 0), Number(cleanPart.stokRealtime || 0)),
        hargaBeli: (existing.hargaBeli || 0) > 0 ? existing.hargaBeli : cleanPart.hargaBeli,
        hargaJual: (existing.hargaJual || 0) > 0 ? existing.hargaJual : cleanPart.hargaJual,
        lokasiRak: (existing.lokasiRak && existing.lokasiRak !== '-') ? existing.lokasiRak : cleanPart.lokasiRak,
        gambar: (Array.isArray(existing.gambar) && existing.gambar.length > 0) ? existing.gambar : cleanPart.gambar,
        fotoProduk: existing.fotoProduk || cleanPart.fotoProduk
      };
      map.set(normKey, merged);
    }
  });

  return Array.from(map.values());
};

/**
 * Smart Search Helper for Spareparts
 * Matches query against kodeItem, namaSparepart, oemNumber, nomorPartPabrikan, brand, lokasiRak, kategori, deskripsi
 */
export const matchSparePartSearch = (part: SparePart, query: string): boolean => {
  if (!query || !query.trim()) return true;
  if (!part) return false;

  const rawQuery = query.trim().toLowerCase();
  const normQuery = rawQuery.replace(/[^a-z0-9]/gi, '');

  const itemCode = (part.kodeItem || (part as any).partNumber || '').toLowerCase();
  const nama = (part.namaSparepart || '').toLowerCase();
  const oem = (part.oemNumber || (part as any).nomorPartPabrikan || '').toLowerCase();
  const brand = (part.brand || '').toLowerCase();
  const rak = (part.lokasiRak || '').toLowerCase();
  const kategori = (part.kategori || '').toLowerCase();
  const deskripsi = (part.deskripsi || '').toLowerCase();

  const combinedText = `${itemCode} ${nama} ${oem} ${brand} ${rak} ${kategori} ${deskripsi}`;
  const combinedNorm = combinedText.replace(/[^a-z0-9]/gi, '');

  // 1. Direct match
  if (combinedText.includes(rawQuery)) return true;
  if (normQuery && combinedNorm.includes(normQuery)) return true;

  // 2. Multi-term search (all terms must be found)
  const tokens = rawQuery.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    return tokens.every(token => {
      const normToken = token.replace(/[^a-z0-9]/gi, '');
      return combinedText.includes(token) || (normToken && combinedNorm.includes(normToken));
    });
  }

  return false;
};

/**
 * Calculates a relevance score for ranking search results.
 * Direct/exact matches on kodeItem & oemNumber get highest score (1000+).
 * Matches on namaSparepart get medium score (100+).
 * Matches on deskripsi / kategori get lowest score (1-10).
 */
export const getSearchRelevanceScore = (part: SparePart, query: string): number => {
  if (!query || !query.trim()) return 0;

  const rawQuery = query.trim().toLowerCase();
  const normQuery = rawQuery.replace(/[^a-z0-9]/gi, '');

  const itemCode = (part.kodeItem || (part as any).partNumber || '').toLowerCase();
  const normCode = itemCode.replace(/[^a-z0-9]/gi, '');
  const oem = (part.oemNumber || (part as any).nomorPartPabrikan || '').toLowerCase();
  const normOem = oem.replace(/[^a-z0-9]/gi, '');
  const nama = (part.namaSparepart || '').toLowerCase();
  const normNama = nama.replace(/[^a-z0-9]/gi, '');
  const brand = (part.brand || '').toLowerCase();
  const rak = (part.lokasiRak || '').toLowerCase();
  const deskripsi = (part.deskripsi || '').toLowerCase();
  const kategori = (part.kategori || '').toLowerCase();

  let score = 0;

  // 1. Exact match on kodeItem or oemNumber -> Top Priority (1000+)
  if (itemCode === rawQuery || normCode === normQuery) score += 2000;
  else if (itemCode.startsWith(rawQuery) || normCode.startsWith(normQuery)) score += 1200;
  else if (itemCode.includes(rawQuery) || normCode.includes(normQuery)) score += 800;

  // 2. Match on oemNumber -> High Priority (500+)
  if (oem === rawQuery || normOem === normQuery) score += 1000;
  else if (oem.startsWith(rawQuery) || normOem.startsWith(normQuery)) score += 600;
  else if (oem.includes(rawQuery) || normOem.includes(normQuery)) score += 400;

  // 3. Match on namaSparepart -> Medium Priority (100+)
  if (nama.startsWith(rawQuery) || normNama.startsWith(normQuery)) score += 250;
  else if (nama.includes(rawQuery) || normNama.includes(normQuery)) score += 150;

  // 4. Match on brand or lokasiRak -> Low Priority (50+)
  if (brand.includes(rawQuery) || rak.includes(rawQuery)) score += 50;

  // 5. Match on deskripsi or kategori -> Lowest Priority (1-10)
  if (deskripsi.includes(rawQuery) || kategori.includes(rawQuery)) score += 5;

  return score;
};

/**
 * Filters and sorts spareparts by search relevance.
 * Items matching by part number / OEM appear at the top.
 */
export const filterAndSortPartsBySearch = (parts: SparePart[], query: string): SparePart[] => {
  const trimmed = query.trim();
  const matched = parts.filter(p => matchSparePartSearch(p, trimmed));
  if (!trimmed) return matched;

  return matched.sort((a, b) => {
    const scoreA = getSearchRelevanceScore(a, trimmed);
    const scoreB = getSearchRelevanceScore(b, trimmed);
    return scoreB - scoreA;
  });
};
