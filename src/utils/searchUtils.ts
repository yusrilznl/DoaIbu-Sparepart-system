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
    const normKey = normalizePartCode(rawCode);
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
