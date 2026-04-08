import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// `CollapsiblePanelProps` defines the shared shell used to hide or show secondary screen content.
type CollapsiblePanelProps = {
  title: string;
  subtitle: string;
  isOpen: boolean;
  children: React.ReactNode;
  onToggle: () => void;
};

// `CollapsiblePanel` renders a reusable collapsible card used to keep server settings secondary to chat.
export const CollapsiblePanel = ({
  title,
  subtitle,
  isOpen,
  children,
  onToggle,
}: CollapsiblePanelProps) => (
  <View style={styles.container}>
    <Pressable onPress={onToggle} style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>{isOpen ? 'Hide' : 'Show'}</Text>
    </Pressable>

    {isOpen ? <View style={styles.content}>{children}</View> : null}
  </View>
);

// `styles` defines the collapsible card shell used by the settings section.
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111821',
    borderBottomColor: '#1e2935',
    borderBottomWidth: 1,
    borderTopColor: '#1e2935',
    borderTopWidth: 1,
    marginTop: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerText: {
    flex: 1,
    gap: 2,
    paddingRight: 12,
  },
  title: {
    color: '#e5edf6',
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    color: '#8a97a8',
    fontSize: 12,
    lineHeight: 17,
  },
  chevron: {
    color: '#60a5fa',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    borderTopColor: '#1e2935',
    borderTopWidth: 1,
    padding: 16,
    paddingTop: 14,
  },
});
