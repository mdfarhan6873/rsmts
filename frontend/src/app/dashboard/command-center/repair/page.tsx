"use client";

import { useEffect, useState, useMemo } from "react";
import CommandCenterNav from "@/components/CommandCenter/CommandCenterNav";
import AssetCard, { Asset } from "@/components/Assets/AssetCard";
import AssetDetailsDrawer from "@/components/Assets/AssetDetailsDrawer";
import RouteRerouteDrawer from "@/components/Assets/RouteRerouteDrawer";
import api from "@/services/api";

type RepairTab = "ALL" | "NSY" | "SHOP" | "QA" | "OTHER";

export default function RepairView() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<RepairTab>("ALL");

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRouteOpen, setIsRouteOpen] = useState(false);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await api.get("/assets");
      setAssets(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const filteredAssets = useMemo(() => {
    // 1. Filter by currentPipeline === REPAIRING
    const repairAssets = assets.filter(
      (a) => a.currentPipeline === "REPAIRING",
    );

    // 2. Filter by sub-tab
    switch (activeTab) {
      case "ALL":
        return repairAssets;
      case "NSY":
        return repairAssets.filter((a) => a.currentLocationCode === "NSY");
      case "SHOP":
        return repairAssets.filter((a) =>
          ["WRS_1", "WRS_2", "WRS_3", "WRS_4"].includes(a.currentLocationCode),
        );
      case "QA":
        return repairAssets.filter((a) => a.currentLocationCode === "WRS_5");
      case "OTHER":
        return repairAssets.filter(
          (a) =>
            !["NSY", "WRS_1", "WRS_2", "WRS_3", "WRS_4", "WRS_5"].includes(
              a.currentLocationCode,
            ),
        );
      default:
        return repairAssets;
    }
  }, [assets, activeTab]);

  const handleViewDetails = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDetailsOpen(true);
  };

  const handleRoute = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsRouteOpen(true);
  };

  const handleMovementSuccess = () => {
    setIsRouteOpen(false);
    fetchAssets(); // Refresh assets
  };

  const tabs: { id: RepairTab; label: string }[] = [
    { id: "ALL", label: "All Repair" },
    { id: "NSY", label: "NSY" },
    { id: "SHOP", label: "Shop (WRS 1-4)" },
    { id: "QA", label: "QA (WRS 5)" },
    { id: "OTHER", label: "Other" },
  ];

  return (
    <div className="bg-white min-h-full">
      <CommandCenterNav />

      {/* Sub tabs */}
      <div className="flex space-x-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-1 rounded-md text-sm transition-colors border-2 ${
              activeTab === t.id
                ? "bg-gray-200 border-gray-600 text-gray-900 font-medium"
                : "bg-white border-gray-600 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {loading && <div className="text-gray-500">Loading assets...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {!loading && !error && filteredAssets.length === 0 && (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-500">No assets found for this filter.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAssets.map((asset) => (
          <AssetCard
            key={asset._id}
            asset={asset}
            onViewDetails={handleViewDetails}
            onRoute={handleRoute}
          />
        ))}
      </div>

      {selectedAsset && (
        <>
          <AssetDetailsDrawer
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            assetId={selectedAsset._id}
          />
          <RouteRerouteDrawer
            isOpen={isRouteOpen}
            onClose={() => setIsRouteOpen(false)}
            asset={selectedAsset}
            onSuccess={handleMovementSuccess}
          />
        </>
      )}
    </div>
  );
}
