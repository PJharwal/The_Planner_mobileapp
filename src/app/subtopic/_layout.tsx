import { Stack } from "expo-router";
import { background, text } from "../../constants/theme";

export default function SubtopicLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: background.primary },
                headerTintColor: text.primary,
                headerShadowVisible: false,
                contentStyle: { backgroundColor: background.primary },
            }}
        />
    );
}
