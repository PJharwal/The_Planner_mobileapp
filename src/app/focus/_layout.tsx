import { Stack } from "expo-router";
import { focus, text } from "../../constants/theme";

export default function FocusLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: focus.background },
                headerTintColor: text.primary,
                headerBackVisible: true,
                headerShadowVisible: false,
                contentStyle: { backgroundColor: focus.background },
            }}
        />
    );
}
