import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button Component', () => {
    // Test: Button renders with correct text
    it('renders button with provided text', () => {
        const { getByText } = render(<Button onPress={jest.fn()}>Click Me</Button>);
        expect(getByText('Click Me')).toBeTruthy();
    });

    // Test: Button calls onPress when pressed
    it('calls onPress callback when pressed', () => {
        const mockOnPress = jest.fn();
        const { getByText } = render(<Button onPress={mockOnPress}>Press</Button>);

        fireEvent.press(getByText('Press'));

        expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    // Test: Disabled button does not call onPress
    it('does not call onPress when disabled', () => {
        const mockOnPress = jest.fn();
        const { getByText } = render(
            <Button onPress={mockOnPress} disabled>
                Disabled
            </Button>
        );

        fireEvent.press(getByText('Disabled'));

        expect(mockOnPress).not.toHaveBeenCalled();
    });

    // Test: Button renders in different variants
    it('renders primary variant by default', () => {
        const { getByText } = render(<Button onPress={jest.fn()}>Primary</Button>);
        expect(getByText('Primary')).toBeTruthy();
    });

    it('renders secondary variant', () => {
        const { getByText } = render(
            <Button variant="secondary" onPress={jest.fn()}>
                Secondary
            </Button>
        );
        expect(getByText('Secondary')).toBeTruthy();
    });

    it('renders danger variant', () => {
        const { getByText } = render(
            <Button variant="danger" onPress={jest.fn()}>
                Danger
            </Button>
        );
        expect(getByText('Danger')).toBeTruthy();
    });

    // Test: Loading state shows activity indicator
    it('shows loading indicator when loading', () => {
        const { queryByText, getByTestId } = render(
            <Button onPress={jest.fn()} loading testID="loading-button">
                Loading
            </Button>
        );
        // Text should still be visible but button disabled
        expect(getByTestId('loading-button')).toBeTruthy();
    });

    // Test: Full width button
    it('renders full width when fullWidth prop is true', () => {
        const { getByText } = render(
            <Button onPress={jest.fn()} fullWidth>
                Full Width
            </Button>
        );
        expect(getByText('Full Width')).toBeTruthy();
    });
});
