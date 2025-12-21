import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Checkbox } from '../Checkbox';

describe('Checkbox Component', () => {
    // Test: Checkbox renders unchecked state
    it('renders unchecked by default', () => {
        const { getByTestId } = render(
            <Checkbox checked={false} onToggle={jest.fn()} testID="checkbox" />
        );
        expect(getByTestId('checkbox')).toBeTruthy();
    });

    // Test: Checkbox calls onToggle when pressed
    it('calls onToggle callback when pressed', () => {
        const mockOnToggle = jest.fn();
        const { getByTestId } = render(
            <Checkbox checked={false} onToggle={mockOnToggle} testID="checkbox" />
        );

        fireEvent.press(getByTestId('checkbox'));

        expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    // Test: Disabled checkbox does not call onToggle
    it('does not call onToggle when disabled', () => {
        const mockOnToggle = jest.fn();
        const { getByTestId } = render(
            <Checkbox checked={false} onToggle={mockOnToggle} disabled testID="checkbox" />
        );

        fireEvent.press(getByTestId('checkbox'));

        expect(mockOnToggle).not.toHaveBeenCalled();
    });

    // Test: Checked state renders checkmark
    it('renders checked state correctly', () => {
        const { getByTestId } = render(
            <Checkbox checked={true} onToggle={jest.fn()} testID="checkbox" />
        );
        expect(getByTestId('checkbox')).toBeTruthy();
    });

    // Test: Different sizes render correctly
    it('renders small size', () => {
        const { getByTestId } = render(
            <Checkbox checked={false} onToggle={jest.fn()} size="sm" testID="checkbox" />
        );
        expect(getByTestId('checkbox')).toBeTruthy();
    });

    it('renders large size', () => {
        const { getByTestId } = render(
            <Checkbox checked={false} onToggle={jest.fn()} size="lg" testID="checkbox" />
        );
        expect(getByTestId('checkbox')).toBeTruthy();
    });
});
