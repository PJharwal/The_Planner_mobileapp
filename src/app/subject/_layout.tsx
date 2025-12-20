import { Stack } from "expo-router";

export default function SubjectLayout() {
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
