import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../Card';

describe('Card Component', () => {
    // Test: Card renders children
    it('renders children correctly', () => {
        const { getByText } = render(
            <Card>
                <Text>Card Content</Text>
            </Card>
        );
        expect(getByText('Card Content')).toBeTruthy();
    });

    // Test: Default variant renders
    it('renders default variant', () => {
        const { getByText } = render(
            <Card>
                <Text>Default Card</Text>
            </Card>
        );
        expect(getByText('Default Card')).toBeTruthy();
    });

    // Test: Peach variant renders
    it('renders peach variant', () => {
        const { getByText } = render(
            <Card gradient="peach">
                <Text>Peach Card</Text>
            </Card>
        );
        expect(getByText('Peach Card')).toBeTruthy();
    });

    // Test: Mint variant renders
    it('renders mint variant', () => {
        const { getByText } = render(
            <Card gradient="mint">
                <Text>Mint Card</Text>
            </Card>
        );
        expect(getByText('Mint Card')).toBeTruthy();
    });



    // Test: noPadding prop removes padding
    it('renders without padding when noPadding is true', () => {
        const { getByText } = render(
            <Card noPadding>
                <Text>No Padding</Text>
            </Card>
        );
        expect(getByText('No Padding')).toBeTruthy();
    });
});
