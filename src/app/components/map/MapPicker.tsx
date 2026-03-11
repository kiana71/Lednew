/**
 * Interactive Map Picker Component
 * 
 * Uses Photon (OpenStreetMap-based) geocoding API for address autocomplete
 * Clean shadcn/ui design
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, MapPin, Loader2, X } from 'lucide-react';
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

interface LocationData {
  name: string;
  lat: number;
  lng: number;
}

interface MapPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLocation?: LocationData;
  onLocationSelect: (location: LocationData) => void;
}

interface PhotonFeature {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
    county?: string;
    district?: string;
    osm_value?: string;
  };
}

const DEFAULT_CENTER: [number, number] = [43.6532, -79.3832]; // Toronto

export function MapPicker({ open, onOpenChange, initialLocation, onLocationSelect }: MapPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<PhotonFeature[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>(DEFAULT_CENTER);
  const [locationName, setLocationName] = useState('');
  
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  // Track which position the map was last panned to, to avoid re-setting view unnecessarily
  const lastViewedPositionRef = useRef<[number, number] | null>(null);

  // ── helpers ────────────────────────────────────────────────────────────

  const destroyMap = useCallback(() => {
    if (mapRef.current) {
      try { mapRef.current.remove(); } catch {}
      mapRef.current = null;
      markerRef.current = null;
      lastViewedPositionRef.current = null;
    }
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}&lang=en`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const location = formatLocationName(data.features[0]);
        setLocationName(location);
        setSearchQuery(location);
      } else {
        const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setLocationName(fallback);
        setSearchQuery(fallback);
      }
    } catch {
      const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setLocationName(fallback);
      setSearchQuery(fallback);
    }
  }, []);

  // ── reset state when dialog opens ──────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    if (initialLocation) {
      setSelectedPosition([initialLocation.lat, initialLocation.lng]);
      setLocationName(initialLocation.name);
      setSearchQuery(initialLocation.name);
    } else {
      setSelectedPosition(DEFAULT_CENTER);
      setLocationName('');
      setSearchQuery('');
    }
    setSearchSuggestions([]);
    setShowSuggestions(false);
  }, [open, initialLocation]);

  // ── map lifecycle ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) {
      destroyMap();
      return;
    }

    const container = mapContainerRef.current;
    if (!container) return;

    // Determine starting position (prefer initialLocation over default)
    const startPos: [number, number] = initialLocation
      ? [initialLocation.lat, initialLocation.lng]
      : DEFAULT_CENTER;

    // Wait for dialog open animation to finish so the container has dimensions
    const initTimer = setTimeout(() => {
      if (!mapContainerRef.current || mapRef.current) return;

      try {
        const map = L.map(mapContainerRef.current, {
          center: startPos,
          zoom: 13,
          zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(map);

        const marker = L.marker(startPos, {
          draggable: true,
          icon: defaultIcon,
        }).addTo(map);

        map.on('click', async (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          setSelectedPosition([lat, lng]);
          lastViewedPositionRef.current = [lat, lng];
          await reverseGeocode(lat, lng);
        });

        marker.on('dragend', async () => {
          const pos = marker.getLatLng();
          setSelectedPosition([pos.lat, pos.lng]);
          lastViewedPositionRef.current = [pos.lat, pos.lng];
          await reverseGeocode(pos.lat, pos.lng);
        });

        mapRef.current = map;
        markerRef.current = marker;
        lastViewedPositionRef.current = startPos;

        // Force multiple invalidateSize to cover timing edge-cases
        const sizes = [100, 300, 600, 1000];
        sizes.forEach((ms) => {
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.invalidateSize();
            }
          }, ms);
        });
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, 350); // wait for dialog CSS transition

    return () => {
      clearTimeout(initTimer);
      destroyMap();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── pan map when selectedPosition changes (e.g. from autocomplete) ──

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !open) return;
    // Skip if position hasn't actually changed from where the map already is
    const last = lastViewedPositionRef.current;
    if (last && last[0] === selectedPosition[0] && last[1] === selectedPosition[1]) return;

    mapRef.current.setView(selectedPosition, 13, { animate: true });
    markerRef.current.setLatLng(selectedPosition);
    lastViewedPositionRef.current = selectedPosition;
  }, [selectedPosition, open]);

  // ── autocomplete using Photon (OpenStreetMap-based) ───────────────────

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const query = searchQuery.trim();
        const response = await fetch(
          `https://photon.komoot.io/api/?` +
          `q=${encodeURIComponent(query)}` +
          `&limit=25` +
          `&lat=43.6532` +
          `&lon=-79.3832` +
          `&lang=en`
        );
        const data = await response.json();
        const features: PhotonFeature[] = data.features || [];

        const ontarioResults = features.filter((f) => {
          const props = f.properties;
          const state = props.state?.toLowerCase() || '';
          const country = props.country?.toLowerCase() || '';
          return country.includes('canada') &&
            (state.includes('ontario') || state === '' || !props.state);
        });

        setSearchSuggestions(ontarioResults.slice(0, 20));
        setShowSuggestions(ontarioResults.length > 0);
      } catch {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // ── close suggestions on outside click ────────────────────────────────

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  // ── formatting ────────────────────────────────────────────────────────

  const formatLocationName = (feature: PhotonFeature): string => {
    const props = feature.properties;
    const parts: string[] = [];

    if (props.housenumber && props.street) {
      parts.push(`${props.housenumber} ${props.street}`);
    } else if (props.street) {
      parts.push(props.street);
    } else if (props.name) {
      parts.push(props.name);
    }

    if (props.city) parts.push(props.city);
    else if (props.district) parts.push(props.district);

    if (props.state) parts.push(props.state);
    if (props.postcode) parts.push(props.postcode);
    if (props.country && parts.length > 0) parts.push(props.country);

    return parts.length > 0 ? parts.join(', ') : 'Location';
  };

  // ── actions ───────────────────────────────────────────────────────────

  const selectSuggestion = (feature: PhotonFeature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const location = formatLocationName(feature);

    setSearchQuery(location);
    setSelectedPosition([lat, lng]);
    setLocationName(location);
    setShowSuggestions(false);
  };

  const handleConfirm = () => {
    onLocationSelect({
      name: locationName || searchQuery || `${selectedPosition[0].toFixed(6)}, ${selectedPosition[1].toFixed(6)}`,
      lat: selectedPosition[0],
      lng: selectedPosition[1],
    });
    onOpenChange(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && searchSuggestions.length > 0) {
        selectSuggestion(searchSuggestions[0]);
      } else if (searchQuery.trim()) {
        setLocationName(searchQuery.trim());
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleManualEntry = () => {
    if (searchQuery.trim()) {
      setLocationName(searchQuery.trim());
      setShowSuggestions(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle>Select Installation Location</DialogTitle>
          <DialogDescription>
            Search for an address, postal code, or enter a custom location name.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 space-y-4 min-h-0">
          {/* Search */}
          <div className="relative" ref={suggestionsRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10" />
            <Input
              placeholder='Search address, postal code, or type a custom name...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              onFocus={() => {
                if (searchSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              className="pl-9 pr-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-popover border rounded-md shadow-md z-[9999] max-h-[240px] overflow-y-auto">
                <div className="p-1">
                  {searchSuggestions.map((feature, index) => {
                    const props = feature.properties;
                    const hasAddress = props.housenumber && props.street;
                    const mainText = hasAddress
                      ? `${props.housenumber} ${props.street}`
                      : (props.street || props.name || 'Location');
                    const subText = [props.city, props.state, props.postcode].filter(Boolean).join(', ');

                    return (
                      <div
                        key={`${feature.geometry.coordinates[0]}-${feature.geometry.coordinates[1]}-${index}`}
                        className="flex items-start gap-2.5 px-3 py-2 cursor-pointer rounded-sm hover:bg-accent transition-colors"
                        onClick={() => selectSuggestion(feature)}
                      >
                        <MapPin className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{mainText}</p>
                          {subText && <p className="text-xs text-muted-foreground truncate">{subText}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No results - allow custom entry */}
            {!isSearching && !showSuggestions && searchSuggestions.length === 0 && searchQuery.trim().length >= 2 && !locationName && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-popover border rounded-md shadow-md z-[9999] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">No results found</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Use &ldquo;{searchQuery}&rdquo; as a custom location name
                    </p>
                  </div>
                  <Button
                    onClick={handleManualEntry}
                    size="sm"
                    variant="outline"
                  >
                    Use Name
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Selected Location */}
          {locationName && (
            <div className="flex items-start justify-between gap-3 rounded-md border bg-muted/50 px-3 py-2.5">
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <MapPin className="size-4 text-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground break-words">{locationName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 flex-shrink-0"
                onClick={() => {
                  setLocationName('');
                  setSearchQuery('');
                }}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          )}

          {/* Map */}
          <div className="rounded-md border overflow-hidden relative" style={{ zIndex: 0 }}>
            <div
              ref={mapContainerRef}
              className="w-full bg-muted"
              style={{ height: '300px', minHeight: '300px' }}
            />
          </div>

          <p className="text-xs text-muted-foreground pb-1">
            Click on the map or drag the marker to set precise coordinates.
          </p>
        </div>

        <DialogFooter className="px-6 py-4 flex-shrink-0 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!locationName && !searchQuery}
          >
            Confirm Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
