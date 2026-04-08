import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ConnectionState } from '../types/chat';

// `ChatHeaderProps` defines the connection metadata and actions shown in the fixed chat header.
type ChatHeaderProps = {
  connectionState: ConnectionState;
  currentModel: string;
  isConnecting: boolean;
  onConnect: () => void;
};

// `getConnectionLabel` maps the internal connection lifecycle to compact header text.
const getConnectionLabel = (connectionState: ConnectionState) => {
  if (connectionState === 'connected') {
    return 'Connected';
  }

  if (connectionState === 'connecting') {
    return 'Connecting';
  }

  if (connectionState === 'error') {
    return 'Error';
  }

  return 'Idle';
};

// `ChatHeader` renders the fixed top header for the single-screen LM Studio chat layout.
export const ChatHeader = ({
  connectionState,
  currentModel,
  isConnecting,
  onConnect,
}: ChatHeaderProps) => (
  <View style={styles.container}>
    <View style={styles.topRow}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>LM Studio LAN Chat</Text>
        <Text style={styles.subtitle}>
          Connect to a Windows-hosted LM Studio server over your local network.
        </Text>
      </View>

      <Pressable
        disabled={isConnecting}
        onPress={onConnect}
        style={[styles.connectButton, isConnecting ? styles.connectButtonDisabled : null]}
      >
        <Text style={styles.connectButtonText}>{isConnecting ? 'Connecting...' : 'Connect'}</Text>
      </Pressable>
    </View>

    <View style={styles.statusRow}>
      <View
        style={[
          styles.statusDot,
          connectionState === 'connected'
            ? styles.statusDotConnected
            : connectionState === 'error'
              ? styles.statusDotError
              : connectionState === 'connecting'
                ? styles.statusDotConnecting
                : styles.statusDotIdle,
        ]}
      />
      <Text style={styles.statusText}>Status: {getConnectionLabel(connectionState)}</Text>
      <Text style={styles.modelText}>
        {currentModel.trim().length > 0 ? `Model: ${currentModel}` : 'Model: not selected'}
      </Text>
    </View>
  </View>
);

// `styles` defines the top header presentation used by the chat screen.
const styles = StyleSheet.create({
  container: {
    gap: 4,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  textBlock: {
    flex: 1,
    gap: 4,
    paddingRight: 12,
  },
  title: {
    color: '#f5f7fa',
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: '#8a97a8',
    fontSize: 13,
    lineHeight: 18,
  },
  connectButton: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 12,
    minWidth: 104,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  connectButtonDisabled: {
    backgroundColor: '#334155',
  },
  connectButtonText: {
    color: '#eff6ff',
    fontSize: 13,
    fontWeight: '600',
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 6,
  },
  statusDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  statusDotConnected: {
    backgroundColor: '#34d399',
  },
  statusDotConnecting: {
    backgroundColor: '#fbbf24',
  },
  statusDotError: {
    backgroundColor: '#f87171',
  },
  statusDotIdle: {
    backgroundColor: '#64748b',
  },
  statusText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  modelText: {
    color: '#8a97a8',
    fontSize: 12,
  },
});
