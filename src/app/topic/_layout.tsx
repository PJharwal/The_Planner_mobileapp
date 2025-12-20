import { Stack } from "expo-router";

export default function TopicLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: "#0F172A" },
                headerTintColor: "#E5E7EB",
                headerBackVisible: true,
            }}
        />
    );
}
