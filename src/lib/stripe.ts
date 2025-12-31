import { Platform } from 'react-native';
import React from 'react';

// Mock implementation for Expo Go
const mockStripe = {
    initPaymentSheet: async () => ({ error: null }),
    presentPaymentSheet: async () => ({ error: null }),
    confirmPayment: async () => ({ error: null }),
    handleURLCallback: async () => Promise.resolve(true),
};

const mockUseStripe = () => {
    if (__DEV__) {
        console.warn("Stripe is disabled in Expo Go. Use a Development Build to test payments.");
    }
    return mockStripe;
};

// Mock Provider
// Mock Provider
const MockStripeProvider = ({ children }: { children: React.ReactNode }) => children as React.ReactElement;

let StripeExports: any = {
    useStripe: mockUseStripe,
    StripeProvider: MockStripeProvider,
};

try {
    // Attempt to require the native module
    const stripeModule = require('@stripe/stripe-react-native');
    StripeExports = stripeModule;
} catch (e) {
    console.warn("Stripe native module not found. Payments disabled.");
}

export const useStripe = StripeExports.useStripe;
export const StripeProvider = StripeExports.StripeProvider;
