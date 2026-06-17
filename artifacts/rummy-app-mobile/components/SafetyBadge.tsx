import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  status: "Verified" | "Caution" | "Unsafe";
  small?: boolean;
}

export function SafetyBadge({ status, small = false }: Props) {
  const colors = useColors();

  const config = {
    Verified: {
      color: colors.verified,
      bg: colors.verified + "1a",
      label: "✓ Verified",
    },
    Caution: {
      color: colors.caution,
      bg: colors.caution + "1a",
      label: "⚠ Caution",
    },
    Unsafe: {
      color: colors.unsafe,
      bg: colors.unsafe + "1a",
      label: "✕ Unsafe",
    },
  }[status];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.color + "40" },
        small && styles.small,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: config.color, fontSize: small ? 10 : 11 },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  label: {
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
