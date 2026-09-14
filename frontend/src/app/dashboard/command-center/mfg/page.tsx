'use client';

import { useEffect, useState, useMemo } from 'react';
import CommandCenterNav from '@/components/CommandCenter/CommandCenterNav';
import AssetCard, { Asset } from '@/components/Assets/AssetCard';
import AssetDetailsDrawer from '@/components/Assets/AssetDetailsDrawer';
import RouteRerouteDrawer from '@/components/Assets/RouteRerouteDrawer';
import api from '@/services/api';

type MfgTab = 'ALL' | 'GIF' | 'CRANE' | 'OTHER';

export default function MfgView() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<MfgTab>('ALL');

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRouteOpen, setIsRouteOpen] = useState(false);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assets');
      setAssets(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const filteredAssets = useMemo(() => {
    // 1. Filter by currentPipeline === MANUFACTURING
    const mfgAssets = assets.filter((a) => a.currentPipeline === 'MANUFACTURING');

    // 2. Filter by sub-tab
    switch (activeTab) {
      case 'ALL':
        return mfgAssets;
      case 'GIF':
        return mfgAssets.filter((a) => a.currentLocationCode === 'GIF_SHOP');
      case 'CRANE':
        return mfgAssets.filter((a) => a.currentLocationCode === 'CRANE_MANUFACTURING_SHOP');
      case 'OTHER':
        return mfgAssets.filter(
          (a) => !['GIF_SHOP', 'CRANE_MANUFACTURING_SHOP'].includes(a.currentLocationCode)
        );
      default:
        return mfgAssets;
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

  const tabs: { id: MfgTab; label: string }[] = [
    { id: 'ALL', label: 'All MFG' },
    { id: 'GIF', label: 'GIF Shop' },
    { id: 'CRANE', label: 'Crane Manufacturing' },
    { id: 'OTHER', label: 'Other' },
  ];

  return (
    <div className="bg-white min-h-full">
      <CommandCenterNav />

      {/* Sub tabs */}
      <div>
        <h3 className="text-sm text-gray-500 mb-2">Stages</h3>
        <div className="flex space-x-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-1 rounded-md text-sm transition-colors border-2 ${
                activeTab === t.id
                  ? 'bg-gray-200 border-gray-600 text-gray-900 font-medium'
                  : 'bg-white border-gray-600 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
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
