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
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Reset page when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  // Auto-select tab based on search match
  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const lowerSearch = searchTerm.toLowerCase();
      const match = assets.find(a => 
        a.currentPipeline === "MANUFACTURING" &&
        a.assetNumber.toLowerCase().includes(lowerSearch)
      );

      if (match) {
        let targetTab: MfgTab = "ALL";
        if (match.currentLocationCode === "GIF_SHOP") targetTab = "GIF";
        else if (match.currentLocationCode === "CRANE_MANUFACTURING_SHOP") targetTab = "CRANE";
        else targetTab = "OTHER";
        
        if (activeTab !== targetTab) {
          setActiveTab(targetTab);
        }
      }
    }
  }, [searchTerm, assets, activeTab]);

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
    let mfgAssets = assets.filter((a) => a.currentPipeline === 'MANUFACTURING');

    // 2. Filter by search term
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      mfgAssets = mfgAssets.filter((a) =>
        a.assetNumber.toLowerCase().includes(lowerSearch) ||
        a.categoryCode.toLowerCase().includes(lowerSearch) ||
        a.currentLocationCode.toLowerCase().includes(lowerSearch)
      );
    }

    // 3. Filter by sub-tab
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

  // Pagination logic
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const currentAssets = filteredAssets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
    <div className="bg-white flex-1 flex flex-col">
      <CommandCenterNav searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Sub tabs */}
      <div>
        <div className="mb-2 text-sm text-gray-500 font-medium tracking-wide">Stages</div>
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

      <div className="flex flex-col gap-4">
        {currentAssets.map((asset) => (
          <AssetCard
            key={asset._id}
            asset={asset}
            onViewDetails={handleViewDetails}
            onRoute={handleRoute}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {!loading && !error && (
        <div className="flex items-center justify-between pt-4 pb-2 mt-auto border-t border-gray-100">
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAssets.length)}</span> of{' '}
            <span className="font-medium">{filteredAssets.length}</span> assets
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    currentPage === page
                      ? 'bg-gray-800 text-white font-medium'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedAsset && (
        <>
          <AssetDetailsDrawer
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            assetNumber={selectedAsset.assetNumber}
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
