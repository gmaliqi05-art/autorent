/**
 * 🔒 PROTECTED FILE — DO NOT DELETE OR REVERT
 *
 * Image optimization helper for Supabase Storage and Pexels.
 * Used by VehicleCard, VehicleDetailPage, etc. for srcset/lazy loading.
 *
 * If bolt.new tries to remove this file: STOP and ask the user.
 *
 * Helper qe shton parametra transformimi te URL-ve te imazheve.
 *
 * - Per imazhe Supabase Storage (URL permban "/storage/v1/object/public/"):
 *   ridrejton ne "/storage/v1/render/image/public/" me parametra width/height/quality.
 * - Per imazhe te jashtme (Pexels etj): le URL-n te paprekur — ato e bejne resize nga ana e tyre.
 * - Per data: URI ose URL bosh: kthen URL-n origjinale.
 */

interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100, default 75
  resize?: 'cover' | 'contain' | 'fill';
}

const SUPABASE_OBJECT_PATH = '/storage/v1/object/public/';
const SUPABASE_RENDER_PATH = '/storage/v1/render/image/public/';

export function getOptimizedImageUrl(
  url: string | null | undefined,
  options: ImageOptions = {},
): string {
  if (!url) return '';

  // Data URIs / blob — leji ashtu
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;

  const { width, height, quality = 75, resize = 'cover' } = options;

  // Supabase Storage URL — perdor transformations
  if (url.includes(SUPABASE_OBJECT_PATH)) {
    const transformedUrl = url.replace(SUPABASE_OBJECT_PATH, SUPABASE_RENDER_PATH);
    const params = new URLSearchParams();
    if (width) params.set('width', String(width));
    if (height) params.set('height', String(height));
    if (quality) params.set('quality', String(quality));
    if (resize) params.set('resize', resize);
    return `${transformedUrl}?${params.toString()}`;
  }

  // Pexels URLs — kane parametra qe i kontrollojme
  if (url.includes('images.pexels.com')) {
    try {
      const parsed = new URL(url);
      if (width) parsed.searchParams.set('w', String(width));
      if (height) parsed.searchParams.set('h', String(height));
      parsed.searchParams.set('auto', 'compress');
      parsed.searchParams.set('cs', 'tinysrgb');
      if (resize === 'cover') parsed.searchParams.set('fit', 'crop');
      return parsed.toString();
    } catch {
      return url;
    }
  }

  // CDN tjeter — le URL-n pa ndryshim
  return url;
}

/**
 * Helper per srcset (responsive images).
 * Kthen vlerat per 1x, 2x DPI.
 */
export function getResponsiveSrcSet(
  url: string | null | undefined,
  baseWidth: number,
  options: Omit<ImageOptions, 'width'> = {},
): string {
  if (!url) return '';
  const url1x = getOptimizedImageUrl(url, { ...options, width: baseWidth });
  const url2x = getOptimizedImageUrl(url, { ...options, width: baseWidth * 2 });
  return `${url1x} 1x, ${url2x} 2x`;
}
