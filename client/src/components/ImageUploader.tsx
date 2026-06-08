'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { t } from '../lib/i18n';

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  /** Single-image mode: replace instead of append, hide the counter. */
  single?: boolean;
}

/**
 * Drag-and-drop / click image uploader. Sends files to the API (POST /uploads),
 * stores the returned URLs and renders removable previews. Replaces the old
 * "paste a CDN URL" inputs everywhere images are needed.
 */
export default function ImageUploader({
  value,
  onChange,
  max = 10,
  single = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const limit = single ? 1 : max;
  const atLimit = value.length >= limit;

  const uploadFiles = async (files: FileList | File[]) => {
    setError(null);
    const list = Array.from(files);
    if (list.length === 0) return;

    const room = limit - (single ? 0 : value.length);
    const toUpload = single ? list.slice(0, 1) : list.slice(0, Math.max(0, room));
    if (toUpload.length === 0) return;

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of toUpload) {
        const form = new FormData();
        form.append('file', file);
        const { data } = await api.post('/uploads', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        urls.push(data.data.url);
      }
      onChange(single ? urls.slice(0, 1) : [...value, ...urls]);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        t.imageUploader.error;
      setError(message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div>
      {value.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-[var(--color-bg)]"
            >
              <Image src={url} alt="" fill sizes="120px" className="object-cover" />
              <button
                type="button"
                onClick={() => removeAt(idx)}
                aria-label={t.imageUploader.remove}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      {!atLimit && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void uploadFiles(e.dataTransfer.files);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
            dragging
              ? 'border-brand-400 bg-brand-50'
              : 'border-border hover:border-brand-300 hover:bg-gray-50'
          }`}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-brand-500" aria-hidden />
          ) : (
            <Upload className="h-6 w-6 text-brand-500" aria-hidden />
          )}
          <span className="text-sm font-semibold text-brand-900">
            {uploading ? t.imageUploader.uploading : t.imageUploader.cta}
          </span>
          <span className="text-xs text-muted">{t.imageUploader.hint}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={!single}
        className="hidden"
        onChange={(e) => e.target.files && void uploadFiles(e.target.files)}
      />

      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
