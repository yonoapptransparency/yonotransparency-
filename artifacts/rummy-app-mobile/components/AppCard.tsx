import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { AppConfig } from "@/types/app";
import { SafetyBadge } from "./SafetyBadge";

interface Props {
  app: AppConfig;
}

export function AppCard({ app }: Props) {
  const colors = useColors();
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      onPress={() => router.push(`/app/${app.id}`)}
    >
      <Image
        source={{ uri: app.icon_url }}
        style={styles.icon}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.info}>
        <Text
          style={[styles.name, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {app.name}
        </Text>
        <Text
          style={[styles.developer, { color: colors.mutedForeground }]}
          numberOfLines={1}
        >
          {app.developer}
        </Text>
        <View style={styles.meta}>
          <SafetyBadge status={app.safety_status} small />
          <View style={styles.rating}>
            <Text style={[styles.ratingText, { color: colors.mutedForeground }]}>
              ★ {app.rating?.toFixed(1) ?? "—"}
            </Text>
          </View>
        </View>
      </View>
      {app.is_new && (
        <View style={[styles.newBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 14,
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: "#f0f0f5",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  developer: {
    fontSize: 12,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "500",
  },
  newBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  newBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
