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
  onOpenSettings: () => void;
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
  onOpenSettings,
}: ChatHeaderProps) => (
  <View style={styles.container}>
    <View style={styles.topRow}>
      <View style={styles.leftCluster}>
        <Text style={styles.title}>LM Studio</Text>

        <View style={styles.statusPill}>
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
          <Text style={styles.statusText}>{getConnectionLabel(connectionState)}</Text>
        </View>

        {currentModel.trim().length > 0 ? (
          <Text numberOfLines={1} style={styles.modelText}>
            {currentModel}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          disabled={isConnecting}
          onPress={onConnect}
          style={[styles.connectButton, isConnecting ? styles.connectButtonDisabled : null]}
        >
          <Text style={styles.connectButtonText}>{isConnecting ? '...' : 'Connect'}</Text>
        </Pressable>

        <Pressable onPress={onOpenSettings} style={styles.settingsButton}>
          <Text style={styles.settingsButtonText}>Gear</Text>
        </Pressable>
      </View>
    </View>
  </View>
);

// `styles` defines the top header presentation used by the chat screen.
const styles = StyleSheet.create({
  container: {
    borderBottomColor: '#1e2935',
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  leftCluster: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  title: {
    color: '#f5f7fa',
    fontSize: 16,
    fontWeight: '700',
  },
  connectButton: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 10,
    minWidth: 74,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  connectButtonDisabled: {
    backgroundColor: '#334155',
  },
  connectButtonText: {
    color: '#eff6ff',
    fontSize: 13,
    fontWeight: '600',
  },
  statusPill: {
    alignItems: 'center',
    backgroundColor: '#111821',
    borderColor: '#1e2935',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    fontSize: 11,
    fontWeight: '600',
  },
  modelText: {
    color: '#8a97a8',
    flex: 1,
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  settingsButton: {
    alignItems: 'center',
    backgroundColor: '#1b2430',
    borderRadius: 10,
    minWidth: 64,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  settingsButtonText: {
    color: '#dbe4ee',
    fontSize: 13,
    fontWeight: '600',
  },
});
