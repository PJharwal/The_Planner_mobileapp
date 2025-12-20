import { Stack } from "expo-router";

export default function FocusLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: "#0A0F1A" },
                headerTintColor: "#E5E7EB",
                headerBackVisible: true,
            }}
        />
    );
}
