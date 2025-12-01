import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Listing = {
  id: number;
  title: string;
  city: string;
  state: string;
  price: string | number;
  contact_info: string;
};

export default function ExploreScreen() {
  const [data, setData] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // ✅ این همون آی‌پی و API خودته
      const response = await fetch('http://192.168.1.4:8000/api/listings/');
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading data...</Text>
      </SafeAreaView>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>No listings found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Available Listings</Text>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const priceNumber = Number(item.price);
          const priceText = isNaN(priceNumber)
            ? `$${item.price}`
            : `$${priceNumber.toFixed(2)}`;

          return (
            <View style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.city}>
                {item.city}, {item.state}
              </Text>
              <Text style={styles.price}>{priceText}</Text>
              <Text style={styles.contact}>Contact: {item.contact_info}</Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#f2f2f2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  city: {
    fontSize: 14,
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contact: {
    fontStyle: 'italic',
    color: '#555',
  },
});
