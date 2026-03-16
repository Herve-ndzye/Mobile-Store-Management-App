import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { api, socket, connectSocket, disconnectSocket } from '../../src/services/api';

export default function SalespersonScreen() {
    const [scannedCard, setScannedCard] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('Loading products...');

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const prods = await api.getProducts();
            setProducts(prods);
            setStatus('Select a product to start');
        } catch (error) {
            Alert.alert('Error', 'Failed to load products');
            setStatus('Failed to load products');
        }
    };

    const handleSelectProduct = (product: any) => {
        const existingIndex = selectedProducts.findIndex(p => p._id === product._id);
        
        if (existingIndex >= 0) {
            // Product already selected, increase quantity
            const updated = [...selectedProducts];
            updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
            setSelectedProducts(updated);
        } else {
            // Add new product with quantity 1
            setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
        }
        
        if (selectedProducts.length === 0) {
            setStatus('Ready. Scan a card to pay.');
            connectSocket();
        }
    };

    const handleRemoveProduct = (productId: string) => {
        const existingIndex = selectedProducts.findIndex(p => p._id === productId);
        
        if (existingIndex >= 0) {
            const updated = [...selectedProducts];
            if (updated[existingIndex].quantity > 1) {
                // Decrease quantity
                updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity - 1 };
                setSelectedProducts(updated);
            } else {
                // Remove product
                updated.splice(existingIndex, 1);
                setSelectedProducts(updated);
                
                if (updated.length === 0) {
                    setScannedCard(null);
                    disconnectSocket();
                    setStatus('Select products to start');
                }
            }
        }
    };

    const clearCart = () => {
        setSelectedProducts([]);
        setScannedCard(null);
        disconnectSocket();
        setStatus('Select products to start');
    };

    useEffect(() => {
        if (selectedProducts.length > 0) {
            const onCardScanned = async (card: any) => {
                // If a card is scanned and products are selected, process payment
                if (loading) return;
                setScannedCard(card);
                processPayment(card);
            };

            socket.on('connect', () => console.log('Connected to socket'));
            socket.on('card-status', onCardScanned);

            return () => {
                socket.off('connect');
                socket.off('card-status');
            };
        }
    }, [selectedProducts, loading]);

    const processPayment = async (card: any) => {
        setLoading(true);
        setStatus('Processing payment...');

        try {
            // Process each product in the cart
            for (const item of selectedProducts) {
                await api.pay(card.uid, item._id, item.quantity);
            }
            
            const totalItems = selectedProducts.reduce((sum, item) => sum + item.quantity, 0);
            Alert.alert('Success', `Payment successful for ${totalItems} item(s)`);
            setSelectedProducts([]);
            setScannedCard(null);
            setStatus('Select products to start.');
            disconnectSocket();
        } catch (error: any) {
            Alert.alert('Payment Failed', error.message || 'Transaction failed');
            setStatus('Payment failed. Scan again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{
                title: 'Sales Checkout',
                headerStyle: { backgroundColor: '#0A0E1A' },
                headerTintColor: '#FF4081',
            }} />

            <View style={styles.fixedHeader}>
                <View style={[styles.statusBox, scannedCard && styles.statusBoxActive]}>
                    <Text style={[styles.statusBoxText, scannedCard && styles.statusBoxTextActive]}>
                        {status}
                    </Text>
                    {selectedProducts.length > 0 && !scannedCard && !loading && (
                        <ActivityIndicator style={{ marginTop: 10 }} color="#FF4081" size="small" />
                    )}
                </View>

                {selectedProducts.length > 0 && (
                    <View style={styles.selectedBanner}>
                        <View style={styles.cartHeader}>
                            <Text style={styles.selectedBannerTitle}>Shopping Cart ({selectedProducts.reduce((sum, item) => sum + item.quantity, 0)} items)</Text>
                            <TouchableOpacity onPress={clearCart}>
                                <Text style={styles.clearCartText}>Clear All</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {selectedProducts.map(item => (
                            <View key={item._id} style={styles.cartItem}>
                                <Text style={styles.selectedProductEmoji}>{item.emoji}</Text>
                                <View style={styles.cartItemInfo}>
                                    <Text style={styles.cartItemName}>{item.name}</Text>
                                    <Text style={styles.cartItemPrice}>${(item.price / 100).toFixed(2)} × {item.quantity}</Text>
                                </View>
                                <View style={styles.quantityControls}>
                                    <TouchableOpacity onPress={() => handleRemoveProduct(item._id)} style={styles.quantityButton}>
                                        <Text style={styles.quantityButtonText}>−</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.quantityText}>{item.quantity}</Text>
                                    <TouchableOpacity onPress={() => handleSelectProduct(item)} style={styles.quantityButton}>
                                        <Text style={styles.quantityButtonText}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                        
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total:</Text>
                            <Text style={styles.totalAmount}>
                                ${(selectedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0) / 100).toFixed(2)}
                            </Text>
                        </View>
                    </View>
                )}
            </View>

            <ScrollView contentContainerStyle={styles.listContent}>
                <Text style={styles.sectionTitle}>Available Products</Text>
                <View style={styles.grid}>
                    {products.map(item => {
                        const inCart = selectedProducts.find(p => p._id === item._id);
                        return (
                            <TouchableOpacity
                                key={item._id}
                                style={[
                                    styles.productCard,
                                    inCart && styles.productCardActive
                                ]}
                                onPress={() => handleSelectProduct(item)}
                            >
                                {inCart && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{inCart.quantity}</Text>
                                    </View>
                                )}
                                <Text style={styles.productEmoji}>{item.emoji}</Text>
                                <Text style={styles.productName}>{item.name}</Text>
                                <Text style={styles.productPrice}>${(item.price / 100).toFixed(2)}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0E1A' },
    fixedHeader: { padding: 16, backgroundColor: '#0A0E1A', zIndex: 10 },
    statusBox: {
        backgroundColor: 'rgba(255, 64, 129, 0.1)',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 64, 129, 0.3)',
    },
    statusBoxActive: { backgroundColor: 'rgba(100, 255, 100, 0.1)', borderColor: 'rgba(100, 255, 100, 0.3)' },
    statusBoxText: { color: '#FF4081', fontSize: 16, fontWeight: 'bold' },
    statusBoxTextActive: { color: '#64FF64' },

    selectedBanner: {
        marginTop: 16,
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FF4081'
    },
    cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    selectedBannerTitle: { color: '#8A95A5', fontSize: 12, fontWeight: '600' },
    clearCartText: { color: '#FF4081', fontSize: 12, fontWeight: 'bold' },
    cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
    selectedProductEmoji: { fontSize: 24, marginRight: 12 },
    cartItemInfo: { flex: 1 },
    cartItemName: { color: '#FFF', fontSize: 16 },
    cartItemPrice: { color: '#8A95A5', fontSize: 12, marginTop: 2 },
    quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    quantityButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255, 64, 129, 0.2)', justifyContent: 'center', alignItems: 'center' },
    quantityButtonText: { color: '#FF4081', fontSize: 18, fontWeight: 'bold' },
    quantityText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', minWidth: 24, textAlign: 'center' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 2, borderTopColor: '#FF4081' },
    totalLabel: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    totalAmount: { color: '#FF4081', fontSize: 20, fontWeight: 'bold' },
    badge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#FF4081', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    badgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

    listContent: { padding: 16, paddingBottom: 64 },
    sectionTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
    productCard: {
        width: '48%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    productCardActive: { borderColor: '#FF4081', backgroundColor: 'rgba(255, 64, 129, 0.1)' },
    productEmoji: { fontSize: 32, marginBottom: 8 },
    productName: { color: '#FFF', fontSize: 16, textAlign: 'center', marginBottom: 4 },
    productPrice: { color: '#FF4081', fontSize: 14, fontWeight: 'bold' },
});
