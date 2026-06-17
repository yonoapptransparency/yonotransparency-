import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ClearanceButton } from "@/components/ClearanceButton";
import { SafetyBadge } from "@/components/SafetyBadge";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/hooks/useApps";

function MetaChip({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: colors.secondary, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.chipLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.chipValue, { color: colors.foreground }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function StarsRow({ rating, colors }: { rating: number; colors: ReturnType<typeof useColors> }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Text
          key={i}
          style={{
            fontSize: 16,
            color: i < full ? "#ff9500" : i === full && half ? "#ff9500" : colors.border,
          }}
        >
          {i < full ? "★" : i === full && half ? "½" : "☆"}
        </Text>
      ))}
      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginLeft: 2 }}>
        {rating?.toFixed(1)}
      </Text>
    </View>
  );
}

export default function AppDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { data: app, isLoading, isError } = useApp(id);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !app) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.unsafe }]}>App not found.</Text>
          <Pressable style={[styles.backBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backPressable}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>← Back</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroRow}>
          <Image
            source={{ uri: app.icon_url }}
            style={styles.heroIcon}
            contentFit="cover"
            transition={250}
          />
          <View style={styles.heroInfo}>
            <Text style={[styles.appName, { color: colors.foreground }]}>{app.name}</Text>
            <Text style={[styles.developer, { color: colors.mutedForeground }]}>{app.developer}</Text>
            <SafetyBadge status={app.safety_status} />
            <StarsRow rating={app.rating ?? 0} colors={colors} />
          </View>
        </View>

        <View style={styles.chipsRow}>
          <MetaChip label="Version" value={app.version} colors={colors} />
          <MetaChip label="Size" value={app.file_size} colors={colors} />
          <MetaChip label="Category" value={app.category?.split(",")[0]?.trim() ?? "—"} colors={colors} />
        </View>

        {app.is_coming_soon ? (
          <View style={[styles.comingSoonBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.comingSoonText, { color: colors.mutedForeground }]}>
              🕐 Coming Soon
            </Text>
            <Text style={[styles.comingSoonSub, { color: colors.mutedForeground }]}>
              This app is not yet available for download.
            </Text>
          </View>
        ) : (
          <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Download</Text>
            <ClearanceButton appId={app.id} slug={app.slug} status={app.safety_status} />
          </View>
        )}

        {!!app.red_box_msg && (
          <View style={[styles.alertBox, { backgroundColor: colors.unsafe + "15", borderColor: colors.unsafe + "40" }]}>
            <Text style={[styles.alertText, { color: colors.unsafe }]}>⚠ {app.red_box_msg}</Text>
          </View>
        )}

        {!!app.yellow_box_msg && (
          <View style={[styles.alertBox, { backgroundColor: colors.caution + "15", borderColor: colors.caution + "40" }]}>
            <Text style={[styles.alertText, { color: colors.caution }]}>ℹ {app.yellow_box_msg}</Text>
          </View>
        )}

        {!!app.description_html && (
          <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About</Text>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {app.description_html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}
            </Text>
          </View>
        )}

        {app.screenshots && app.screenshots.length > 0 && (
          <View style={styles.screenshotsSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, paddingHorizontal: 0 }]}>
              Screenshots
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.screenshotsScroll}>
              {app.screenshots.map((uri, idx) => (
                <Image
                  key={idx}
                  source={{ uri }}
                  style={styles.screenshot}
                  contentFit="cover"
                  transition={200}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {app.faqs && app.faqs.length > 0 && (
          <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>FAQ</Text>
            {app.faqs.map((faq, idx) => (
              <Pressable
                key={idx}
                onPress={() => setFaqOpen(faqOpen === idx ? null : idx)}
                style={[styles.faqItem, { borderColor: colors.border }]}
              >
                <View style={styles.faqHeader}>
                  <Text style={[styles.faqQ, { color: colors.foreground }]}>{faq.question}</Text>
                  <Text style={[styles.faqChevron, { color: colors.mutedForeground }]}>
                    {faqOpen === idx ? "▲" : "▼"}
                  </Text>
                </View>
                {faqOpen === idx && (
                  <Text style={[styles.faqA, { color: colors.mutedForeground }]}>{faq.answer}</Text>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {!!app.release_notes && (
          <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Release Notes</Text>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {app.release_notes.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backPressable: {
    paddingVertical: 4,
    paddingRight: 16,
  },
  backArrow: {
    fontSize: 16,
    fontWeight: "600",
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  heroRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 4,
  },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: 20,
    backgroundColor: "#f0f0f5",
  },
  heroInfo: {
    flex: 1,
    gap: 6,
  },
  appName: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  developer: {
    fontSize: 13,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    minWidth: 80,
    flex: 1,
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  chipValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  section: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  alertBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  alertText: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  comingSoonBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: "700",
  },
  comingSoonSub: {
    fontSize: 13,
    textAlign: "center",
  },
  screenshotsSection: {
    gap: 10,
  },
  screenshotsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  screenshot: {
    width: 180,
    height: 320,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: "#f0f0f5",
  },
  faqItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    gap: 8,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  faqQ: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    lineHeight: 20,
  },
  faqChevron: {
    fontSize: 11,
  },
  faqA: {
    fontSize: 13,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
});
