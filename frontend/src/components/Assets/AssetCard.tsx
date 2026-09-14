'use client';

export interface Asset {
  _id: string;
  assetNumber: string;
  categoryCode: string;
  currentLocationCode: string;
  currentPipeline: string;
  status: string;
  remarks?: string;
  movementsCount?: number;
}

interface AssetCardProps {
  asset: Asset;
  onViewDetails: (asset: Asset) => void;
  onRoute: (asset: Asset) => void;
}

export default function AssetCard({ asset, onViewDetails, onRoute }: AssetCardProps) {
  return (
    <div className="bg-white border-2 border-gray-300 rounded-md p-4 flex flex-col hover:border-gray-900 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Asset No</span>
          <span className="font-bold text-gray-900">{asset.assetNumber}</span>
        </div>
        <button
          onClick={() => onRoute(asset)}
          className="text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded border border-gray-300 transition-colors"
        >
          Route / Reroute
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Current Location</span>
          <span className="text-sm font-medium text-gray-900">{asset.currentLocationCode}</span>
        </div>
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Pipeline</span>
          <span className="text-sm text-gray-900">{asset.currentPipeline}</span>
        </div>
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Category</span>
          <span className="text-sm text-gray-900">{asset.categoryCode}</span>
        </div>
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Status</span>
          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
            {asset.status}
          </span>
        </div>
      </div>

      <div className="mb-4 flex-1">
        <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Remarks</span>
        <span className="text-sm text-gray-700 line-clamp-2 block h-10">
          {asset.remarks || 'No remarks available.'}
        </span>
      </div>

      <div className="pt-3 border-t-2 border-gray-100 flex justify-between items-center mt-auto">
        <div className="text-xs text-gray-500">
          Movements: <span className="font-medium text-gray-900">{asset.movementsCount || 0}</span>
        </div>
        <button
          onClick={() => onViewDetails(asset)}
          className="text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors underline underline-offset-2 hover:decoration-2"
        >
          Asset Details &rarr;
        </button>
      </div>
    </div>
  );
}
