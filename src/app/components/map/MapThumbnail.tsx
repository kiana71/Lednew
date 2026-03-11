/**
 * Map Thumbnail Component
 * 
 * Displays a compact map preview with location info using shadcn styling.
 * Read-only — no interaction, just a static tile view with a marker.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { MapPin, X, Pencil } from 'lucide-react';
import { Button } from '../ui/button';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Build custom icon with CDN URLs so Leaflet never looks for local assets
const defaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapThumbnailProps {
  lat: number;
  lng: number;
  locationName?: string;
  onEdit: () => void;
  onClear?: () => void;
  className?: string;
}

export function MapThumbnail({ lat, lng, locationName, onEdit, onClear, className = '' }: MapThumbnailProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const destroyMap = useCallback(() => {
    if (mapRef.current) {
      try { mapRef.current.remove(); } catch {}
      mapRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Clean up any old map first
    destroyMap();

    const container = mapContainerRef.current;
    if (!container) return;

    // Allow time for parent dialog / DOM to settle
    const initTimer = setTimeout(() => {
      if (!mapContainerRef.current) return;
      // Guard against double init if the ref is still set from a race
      if (mapRef.current) return;

      try {
        const map = L.map(mapContainerRef.current, {
          center: [lat, lng],
          zoom: 14,
          zoomControl: false,
          dragging: false,
          touchZoom: false,
          doubleClickZoom: false,
          scrollWheelZoom: false,
          boxZoom: false,
          keyboard: false,
          attributionControl: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(map);

        L.marker([lat, lng], { icon: defaultIcon }).addTo(map);

        mapRef.current = map;

        // Force repeated invalidateSize so tiles render even if the
        // container was obscured by another dialog overlay at mount time
        const delays = [50, 200, 500, 1000, 2000];
        delays.forEach((ms) => {
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.invalidateSize();
            }
          }, ms);
        });
      } catch (error) {
        console.error('Error creating map thumbnail:', error);
      }
    }, 250);

    return () => {
      clearTimeout(initTimer);
      destroyMap();
    };
  }, [lat, lng, destroyMap]);

  return (
    <div className={`w-full rounded-md border overflow-hidden ${className}`}>
      {/* Location info header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/50">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <MapPin className="size-3.5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate">
              {locationName || 'Selected Location'}
            </p>
            <p className="text-xs text-muted-foreground">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="h-7 px-2 gap-1"
          >
            <Pencil className="size-3" />
            Edit
          </Button>
          {onClear && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="h-7 px-2 gap-1 text-destructive hover:text-destructive"
            >
              <X className="size-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Map Display */}
      <div
        ref={mapContainerRef}
        className="w-full bg-muted cursor-pointer"
        style={{ height: '160px', minHeight: '160px', position: 'relative', zIndex: 0 }}
        onClick={onEdit}
        title="Click to change location"
      />
    </div>
  );
}
