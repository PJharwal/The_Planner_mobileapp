import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Chip } from '../Chip';

describe('Chip Component', () => {
    // Test: Chip renders with text
    it('renders chip with text content', () => {
        const { getByText } = render(<Chip>High Priority</Chip>);
        expect(getByText('High Priority')).toBeTruthy();
    });

    // Test: Chip renders with number content
    it('renders chip with number content', () => {
        const { getByText } = render(<Chip>85%</Chip>);
        expect(getByText('85%')).toBeTruthy();
    });

    // Test: Chip calls onPress when provided
    it('calls onPress callback when pressed', () => {
        const mockOnPress = jest.fn();
        const { getByText } = render(<Chip onPress={mockOnPress}>Clickable</Chip>);

        fireEvent.press(getByText('Clickable'));

        expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    // Test: Different variants render
    it('renders primary variant', () => {
        const { getByText } = render(<Chip variant="primary">Primary</Chip>);
        expect(getByText('Primary')).toBeTruthy();
    });

    it('renders success variant', () => {
        const { getByText } = render(<Chip variant="success">Success</Chip>);
        expect(getByText('Success')).toBeTruthy();
    });

    it('renders warning variant', () => {
        const { getByText } = render(<Chip variant="warning">Warning</Chip>);
        expect(getByText('Warning')).toBeTruthy();
    });

    it('renders error variant', () => {
        const { getByText } = render(<Chip variant="error">Error</Chip>);
        expect(getByText('Error')).toBeTruthy();
    });

    // Test: Priority variants
    it('renders priority-high variant', () => {
        const { getByText } = render(<Chip variant="priority-high">High</Chip>);
        expect(getByText('High')).toBeTruthy();
    });

    it('renders priority-medium variant', () => {
        const { getByText } = render(<Chip variant="priority-medium">Medium</Chip>);
        expect(getByText('Medium')).toBeTruthy();
    });

    it('renders priority-low variant', () => {
        const { getByText } = render(<Chip variant="priority-low">Low</Chip>);
        expect(getByText('Low')).toBeTruthy();
    });

    // Test: Selected state
    it('renders selected state correctly', () => {
        const { getByText } = render(<Chip selected>Selected</Chip>);
        expect(getByText('Selected')).toBeTruthy();
    });

    // Test: Size variants
    it('renders small size', () => {
        const { getByText } = render(<Chip size="sm">Small</Chip>);
        expect(getByText('Small')).toBeTruthy();
    });

    it('renders medium size', () => {
        const { getByText } = render(<Chip size="md">Medium</Chip>);
        expect(getByText('Medium')).toBeTruthy();
    });
});
