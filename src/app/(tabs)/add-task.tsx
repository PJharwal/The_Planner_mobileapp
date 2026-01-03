// Placeholder screen for add-task tab
// The actual add task functionality is handled via modal from the tab button
import { Redirect } from 'expo-router';

export default function AddTaskScreen() {
    // This screen is never actually shown - the tab button triggers a modal
    // Redirect to home if somehow navigated here directly
    return <Redirect href="/(tabs)" />;
}
