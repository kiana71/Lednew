/**
 * Media Uploader Component
 *
 * Reusable drag-and-drop file uploader for images and videos.
 *
 * Accepted formats:
 *   Images  – jpg, jpeg, png, gif, webp, svg  (max 10 MB)
 *   Videos  – mp4, mov, avi, webm, mkv        (max 20 MB)
 *
 * Features:
 *   - Drag & drop or click-to-browse
 *   - Type / size validation with inline error messages
 *   - Simulated upload progress bar
 *   - Rich preview card with clickable lightbox
 *   - Video playback in lightbox
 *   - Remove & re-add flow
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '../ui/dialog';
import {
  UploadCloud,
  X,
  FileVideo,
  FileImage,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Eye,
  Play,
  Download,
  Trash2,
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'webm', 'mkv'];

const IMAGE_MIME_PREFIXES = ['image/'];
const VIDEO_MIME_PREFIXES = ['video/'];

const IMAGE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const VIDEO_MAX_BYTES = 20 * 1024 * 1024; // 20 MB

const ACCEPT_STRING = [
  ...IMAGE_EXTENSIONS.map((e) => `.${e}`),
  ...VIDEO_EXTENSIONS.map((e) => `.${e}`),
].join(',');

// ── Types ────────────────────────────────────────────────────────────

export interface UploadedFile {
  file: File;
  previewUrl: string | null;
  type: 'image' | 'video';
}

type UploaderState = 'idle' | 'uploading' | 'complete' | 'error';

interface MediaUploaderProps {
  /** Called with the file data when upload completes, or null on remove. */
  value: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
  /** Optional label shown above the drop zone. */
  label?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

function getExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function classifyFile(file: File): 'image' | 'video' | null {
  const ext = getExtension(file.name);
  if (IMAGE_EXTENSIONS.includes(ext) || IMAGE_MIME_PREFIXES.some((p) => file.type.startsWith(p))) {
    return 'image';
  }
  if (VIDEO_EXTENSIONS.includes(ext) || VIDEO_MIME_PREFIXES.some((p) => file.type.startsWith(p))) {
    return 'video';
  }
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Component ────────────────────────────────────────────────────────

export function MediaUploader({ value, onChange, label }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploaderState>(value ? 'complete' : 'idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Keep state in sync if the parent clears `value` externally
  useEffect(() => {
    if (!value && state === 'complete') {
      setState('idle');
      setProgress(0);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Validation ─────────────────────────────────────────────────

  const validate = useCallback((file: File): string | null => {
    const kind = classifyFile(file);
    if (!kind) {
      const ext = getExtension(file.name);
      return `".${ext}" is not a supported format. Please upload an image (${IMAGE_EXTENSIONS.join(', ')}) or video (${VIDEO_EXTENSIONS.join(', ')}).`;
    }
    if (kind === 'image' && file.size > IMAGE_MAX_BYTES) {
      return `Image exceeds the 10 MB limit (${formatBytes(file.size)}). Please choose a smaller file.`;
    }
    if (kind === 'video' && file.size > VIDEO_MAX_BYTES) {
      return `Video exceeds the 20 MB limit (${formatBytes(file.size)}). Please choose a smaller file.`;
    }
    return null;
  }, []);

  // ── Simulated upload ──────────────────────────────────────────

  const simulateUpload = useCallback(
    (file: File, kind: 'image' | 'video') => {
      setState('uploading');
      setProgress(0);
      setError(null);

      // Build preview URL for both images and videos
      const previewUrl = URL.createObjectURL(file);

      let current = 0;
      const interval = setInterval(() => {
        current += Math.random() * 18 + 6;
        if (current >= 100) {
          current = 100;
          clearInterval(interval);
          setProgress(100);
          setTimeout(() => {
            setState('complete');
            onChange({ file, previewUrl, type: kind });
          }, 350);
        } else {
          setProgress(Math.round(current));
        }
      }, 120);
    },
    [onChange],
  );

  // ── File selection handler ────────────────────────────────────

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validate(file);
      if (validationError) {
        setState('error');
        setError(validationError);
        return;
      }
      const kind = classifyFile(file)!;
      simulateUpload(file, kind);
    },
    [validate, simulateUpload],
  );

  // ── Drag & Drop ───────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      handleFile(file);
    },
    [handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      handleFile(file);
      e.target.value = '';
    },
    [handleFile],
  );

  // ── Remove ────────────────────────────────────────────────────

  const handleRemove = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl);
      onChange(null);
      setState('idle');
      setProgress(0);
      setError(null);
      setLightboxOpen(false);
    },
    [value, onChange],
  );

  // ── Retry (after error) ───────────────────────────────────────

  const handleRetry = useCallback(() => {
    setState('idle');
    setError(null);
    inputRef.current?.click();
  }, []);

  // ── Download helper ───────────────────────────────────────────

  const handleDownload = useCallback(() => {
    if (!value?.previewUrl) return;
    const a = document.createElement('a');
    a.href = value.previewUrl;
    a.download = value.file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [value]);

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="space-y-2">
      {label && <p className="text-sm text-muted-foreground">{label}</p>}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_STRING}
        onChange={handleInputChange}
        className="sr-only"
        aria-label="Upload media file"
      />

      {/* ── Idle / Drop Zone ─────────────────────────────────── */}
      {state === 'idle' && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            w-full rounded-lg border-2 border-dashed transition-all duration-200
            flex flex-col items-center justify-center gap-2 py-8 cursor-pointer
            ${
              isDragOver
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-muted-foreground/25 hover:border-muted-foreground/40 hover:bg-accent/40'
            }
          `}
        >
          <div
            className={`size-10 rounded-full flex items-center justify-center transition-colors ${
              isDragOver ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}
          >
            <UploadCloud className="size-5" />
          </div>
          <div className="text-center">
            <p className="text-sm">
              <span className="text-primary">Click to upload</span>
              <span className="text-muted-foreground"> or drag and drop</span>
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Images up to 10 MB &middot; Videos up to 20 MB
            </p>
            <p className="text-[11px] text-muted-foreground/50 mt-0.5">
              JPG, PNG, GIF, WebP, SVG, MP4, MOV, AVI, WebM, MKV
            </p>
          </div>
        </button>
      )}

      {/* ── Uploading ────────────────────────────────────────── */}
      {state === 'uploading' && (
        <div className="w-full rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <UploadCloud className="size-4 text-primary animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">Uploading...</p>
              <p className="text-xs text-muted-foreground">{progress}% complete</p>
            </div>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* ── Complete / Preview Card ──────────────────────────── */}
      {state === 'complete' && value && (
        <div className="w-full rounded-lg border border-border bg-card overflow-hidden transition-all duration-300">
          {/* Clickable preview area */}
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="w-full relative group cursor-pointer focus:outline-none"
          >
            {value.type === 'image' && value.previewUrl ? (
              <div className="relative w-full h-36 bg-muted">
                <img
                  src={value.previewUrl}
                  alt={value.file.name}
                  className="w-full h-full object-contain"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 bg-white/90 text-zinc-800 rounded-full px-3 py-1.5 text-xs shadow-sm">
                    <Eye className="size-3.5" />
                    Preview
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-36 bg-muted flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="size-14 rounded-xl bg-background/80 flex items-center justify-center shadow-sm">
                    <FileVideo className="size-7 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Video file</p>
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 bg-white/90 text-zinc-800 rounded-full px-3 py-1.5 text-xs shadow-sm">
                    <Play className="size-3.5" />
                    Play
                  </div>
                </div>
              </div>
            )}
          </button>

          {/* File info bar */}
          <div className="flex items-center gap-3 px-3 py-2.5 border-t">
            <div className="size-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
              {value.type === 'image' ? (
                <FileImage className="size-4 text-muted-foreground" />
              ) : (
                <FileVideo className="size-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{value.file.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {formatBytes(value.file.size)}
                </span>
                <span className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="size-3" />
                  Ready
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => handleRemove(e)}
              className="flex-shrink-0 size-8 p-0 text-muted-foreground hover:text-destructive"
              aria-label="Remove file"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────── */}
      {state === 'error' && error && (
        <div className="w-full rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertCircle className="size-4 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-destructive">Upload failed</p>
              <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="gap-1.5 text-xs h-7"
            >
              <RotateCcw className="size-3" />
              Try Again
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setState('idle');
                setError(null);
              }}
              className="text-xs h-7 text-muted-foreground"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* ── Lightbox Dialog ──────────────────────────────────── */}
      {value && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-4xl w-[95vw] p-0 gap-0 border-none bg-zinc-950 overflow-hidden rounded-xl shadow-2xl [&>button]:text-white/70 [&>button]:hover:text-white [&>button]:top-3 [&>button]:right-3 [&>button]:z-20">
            <DialogTitle className="sr-only">
              {value.file.name}
            </DialogTitle>

            {/* Media area */}
            <div className="relative w-full flex items-center justify-center bg-zinc-950 min-h-[40vh] max-h-[75vh]">
              {value.type === 'image' && value.previewUrl ? (
                <img
                  src={value.previewUrl}
                  alt={value.file.name}
                  className="max-w-full max-h-[75vh] object-contain select-none"
                  draggable={false}
                />
              ) : value.type === 'video' && value.previewUrl ? (
                <video
                  src={value.previewUrl}
                  controls
                  autoPlay
                  className="max-w-full max-h-[75vh] outline-none"
                  controlsList="nodownload"
                >
                  Your browser does not support video playback.
                </video>
              ) : null}
            </div>

            {/* Bottom info bar */}
            <div className="flex items-center gap-3 px-5 py-3.5 bg-zinc-900 border-t border-zinc-800">
              <div className="size-8 rounded-md bg-zinc-800 flex items-center justify-center flex-shrink-0">
                {value.type === 'image' ? (
                  <FileImage className="size-4 text-zinc-400" />
                ) : (
                  <FileVideo className="size-4 text-zinc-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">{value.file.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {formatBytes(value.file.size)}
                  {' \u00B7 '}
                  {value.type === 'image' ? 'Image' : 'Video'}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="size-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  aria-label="Download file"
                >
                  <Download className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleRemove(e)}
                  className="size-8 p-0 text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
                  aria-label="Delete file"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
