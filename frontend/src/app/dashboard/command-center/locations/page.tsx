'use client';

import { useEffect, useState } from 'react';
import CommandCenterNav from '@/components/CommandCenter/CommandCenterNav';
import api from '@/services/api';

interface Location {
  code: string;
  name: string;
  category: 'COMMON' | 'REPAIRING' | 'MANUFACTURING';
  locationType: string;
  maxCapacity: number;
  children?: Location[];
}

interface Asset {
  currentLocationCode: string;
}

const LocationNodeRenderer = ({ node, occupancyMap }: { node: Location, occupancyMap: Record<string, number> }) => {
  const isGroup = node.locationType === 'GROUP' || (node.children && node.children.length > 0);
  const occupancy = occupancyMap[node.code] || 0;

  if (isGroup) {
    return (
      <div className="col-span-full bg-white border border-gray-200 rounded-md p-3 mb-1">
        <div className="mb-2">
          <h3 className="font-bold text-gray-800 text-xs">{node.code}</h3>
          <p className="text-[10px] text-gray-500">{node.name}</p>
        </div>
        {node.children && node.children.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1.5">
            {node.children.map(child => (
              <LocationNodeRenderer key={child.code} node={child} occupancyMap={occupancyMap} />
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-gray-400 italic">No sub-locations</p>
        )}
      </div>
    );
  }

  // Leaf node
  return (
    <div className="bg-white border border-gray-200 p-1.5 flex flex-col justify-between rounded-sm shadow-sm h-14">
      <div>
        <h4 className="font-bold text-gray-900 text-[10px] leading-tight truncate" title={node.code}>{node.code}</h4>
        <p className="text-[8px] text-gray-400 truncate mb-1" title={node.name}>{node.name}</p>
      </div>
      <div className="flex justify-between items-center text-[9px]">
        <span className="text-gray-500">Occ:</span>
        <span className={`font-medium ${occupancy > (node.maxCapacity || Infinity) ? 'text-red-500' : 'text-blue-600'}`}>
          {occupancy}/{node.maxCapacity || '-'}
        </span>
      </div>
    </div>
  );
};


export default function LocationsTopologyView() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch location hierarchy and assets concurrently
        const [locRes, assetRes] = await Promise.all([
          api.get('/locations/hierarchy'),
          api.get('/assets'),
        ]);
        setLocations(locRes.data);
        setAssets(assetRes.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch topology data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate occupancy mapping
  const occupancyMap = assets.reduce((acc, asset) => {
    const loc = asset.currentLocationCode;
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white min-h-full">
      <CommandCenterNav />

      {loading && <div className="text-gray-500">Loading locations...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {!loading && !error && (
        <div className="bg-white">
          <p className="text-xs text-gray-500 mb-6">
            Live occupancy and maximum capacity across all primary shops, locomotive sheds, quality assurance, receiving yards, and track lines 1-56.
          </p>

          <div className="space-y-8">
            {(['COMMON', 'REPAIRING', 'MANUFACTURING'] as const).map(category => {
              const categoryRoots = locations.filter(l => l.category === category);
              if (categoryRoots.length === 0) return null;

              return (
                <div key={category} className="bg-white">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 pb-1 border-b border-gray-200">
                    {category}
                  </h2>

                  <div className="space-y-3 flex flex-col">
                    {categoryRoots.map((root) => (
                      <LocationNodeRenderer key={root.code} node={root} occupancyMap={occupancyMap} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
