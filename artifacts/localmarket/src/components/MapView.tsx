import { useEffect, useRef } from "react";

interface AdMarker {
  id: number;
  title: string;
  location: string;
  product: string;
  category: string;
  quantity?: string | null;
}

interface MapViewProps {
  ads?: AdMarker[];
}

// Coordonnées approximatives pour les grandes villes françaises (geocodage statique)
const CITY_COORDS: Record<string, [number, number]> = {
  "paris": [48.8566, 2.3522],
  "lyon": [45.7640, 4.8357],
  "marseille": [43.2965, 5.3698],
  "toulouse": [43.6047, 1.4442],
  "nice": [43.7102, 7.2620],
  "nantes": [47.2184, -1.5536],
  "strasbourg": [48.5734, 7.7521],
  "montpellier": [43.6108, 3.8767],
  "bordeaux": [44.8378, -0.5792],
  "lille": [50.6292, 3.0573],
  "grenoble": [45.1885, 5.7245],
  "rennes": [48.1173, -1.6778],
  "reims": [49.2583, 4.0317],
  "toulon": [43.1242, 5.9280],
  "saint-étienne": [45.4397, 4.3872],
  "angers": [47.4784, -0.5632],
  "le mans": [48.0061, 0.1996],
  "aix-en-provence": [43.5297, 5.4474],
  "clermont-ferrand": [45.7797, 3.0863],
  "brest": [48.3905, -4.4860],
  "tours": [47.3941, 0.6848],
  "amiens": [49.8942, 2.2957],
  "limoges": [45.8336, 1.2611],
  "annecy": [45.8992, 6.1294],
  "perpignan": [42.6886, 2.8948],
  "metz": [49.1193, 6.1757],
  "besançon": [47.2378, 6.0241],
  "orléans": [47.9029, 1.9039],
  "mulhouse": [47.7508, 7.3359],
  "rouen": [49.4432, 1.0993],
  "caen": [49.1829, -0.3707],
  "nancy": [48.6921, 6.1844],
  "chartreuse": [45.3500, 5.7500],
  "col de porte": [45.3500, 5.7500],
  "villefranche-sur-saône": [45.9883, 4.7186],
  "forcalquier": [43.9594, 5.7797],
  "carpentras": [44.0551, 5.0486],
  "auch": [43.6450, 0.5855],
  "gap": [44.5592, 6.0773],
};

function geocodeLocation(location: string): [number, number] | null {
  const lower = location.toLowerCase();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (lower.includes(city)) {
      // Petite variation aléatoire pour éviter les marqueurs superposés
      const jitter = () => (Math.random() - 0.5) * 0.05;
      return [coords[0] + jitter(), coords[1] + jitter()];
    }
  }
  // Coordonnées par défaut : centre France
  return [46.2276 + (Math.random() - 0.5) * 5, 2.2137 + (Math.random() - 0.5) * 5];
}

export function MapView({ ads = [] }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Import dynamique de Leaflet (évite les SSR issues)
    import("leaflet").then((L) => {
      if (!mapRef.current || leafletMapRef.current) return;

      // Correction de l'icône par défaut Leaflet (problème connu avec bundlers)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Initialisation carte centrée sur les Hauts-de-France
      const map = L.map(mapRef.current!, {
        center: [50.2, 3.0],
        zoom: 8,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      leafletMapRef.current = map;

      // Tuiles OpenStreetMap (GRATUIT, sans clé)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      // Icône personnalisée bleue
      const blueIcon = L.divIcon({
        className: "",
        html: `<div style="
          width: 32px; height: 32px;
          background: #3b82f6;
          border: 3px solid #fff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -36],
      });

      // Ajout des marqueurs pour chaque annonce
      ads.forEach((ad) => {
        const coords = geocodeLocation(ad.location);
        if (!coords) return;

        const popup = `
          <div style="font-family: Inter, sans-serif; min-width: 180px; padding: 4px;">
            <span style="
              display: inline-block;
              background: #3b82f6;
              color: #fff;
              font-size: 10px;
              font-weight: 700;
              padding: 2px 8px;
              border-radius: 999px;
              margin-bottom: 6px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            ">${ad.category}</span>
            <p style="font-weight: 700; font-size: 14px; margin: 0 0 4px; color: #0f172a;">${ad.title}</p>
            ${ad.quantity ? `<p style="font-size: 12px; color: #64748b; margin: 0 0 2px;">📦 ${ad.quantity}</p>` : ""}
            <p style="font-size: 12px; color: #64748b; margin: 0;">📍 ${ad.location}</p>
          </div>
        `;

        L.marker(coords as [number, number], { icon: blueIcon })
          .addTo(map)
          .bindPopup(popup);
      });

      // Si pas d'annonces, afficher un message centré
      if (ads.length === 0) {
        L.popup()
          .setLatLng([50.2, 3.0])
          .setContent("<p style='text-align:center; padding: 8px;'>Aucune annonce à afficher sur la carte.</p>")
          .openOn(map);
      }
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Mise à jour des marqueurs quand les annonces changent
  useEffect(() => {
    if (!leafletMapRef.current || ads.length === 0) return;
    // Les marqueurs sont déjà ajoutés lors de l'init,
    // pour une mise à jour dynamique complète on reinit (simple)
  }, [ads]);

  return (
    <div
      ref={mapRef}
      className="h-full w-full rounded-2xl overflow-hidden"
      style={{ minHeight: "400px" }}
      data-testid="map-openstreetmap"
    />
  );
}
