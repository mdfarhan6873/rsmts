'use client';

import { useEffect, useState } from 'react';
import { X, Clock, MapPin, User as UserIcon } from 'lucide-react';
import api from '@/services/api';
import { Asset } from './AssetCard';

interface AssetDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
}

interface Movement {
  _id: string;
  assetNumber: string;
  fromLocationCode: string;
  toLocationCode: string;
  movedBy: string;
  movedAt: string;
  remark: string;
}

export default function AssetDetailsDrawer({ isOpen, onClose, assetId }: AssetDetailsDrawerProps) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [assetRes, movementsRes] = await Promise.all([
          api.get(`/assets/${assetId}`),
          api.get(`/movements/asset/${assetId}`),
        ]);
        setAsset(assetRes.data);
        setMovements(movementsRes.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch asset details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, assetId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col transform transition-transform duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Asset Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && <div className="text-gray-500">Loading details...</div>}
          {error && <div className="text-red-500 p-4 bg-red-50 rounded-md">{error}</div>}

          {!loading && !error && asset && (
            <div className="space-y-8">
              {/* Basic Info */}
              <div>
                <div className="text-sm text-gray-500 mb-1">Asset No.</div>
                <div className="text-2xl font-bold text-gray-900">{asset.assetNumber}</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">
                  Asset Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Category</div>
                    <div className="text-sm font-medium text-gray-900">{asset.categoryCode}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Pipeline</div>
                    <div className="text-sm font-medium text-gray-900">{asset.currentPipeline}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Status</div>
                    <div className="text-sm font-medium text-gray-900">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-800">
                        {asset.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Current Location</div>
                    <div className="text-sm font-medium text-gray-900">{asset.currentLocationCode}</div>
                  </div>
                </div>
              </div>

              {/* Movements History */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                  Movement History
                </h3>
                
                {movements.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No movements recorded yet.</p>
                ) : (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                    {movements.map((movement, index) => (
                      <div key={movement._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-50 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          <MapPin className="w-4 h-4" />
                        </div>
                        
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white border border-gray-100 p-4 rounded-lg shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                              {movement.fromLocationCode || 'START'} <span className="text-gray-400">→</span> {movement.toLocationCode}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <Clock className="w-3 h-3" />
                            {new Date(movement.movedAt).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-700 mb-2">{movement.remark}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <UserIcon className="w-3 h-3" />
                            {movement.movedBy}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
