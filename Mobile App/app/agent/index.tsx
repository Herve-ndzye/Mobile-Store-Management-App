import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { api, socket, connectSocket, disconnectSocket } from '../../src/services/api';

export default function AgentScreen() {
    const [scannedCard, setScannedCard] = useState<any>(null);
    const [amount, setAmount] = useState('');
    const [holderName, setHolderName] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('Waiting for card...');

    useEffect(() => {
        connectSocket();

        socket.on('connect', () => {
            setStatus('Ready. Scan a card.');
        });

        socket.on('disconnect', () => {
            setStatus('Disconnected from server.');
        });

        socket.on('card-status', (card: any) => {
            // New card detected
            setScannedCard(card);
            setHolderName(card.holderName === 'New User' ? '' : card.holderName);
            setStatus(`Card ${card.uid} detected!`);
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('card-status');
            disconnectSocket();
        };
    }, []);

    const handleTopUp = async () => {
        if (!scannedCard) {
            Alert.alert('Error', 'Please scan a card first');
            return;
        }

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        if (scannedCard.holderName === 'New User' && !holderName.trim()) {
            Alert.alert('Error', 'Please enter a name for the new card holder.');
            return;
        }

        setLoading(true);
        setStatus('Processing transaction...');

        try {
            // Note: convert to cents if API expects it? Wait, demo used actual values, backend doesn't convert to cents by itself for topup, it trusts amount. 
            // In backend `Product` demo, price is 500 = $5.00 for products. 
            // Let's assume amount is standard. Actually if backend product is 500, a $5 topup should be 500. Let's send raw number entered * 100 or as is?
            // "Top-up of ${amount}" description in backend. I will multiply by 100 to stick to cents.
            // But wait, the prompt says $10 button in backend, so it's probably using the raw number as the value if they type 10.
            // Let's look at backend `handleTopUp`. `amount` is stored as is. I will send as raw number, but multiply by 100 to keep it consistent with UI if needed?
            // Actually, backend Product uses cents `price: 500` (for $5.00). I'll let the user enter exactly what should be processed.
            // Let's send `numAmount * 100`. Wait, if initial balance is $50 (but backend says default balance = 0, wait: "New cards start with $50.00 default balance" - but `server.js` saves with `balance || 0`).

            await api.topup(scannedCard.uid, numAmount * 100, holderName.trim());
            Alert.alert('Success', `Successfully topped up $${numAmount.toFixed(2)}`);
            setAmount('');
            setHolderName('');
            setScannedCard(null);
            setStatus('Ready. Scan next card.');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Transaction failed');
            setStatus('Transaction failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{
                title: 'Agent Top-Up',
                headerStyle: { backgroundColor: '#0A0E1A' },
                headerTintColor: '#00E5FF',
            }} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>

                <View style={styles.readerDisplay}>
                    <Text style={styles.readerStatus}>{status}</Text>
                    {scannedCard && (
                        <View style={styles.cardInfo}>
                            <Text style={styles.uidText}>UID: {scannedCard.uid}</Text>
                            <Text style={styles.balanceText}>Balance: ${(scannedCard.balance / 100).toFixed(2)}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.form}>
                    {scannedCard?.holderName === 'New User' && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Cardholder Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter cardholder name"
                                placeholderTextColor="#666"
                                value={holderName}
                                onChangeText={setHolderName}
                            />
                        </View>
                    )}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Top-Up Amount ($)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />
                    </View>

                    <View style={styles.quickAmounts}>
                        {[10, 25, 50, 100].map((val) => (
                            <TouchableOpacity
                                key={val}
                                style={styles.quickButton}
                                onPress={() => setAmount(val.toString())}
                            >
                                <Text style={styles.quickButtonText}>${val}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, (!scannedCard || loading) && styles.submitButtonDisabled]}
                        onPress={handleTopUp}
                        disabled={!scannedCard || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#0A0E1A" />
                        ) : (
                            <Text style={styles.submitButtonText}>Confirm Top-Up</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0E1A' },
    content: { flex: 1, padding: 24, justifyContent: 'center' },
    readerDisplay: {
        backgroundColor: 'rgba(0, 229, 255, 0.1)',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(0, 229, 255, 0.3)',
    },
    readerStatus: { color: '#00E5FF', fontSize: 18, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
    cardInfo: { alignItems: 'center' },
    uidText: { color: '#8A95A5', fontSize: 14, marginBottom: 8 },
    balanceText: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
    form: { gap: 20 },
    inputGroup: { gap: 8 },
    label: { color: '#8A95A5', fontSize: 14, fontWeight: '500' },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        color: '#FFF',
        fontSize: 18,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    quickAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    quickButton: {
        backgroundColor: 'rgba(0, 229, 255, 0.1)',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 229, 255, 0.3)',
    },
    quickButtonText: { color: '#00E5FF', fontWeight: 'bold', fontSize: 16 },
    submitButton: {
        backgroundColor: '#00E5FF',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        marginTop: 16,
    },
    submitButtonDisabled: { opacity: 0.5 },
    submitButtonText: { color: '#0A0E1A', fontSize: 18, fontWeight: 'bold' },
});
