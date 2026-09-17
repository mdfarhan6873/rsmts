import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LocationNode } from '../screens/dashboard/CommandCenter';

interface Props {
  locations: LocationNode[];
  occupancyMap: Record<string, number>;
  loading: boolean;
  error: string;
}

const LocationNodeRenderer = ({ node, occupancyMap }: { node: LocationNode, occupancyMap: Record<string, number> }) => {
  const isGroup = node.locationType === 'GROUP' || (node.children && node.children.length > 0);
  const occupancy = occupancyMap[node.code] || 0;
  const maxCap = node.maxCapacity || Infinity;
  const isOverCap = occupancy > maxCap;

  if (isGroup) {
    return (
      <View style={styles.groupContainer}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupCode}>{node.code}</Text>
          <Text style={styles.groupName}>{node.name}</Text>
        </View>
        {node.children && node.children.length > 0 ? (
          <View style={styles.childrenGrid}>
            {node.children.map(child => (
              <LocationNodeRenderer key={child.code} node={child} occupancyMap={occupancyMap} />
            ))}
          </View>
        ) : (
          <Text style={styles.noSubLocations}>No sub-locations</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.leafContainer}>
      <View>
        <Text style={styles.leafCode} numberOfLines={1}>{node.code}</Text>
        <Text style={styles.leafName} numberOfLines={1}>{node.name}</Text>
      </View>
      <View style={styles.occupancyRow}>
        <Text style={styles.occLabel}>Occ:</Text>
        <Text style={[styles.occValue, isOverCap ? styles.textRed : styles.textBlue]}>
          {occupancy}/{node.maxCapacity || '-'}
        </Text>
      </View>
    </View>
  );
};

export default function LocationsTopologyView({ locations, occupancyMap, loading, error }: Props) {
  if (loading) {
    return <ActivityIndicator size="large" color="#0284c7" style={{ marginTop: 40 }} />;
  }

  if (error) {
    return <Text style={{ color: 'red', textAlign: 'center', marginTop: 20 }}>{error}</Text>;
  }

  const categories = ['COMMON', 'REPAIRING', 'MANUFACTURING'] as const;

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Live occupancy and maximum capacity across all primary shops, locomotive sheds, quality assurance, receiving yards, and track lines.
      </Text>

      {categories.map(category => {
        const categoryRoots = locations.filter(l => l.category === category);
        if (categoryRoots.length === 0) return null;

        return (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {categoryRoots.map(root => (
              <LocationNodeRenderer key={root.code} node={root} occupancyMap={occupancyMap} />
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  description: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 18,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  groupContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  groupHeader: {
    marginBottom: 8,
  },
  groupCode: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  groupName: {
    fontSize: 10,
    color: '#6b7280',
  },
  childrenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  noSubLocations: {
    fontSize: 10,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  leafContainer: {
    width: '46%', // approximately half minus margin for a 2-column grid
    margin: '2%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 8,
    borderRadius: 4,
    justifyContent: 'space-between',
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  leafCode: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827',
  },
  leafName: {
    fontSize: 9,
    color: '#9ca3af',
    marginBottom: 4,
  },
  occupancyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  occLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  occValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  textRed: {
    color: '#ef4444',
  },
  textBlue: {
    color: '#2563eb',
  }
});
