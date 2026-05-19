import { describe, it, expect } from 'vitest';
import { getOptimizedImageUrl, getResponsiveSrcSet } from './imageOptimizer';

describe('getOptimizedImageUrl', () => {
  it('returns empty string for null/undefined input', () => {
    expect(getOptimizedImageUrl(null)).toBe('');
    expect(getOptimizedImageUrl(undefined)).toBe('');
    expect(getOptimizedImageUrl('')).toBe('');
  });

  it('leaves data: and blob: URIs untouched', () => {
    expect(getOptimizedImageUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
    expect(getOptimizedImageUrl('blob:http://example.com/123')).toBe('blob:http://example.com/123');
  });

  it('transforms Supabase Storage URLs to render endpoint with params', () => {
    const url = 'https://abc.supabase.co/storage/v1/object/public/vehicle-images/foo.jpg';
    const result = getOptimizedImageUrl(url, { width: 400, height: 300, quality: 80 });

    expect(result).toContain('/storage/v1/render/image/public/');
    expect(result).toContain('width=400');
    expect(result).toContain('height=300');
    expect(result).toContain('quality=80');
    expect(result).toContain('resize=cover');
  });

  it('rewrites Pexels URLs with width/height params', () => {
    const url = 'https://images.pexels.com/photos/123/photo.jpg?auto=compress';
    const result = getOptimizedImageUrl(url, { width: 600, height: 400 });

    expect(result).toContain('images.pexels.com');
    expect(result).toContain('w=600');
    expect(result).toContain('h=400');
    expect(result).toContain('auto=compress');
    expect(result).toContain('fit=crop');
  });

  it('leaves unknown CDN URLs unchanged', () => {
    const url = 'https://random-cdn.example.com/img.jpg';
    expect(getOptimizedImageUrl(url, { width: 400 })).toBe(url);
  });

  it('uses default quality 75 when not specified', () => {
    const url = 'https://abc.supabase.co/storage/v1/object/public/bucket/img.jpg';
    const result = getOptimizedImageUrl(url, { width: 400 });
    expect(result).toContain('quality=75');
  });
});

describe('getResponsiveSrcSet', () => {
  it('returns empty string for null URL', () => {
    expect(getResponsiveSrcSet(null, 400)).toBe('');
  });

  it('returns 1x and 2x variants for Supabase URLs', () => {
    const url = 'https://abc.supabase.co/storage/v1/object/public/bucket/img.jpg';
    const result = getResponsiveSrcSet(url, 400);
    expect(result).toMatch(/^.+ 1x, .+ 2x$/);
    expect(result).toContain('width=400');
    expect(result).toContain('width=800');
  });
});
