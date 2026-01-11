import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, useMap, Polygon, useMapEvents, Marker, LayersControl } from "react-leaflet";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Maximize, Navigation, Layers, Calculator, Info, Search, PenTool, Trash2, Check, SquareDashed } from "lucide-react";
import { cn } from "../lib/utils";

// Fix Leaflet Default Icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Geoman (Drawing) Integration Component - Fixed Version
function GeomanControls({ onAreaUpdate }) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        // Remove existing controls first to prevent duplicates
        if (map.pm) {
            map.pm.removeControls();
        }

        // Add controls with specific settings
        map.pm.addControls({
            position: 'topleft',
            drawMarker: false,
            drawPolyline: false,
            drawRectangle: true,
            drawPolygon: true,
            drawCircle: false,
            drawCircleMarker: false,
            drawText: false,
            editMode: true,
            dragMode: false,
            cutLayer: false,
            removalMode: true,
            rotateMode: false,
        });

        // Style the toolbar
        map.pm.setPathOptions({
            color: '#22c55e',
            fillColor: '#22c55e',
            fillOpacity: 0.3,
            weight: 3
        });

        // Calculate area when shape is created
        const handleCreate = (e) => {
            const layer = e.layer;
            calculateAndSetArea(layer);

            // Update area when edited
            layer.on('pm:edit', () => {
                calculateAndSetArea(layer);
            });
        };

        // Calculate area when shape is removed
        const handleRemove = () => {
            onAreaUpdate(0);
        };

        const calculateAndSetArea = (layer) => {
            if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
                const latlngs = layer.getLatLngs()[0];
                if (latlngs && latlngs.length >= 3) {
                    // Use Leaflet's geodesic area calculation
                    const area = L.GeometryUtil.geodesicArea(latlngs);
                    onAreaUpdate(area);
                }
            }
        };

        map.on('pm:create', handleCreate);
        map.on('pm:remove', handleRemove);

        return () => {
            map.off('pm:create', handleCreate);
            map.off('pm:remove', handleRemove);
        };
    }, [map, onAreaUpdate]);

    return null;
}

// Controller to fly the map to coordinates
function MapController({ lat, lng, trigger }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lng && trigger > 0) {
            console.log("Flying to:", lat, lng);
            map.flyTo([lat, lng], 18, { duration: 2 });
        }
    }, [trigger]); // Only trigger on key change
    return null;
}

export default function FarmPlanner() {
    const [areaSqM, setAreaSqM] = useState(0);
    const [inputLat, setInputLat] = useState("");
    const [inputLng, setInputLng] = useState("");
    const [flyTrigger, setFlyTrigger] = useState(0);
    const [targetLat, setTargetLat] = useState(null);
    const [targetLng, setTargetLng] = useState(null);

    const handleAreaUpdate = useCallback((area) => {
        setAreaSqM(area);
    }, []);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        const lat = parseFloat(inputLat);
        const lng = parseFloat(inputLng);
        if (!isNaN(lat) && !isNaN(lng)) {
            setTargetLat(lat);
            setTargetLng(lng);
            setFlyTrigger(prev => prev + 1);
        }
    };

    const handleTestLocation = () => {
        setInputLat("28.6139");
        setInputLng("77.2090");
        setTargetLat(28.6139);
        setTargetLng(77.2090);
        setFlyTrigger(prev => prev + 1);
    };

    const formatArea = (sqm) => {
        if (sqm === 0) return { main: "0", sub: "Draw on map to measure" };
        const acres = (sqm / 4046.86).toFixed(2);
        const hectares = (sqm / 10000).toFixed(2);
        return {
            main: `${Math.round(sqm).toLocaleString()} m²`,
            sub: `${acres} Acres | ${hectares} Hectares`
        };
    };

    const areaData = formatArea(areaSqM);

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-widest">
                        <Maximize className="h-3 w-3" />
                        Professional Mapper
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">Farm Planner & Land Mapper</h1>
                    <p className="text-muted-foreground text-lg">Calculate land area precisely using high-resolution satellite imagery.</p>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border shadow-sm items-center">
                    <div className="flex flex-col px-2 border-r">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Latitude</label>
                        <input
                            placeholder="28.6139"
                            className="bg-transparent border-none text-sm focus:outline-none w-24"
                            value={inputLat}
                            onChange={(e) => setInputLat(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col px-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Longitude</label>
                        <input
                            placeholder="77.2090"
                            className="bg-transparent border-none text-sm focus:outline-none w-24"
                            value={inputLng}
                            onChange={(e) => setInputLng(e.target.value)}
                        />
                    </div>
                    <Button type="submit" size="icon" className="rounded-xl h-10 w-10">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Map Section */}
                <div className="lg:col-span-8 space-y-4">
                    <Card className="border-0 shadow-2xl overflow-hidden rounded-[2rem] bg-gray-100 dark:bg-gray-900 h-[550px] relative">
                        <MapContainer
                            center={[20.5937, 78.9629]}
                            zoom={5}
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={true}
                        >
                            <LayersControl position="topright">
                                <LayersControl.BaseLayer name="Satellite">
                                    <TileLayer
                                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                        attribution='&copy; Esri'
                                        maxZoom={19}
                                    />
                                </LayersControl.BaseLayer>
                                <LayersControl.BaseLayer checked name="Hybrid (Buildings Visible)">
                                    <TileLayer
                                        url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                                        attribution='&copy; Google'
                                        maxZoom={20}
                                    />
                                </LayersControl.BaseLayer>
                                <LayersControl.BaseLayer name="Street Map">
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; OpenStreetMap'
                                        maxZoom={19}
                                    />
                                </LayersControl.BaseLayer>
                            </LayersControl>

                            <GeomanControls onAreaUpdate={handleAreaUpdate} />
                            <MapController lat={targetLat} lng={targetLng} trigger={flyTrigger} />
                        </MapContainer>
                    </Card>

                    {/* Measured Area Card - OUTSIDE THE MAP */}
                    <Card className={cn(
                        "border-2 shadow-lg transition-all",
                        areaSqM > 0
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : "border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                    )}>
                        <CardContent className="py-6">
                            <div className="flex items-center gap-6">
                                <div className={cn(
                                    "p-4 rounded-2xl",
                                    areaSqM > 0
                                        ? "bg-green-100 dark:bg-green-900/40 text-green-600"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                                )}>
                                    <Calculator className="h-8 w-8" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-1">Measured Area</p>
                                    <p className={cn(
                                        "text-3xl font-black tabular-nums",
                                        areaSqM > 0 ? "text-green-700 dark:text-green-400" : "text-gray-400"
                                    )}>
                                        {areaData.main}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">{areaData.sub}</p>
                                </div>
                                {areaSqM > 0 && (
                                    <div className="text-right">
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-bold">
                                            <Check className="h-3 w-3" /> Calculated
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Info Panel Section */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-0 shadow-xl bg-white dark:bg-gray-800">
                        <CardHeader className="bg-muted/10 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <Layers className="h-5 w-5 text-blue-500" />
                                <span>Drawing Tools</span>
                            </CardTitle>
                            <CardDescription>Use the toolbar on the map to draw your land.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border text-center">
                                    <SquareDashed className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                                    <p className="text-[10px] font-bold">Rectangle</p>
                                </div>
                                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border text-center">
                                    <PenTool className="h-5 w-5 mx-auto mb-1 text-green-500" />
                                    <p className="text-[10px] font-bold">Polygon</p>
                                </div>
                                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-center">
                                    <Trash2 className="h-5 w-5 mx-auto mb-1 text-red-500" />
                                    <p className="text-[10px] font-bold text-red-600 dark:text-red-400">Delete</p>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30">
                                <p className="text-xs text-blue-800 dark:text-blue-300">
                                    <strong>📍 Toolbar Location:</strong> Look at the <strong>TOP-LEFT</strong> corner of the map for the drawing icons.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-bold flex items-center gap-2">
                                    <Info className="h-4 w-4 text-green-500" />
                                    How to use
                                </h4>
                                <ol className="space-y-2 text-xs text-gray-600 dark:text-gray-400 list-decimal pl-4">
                                    <li>Zoom into your farm area on the map.</li>
                                    <li>Click the <strong>Polygon</strong> or <strong>Rectangle</strong> icon (top-left toolbar).</li>
                                    <li>Click to mark corners of your land.</li>
                                    <li><strong>Double-click</strong> or click the first point to finish.</li>
                                    <li>Area appears below the map!</li>
                                </ol>
                            </div>

                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                                <p className="text-xs text-amber-800 dark:text-amber-300">
                                    <strong>Tip:</strong> Use the trash icon to delete and redraw.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-0 shadow-xl overflow-hidden relative">
                        <div className="absolute -right-8 -bottom-8 opacity-10">
                            <Navigation className="h-32 w-32 rotate-12" />
                        </div>
                        <CardHeader>
                            <CardTitle>Coordinate Assist</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-indigo-50/80 leading-relaxed">
                                Enter your farm's GPS coordinates from your smartphone to fly directly to your land.
                            </p>
                            <Button variant="secondary" className="w-full font-bold h-12 rounded-xl" onClick={handleTestLocation}>
                                Test with Delhi
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
