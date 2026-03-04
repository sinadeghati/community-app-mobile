import React from "react";
import { TextInput, StyleSheet, TextInputProps } from "react-native";
import { theme } from "../../lib/theme";

type Props = TextInputProps;

export default function AppInput(Props: Props) {
    return (
        <TextInput
         {...Props}
         placeholderTextColor={theme.colors.muted}
         style={[styles.input , Props.style]}
         />
    );
}

const styles = StyleSheet.create({
    input: {
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: theme.colors.text,
        fontSize: 16,
        marginBottom: 12,

    },
});