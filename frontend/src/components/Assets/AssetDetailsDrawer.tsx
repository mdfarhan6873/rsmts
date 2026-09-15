'use client';

import { useEffect, useState } from 'react';
import { X, Clock, MapPin, User as UserIcon } from 'lucide-react';
import api from '@/services/api';
import { Asset } from './AssetCard';

interface AssetDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  assetNumber: string;
}

interface Movement {
  _id: string;
  assetNumber: string;
  fromLocationCode: string;
  toLocationCode: string;
  movedBy: any; // User object or string
  movedAt: string;
  remark: string;
}

export default function AssetDetailsDrawer({ isOpen, onClose, assetNumber }: AssetDetailsDrawerProps) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !assetNumber) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [assetRes, movementsRes] = await Promise.all([
          api.get(`/assets/${assetNumber}`),
          api.get(`/movements/asset/${assetNumber}`),
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
  }, [isOpen, assetNumber]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-white/60 backdrop-blur-sm p-4">
      {/* Overlay click area */}
      <div 
        className="fixed inset-0"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white border-2 border-gray-600 rounded-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-600 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Asset Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {loading && <div className="text-gray-500">Loading details...</div>}
          {error && <div className="text-red-500 p-4 bg-red-50 rounded-md">{error}</div>}

          {!loading && !error && asset && (
            <div className="space-y-8">
              {/* Basic Info */}
              <div>
                <div className="text-sm text-gray-500 mb-1">Asset No.</div>
                <div className="text-2xl font-bold text-gray-900">{asset.assetNumber}</div>
              </div>

              <div className="border-2 border-gray-600 rounded-md p-4 space-y-4 bg-gray-50">
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
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        {asset.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Current Location</div>
                    <div className="text-sm font-medium text-gray-900">{asset.currentLocationCode}</div>
                  </div>
                </div>
                {asset.remark && (
                  <div className="pt-2 border-t border-gray-200 mt-2">
                    <div className="text-xs text-gray-500 mb-1">Initial Remark</div>
                    <div className="text-sm font-medium text-gray-900 whitespace-pre-wrap">{asset.remark}</div>
                  </div>
                )}
              </div>

              {/* Movements History */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                  Movement History
                </h3>
                
                {movements.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No movements recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {movements.map((movement) => (
                      <MovementItem key={movement._id} movement={movement} />
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

function MovementItem({ movement }: { movement: Movement }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasLongRemark = movement.remark && movement.remark.length > 80;

  return (
    <div 
      className={`bg-white border border-gray-200 p-3 rounded-md flex flex-col md:flex-row md:items-start justify-between gap-3 ${hasLongRemark ? 'cursor-pointer select-none hover:bg-gray-50 transition-colors' : ''}`}
      onDoubleClick={() => hasLongRemark && setIsExpanded(!isExpanded)}
    >
      <div className="flex-1">
        <div className="font-medium text-sm text-gray-900 flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-gray-400" />
          {movement.fromLocationCode || 'START'} <span className="text-gray-400">→</span> {movement.toLocationCode}
        </div>
        {movement.remark && (
          <div className="mt-1">
            <div className="text-xs font-semibold text-gray-500 mb-0.5">Remark:</div>
            <div className={`text-sm text-gray-600 whitespace-pre-wrap ${!isExpanded ? 'line-clamp-2' : ''}`}>
              {movement.remark}
            </div>
            {hasLongRemark && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-blue-600 hover:text-blue-800 mt-1 font-medium focus:outline-none"
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}
      </div>
      <div className="md:text-right shrink-0 mt-2 md:mt-0">
        <div className="text-xs text-gray-500 flex items-center md:justify-end gap-1 mb-1">
          <Clock className="w-3 h-3" />
          {new Date(movement.movedAt).toLocaleString()}
        </div>
        <div className="text-xs text-gray-400 flex items-center md:justify-end gap-1">
          <UserIcon className="w-3 h-3" />
          {typeof movement.movedBy === 'object' ? movement.movedBy.name : movement.movedBy}
        </div>
      </div>
    </div>
  );
}
