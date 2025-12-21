// Jest setup for Expo with proper mocks

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
    const React = require('react');
    const { View, Text } = require('react-native');

    return {
        __esModule: true,
        default: {
            createAnimatedComponent: (component) => component,
            View: View,
            Text: Text,
        },
        useSharedValue: (initialValue) => ({ value: initialValue }),
        useAnimatedStyle: () => ({}),
        withSpring: (value) => value,
        withTiming: (value) => value,
        interpolateColor: (value, input, output) => output[0],
        Easing: {
            linear: (t) => t,
            ease: (t) => t,
        },
    };
});

// Mock expo-router
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    }),
    useLocalSearchParams: () => ({}),
    Link: 'Link',
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
    const { Text } = require('react-native');
    return {
        Ionicons: (props) => Text,
    };
});
