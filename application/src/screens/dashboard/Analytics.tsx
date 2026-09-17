import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Analytics = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Analytics Screen</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
});

export default Analytics;
