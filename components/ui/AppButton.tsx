import React from "react";
import { ActivityIndicator, Pressable,StyleSheet, Text } from "react-native";
import { theme } from "../../lib/theme";

type Props = {
    title: string;
    onPress: () => void;
    loading?: boolean;
    variant?: "primary" | "outline";
    disabled?: boolean;
};

export default function AppButton({
    title,
    onPress,
    loading = false,
    variant = "primary",
    disabled = false,
}:   Props) {
    const isDisabled = disabled || loading;
    
    return (
        <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed}) => [
            styles.base,
            variant === "primary" ? styles.primary : styles.outline,
            isDisabled && styles.disabled,
            pressed && !isDisabled && styles.pressed,
        ]}
        >
            {loading ? (
                <ActivityIndicator />
            )  :  (
                <Text style={[styles.text, variant === "outline" && StyleSheet.textOutline]}>
                    {title}
                 </Text>   
            )}
            </Pressable>
        );
        }
        const styles = StyleSheet.create({
            base: {
                height: 52,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 16,
            },
            primary: {
                backgroundColor: theme.colors.primary,
            },
            outline: {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: theme.colors.border,
            },
            text: {
                color: "#fff",
                fontSize: 16,
                fontWeight: "700",
            },
            textOutline: {
                color: theme.colors.text,
            },
            disabled: {
                opacity: 0.6,
            },
            pressed: {
                opacity: 0.9,
                transform: [{ scale: 0.99}],
            },
        });

