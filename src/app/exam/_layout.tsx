import { Stack } from "expo-router";
import { background, text } from "../../constants/theme";

// Exam mode uses slightly muted pastel tones for a serious feel
const exam = {
    background: '#E8EEEE',
};

export default function ExamLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: exam.background },
                headerTintColor: text.primary,
                headerShadowVisible: false,
                contentStyle: { backgroundColor: exam.background },
            }}
        />
    );
}
