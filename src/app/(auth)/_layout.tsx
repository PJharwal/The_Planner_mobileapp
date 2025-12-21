import { Stack } from "expo-router";
import { background, text } from "../../constants/theme";

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: background.primary },
            }}
        />
    );
}
