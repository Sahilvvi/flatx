'use client';

import { useRef, useState } from 'react';

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

interface UploadError {
  name: string;
  message: string;
}

export function ImageUploader({ value, onChange, maxFiles = 6 }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(0);
  const [errors, setErrors] = useState<UploadError[]>([]);

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const remaining = maxFiles - value.length;
    const picked = Array.from(files).slice(0, remaining);
    const newErrors: UploadError[] = [];
    setUploading((u) => u + picked.length);
    const uploaded: string[] = [];

    for (const file of picked) {
      try {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/uploads', { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok) {
          // Fallback: client-side preview only. URL lasts for the tab session.
          if (res.status === 503) {
            uploaded.push(URL.createObjectURL(file));
            newErrors.push({
              name: file.name,
              message: 'Preview only — Supabase Storage not configured.',
            });
          } else {
            newErrors.push({ name: file.name, message: data.error ?? 'Upload failed' });
          }
        } else if (typeof data.url === 'string') {
          uploaded.push(data.url);
        }
      } catch (err) {
        newErrors.push({
          name: file.name,
          message: err instanceof Error ? err.message : 'Network error',
        });
      } finally {
        setUploading((u) => u - 1);
      }
    }

    if (uploaded.length) onChange([...value, ...uploaded]);
    if (newErrors.length) setErrors((e) => [...e, ...newErrors]);
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {value.map((url, idx) => (
          <div
            key={url + idx}
            className="relative aspect-square rounded-md overflow-hidden bg-slate-100 border border-slate-200"
          >
            {/* We use <img> here because uploaded URLs are arbitrary hosts
                and we don't want to enumerate them in next.config. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(idx)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 text-xs"
              aria-label="Remove"
            >
              ✕
            </button>
          </div>
        ))}

        {value.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-md border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center text-slate-500 text-xs"
          >
            <span className="text-xl">📷</span>
            <span className="mt-1">{uploading > 0 ? 'Uploading…' : 'Add photo'}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <p className="text-[11px] text-slate-500">
        Up to {maxFiles} photos · JPG / PNG / WEBP · max 5 MB each.
      </p>

      {errors.length > 0 && (
        <ul className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2 space-y-1">
          {errors.map((e, i) => (
            <li key={i}>
              <span className="font-semibold">{e.name}:</span> {e.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

