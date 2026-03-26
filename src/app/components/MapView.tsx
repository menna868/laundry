"use client";

interface MapViewProps {
  latitude: number;
  longitude: number;
  label?: string;
}

export function MapView({ latitude, longitude, label = "Selected location" }: MapViewProps) {
  const delta = 0.008;
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ].join("%2C");
  const marker = `${latitude}%2C${longitude}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
      <iframe
        title={label}
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`}
        className="h-64 w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
