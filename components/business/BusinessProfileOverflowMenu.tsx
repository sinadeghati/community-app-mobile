import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";

type BusinessProfileOverflowMenuProps = {
  visible: boolean;
  favorite: boolean;
  canReport: boolean;
  canClaim?: boolean;
  claimPending?: boolean;
  onClose: () => void;
  onShare: () => void;
  onSave: () => void;
  onReport: () => void;
  onClaim?: () => void;
};

type MenuAction = {
  key: "share" | "save" | "claim" | "report";
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  tone?: "danger" | "muted";
  disabled?: boolean;
};

export function BusinessProfileOverflowMenu({
  visible,
  favorite,
  canReport,
  canClaim = false,
  claimPending = false,
  onClose,
  onShare,
  onSave,
  onReport,
  onClaim,
}: BusinessProfileOverflowMenuProps) {
  const actions: MenuAction[] = [
    {
      key: "share",
      label: "Share",
      icon: "share-outline",
      onPress: onShare,
    },
    {
      key: "save",
      label: favorite ? "Unsave" : "Save",
      icon: favorite ? "heart" : "heart-outline",
      onPress: onSave,
    },
  ];

  if (canClaim) {
    actions.push({
      key: "claim",
      label: claimPending ? "Claim pending" : "Claim this business",
      icon: claimPending ? "time-outline" : "briefcase-outline",
      onPress: claimPending ? () => {} : onClaim ?? (() => {}),
      tone: claimPending ? "muted" : undefined,
      disabled: claimPending,
    });
  }

  if (canReport) {
    actions.push({
      key: "report",
      label: "Report",
      icon: "flag-outline",
      onPress: onReport,
      tone: "danger",
    });
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{
            backgroundColor: theme.colors.card,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            paddingHorizontal: 18,
            paddingTop: 18,
            paddingBottom: 28,
          }}
        >
          {actions.map((action, index) => (
            <React.Fragment key={action.key}>
              {index > 0 ? (
                <View
                  style={{
                    height: 1,
                    backgroundColor: theme.colors.border,
                    marginLeft: 52,
                  }}
                />
              ) : null}

              <Pressable
                onPress={action.onPress}
                disabled={action.disabled}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                  opacity: action.disabled ? 0.55 : 1,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: theme.colors.softCard,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons
                    name={action.icon}
                    size={20}
                    color={
                      action.tone === "danger"
                        ? theme.colors.danger
                        : action.tone === "muted"
                          ? theme.colors.muted
                          : theme.colors.turquoise
                    }
                  />
                </View>

                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    fontWeight: "800",
                    color:
                      action.tone === "danger"
                        ? theme.colors.danger
                        : action.tone === "muted"
                          ? theme.colors.muted
                          : theme.colors.charcoal,
                  }}
                >
                  {action.label}
                </Text>
              </Pressable>
            </React.Fragment>
          ))}

          <Pressable
            onPress={onClose}
            style={{
              marginTop: 10,
              height: 48,
              borderRadius: 14,
              backgroundColor: theme.colors.softCard,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "800",
                color: theme.colors.charcoal,
              }}
            >
              Cancel
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
