'use client';

export interface Asset {
  _id: string;
  assetNumber: string;
  categoryCode: string;
  currentLocationCode: string;
  currentPipeline: string;
  status: string;
  remark?: string;
  movementsCount?: number;
}

interface AssetCardProps {
  asset: Asset;
  onViewDetails: (asset: Asset) => void;
  onRoute: (asset: Asset) => void;
}

export default function AssetCard({ asset, onViewDetails, onRoute }: AssetCardProps) {
  return (
    <div 
      onClick={() => onViewDetails(asset)}
      className="bg-white border-2 border-gray-600 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between hover:border-gray-900 hover:shadow-md transition-all cursor-pointer group gap-6 max-w-5xl"
    >
      {/* Left Section */}
      <div className="flex-1 space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-gray-500 min-w-32">Asset No :</span>
          <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{asset.assetNumber}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-gray-500 min-w-32">Current Location :</span>
          <span className="font-medium text-gray-900">{asset.currentLocationCode}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-gray-500 min-w-32">Remarks :</span>
          <span className="text-gray-700 line-clamp-1">{asset.remark || '-'}</span>
        </div>
      </div>

      {/* Middle Section */}
      <div className="flex-1 space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-gray-500 min-w-28">Assets Details :</span>
          <span className="text-gray-900 font-medium">
            {asset.categoryCode} • {asset.currentPipeline} • {asset.status}
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center justify-end md:pl-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRoute(asset);
          }}
          className="whitespace-nowrap text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 px-4 py-2 rounded-lg border-2 border-gray-400 hover:border-gray-600 transition-colors"
        >
          Route / Reroute
        </button>
      </div>
    </div>
  );
}
