import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ConnectionState } from '../types/chat';

// `ConnectionBannerProps` defines the readable connection status feedback shown near the top of the chat screen.
type ConnectionBannerProps = {
  connectionError: string;
  connectionState: ConnectionState;
};

// `ConnectionBanner` renders lightweight connection feedback without letting settings dominate the screen.
export const ConnectionBanner = ({
  connectionError,
  connectionState,
}: ConnectionBannerProps) => {
  if (connectionState === 'connected') {
    return (
      <View style={[styles.container, styles.containerConnected]}>
        <Text style={styles.text}>Connected to LM Studio and models are available.</Text>
      </View>
    );
  }

  if (connectionState === 'connecting') {
    return (
      <View style={[styles.container, styles.containerConnecting]}>
        <Text style={styles.text}>Connecting to LM Studio...</Text>
      </View>
    );
  }

  if (connectionState === 'error' && connectionError.length > 0) {
    return (
      <View style={[styles.container, styles.containerError]}>
        <Text style={styles.text}>{connectionError}</Text>
      </View>
    );
  }

  return null;
};

// `styles` defines the compact status banner presentation used below the header.
const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  containerConnected: {
    backgroundColor: '#0f2a21',
    borderColor: '#1f7a59',
    borderWidth: 1,
  },
  containerConnecting: {
    backgroundColor: '#2a2411',
    borderColor: '#9a7b17',
    borderWidth: 1,
  },
  containerError: {
    backgroundColor: '#2b1515',
    borderColor: '#9f3a3a',
    borderWidth: 1,
  },
  text: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 18,
  },
});
