"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

export function GeoDetect() {
  const [state, setState] = useState<"idle" | "locating" | "denied">("idle");

  function locate() {
    if (!navigator.geolocation) {
      setState("denied");
      return;
    }
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const params = new URLSearchParams({
          lat: position.coords.latitude.toFixed(4),
          lng: position.coords.longitude.toFixed(4),
        });
        window.location.assign(`/near?${params.toString()}`);
      },
      () => setState("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={locate}
        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950"
      >
        <MapPin className="size-4" aria-hidden="true" />
        {state === "locating" ? "Finding you" : "Use my location"}
      </button>
      {state === "denied" ? (
        <p className="mt-3 text-sm text-slate-200">Location permission was blocked. Search a city, zip, or postcode instead.</p>
      ) : (
        <p className="mt-3 text-sm text-slate-300">One tap reads this browser position. It is not stored as an account.</p>
      )}
    </div>
  );
}
