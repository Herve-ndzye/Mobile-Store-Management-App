import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { api, socket, connectSocket, disconnectSocket } from '../../src/services/api';

export default function DashboardScreen() {
    const [stats, setStats] = useState({
        numCards: 0,
        totalBalance: 0,
        numTx: 0,
        topups: 0,
        payments: 0
    });
    const [refreshing, setRefreshing] = useState(false);
    const [recentTx, setRecentTx] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            const data = await api.getDashboardStats();

            const numCards = data.cards.length;
            const totalBalance = data.cards.reduce((sum: number, card: any) => sum + card.balance, 0);
            const numTx = data.transactions.length;

            const topups = data.transactions.filter((t: any) => t.type === 'TOPUP').length;
            const payments = data.transactions.filter((t: any) => t.type === 'PAYMENT').length;

            setStats({ numCards, totalBalance, numTx, topups, payments });
            setRecentTx(data.transactions.slice(0, 10)); // Just keep last 10
        } catch (error) {
            console.error('Failed to load dashboard data', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchData();
        connectSocket();

        const handleTxUpdate = (tx: any) => {
            // Optimistically append new tx to the top
            // And refresh the exact overall stats
            fetchData();
        };

        socket.on('transaction-update', handleTxUpdate);

        return () => {
            socket.off('transaction-update', handleTxUpdate);
            disconnectSocket();
        };
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{
                title: 'System Dashboard',
                headerStyle: { backgroundColor: '#0A0E1A' },
                headerTintColor: '#64FF64',
            }} />

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#64FF64" />}
            >
                <Text style={styles.sectionTitle}>Overview</Text>

                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Balance</Text>
                        <Text style={styles.statValue}>${(stats.totalBalance / 100).toFixed(2)}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Cards</Text>
                        <Text style={styles.statValue2}>{stats.numCards}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Transactions</Text>
                        <Text style={styles.statValue3}>{stats.numTx}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Transactions</Text>
                        <View style={styles.txSplit}>
                            <Text style={styles.txTopup}>↑ {stats.topups}</Text>
                            <Text style={styles.txPay}>↓ {stats.payments}</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <View style={styles.txList}>
                    {recentTx.length === 0 ? (
                        <Text style={styles.emptyText}>No recent transactions</Text>
                    ) : (
                        recentTx.map((tx: any, index: number) => (
                            <View key={tx._id || index} style={styles.txItem}>
                                <View style={styles.txItemLeft}>
                                    <Text style={styles.txType}>
                                        {tx.type === 'TOPUP' ? '💰 Top-up' : '🛍️ Buy'}
                                    </Text>
                                    <View>
                                        <Text style={styles.txDesc}>{tx.description}</Text>
                                        <Text style={styles.txDate}>{new Date(tx.timestamp).toLocaleString()}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.txAmount, tx.type === 'TOPUP' ? styles.txAmountTopup : styles.txAmountPay]}>
                                    {tx.type === 'TOPUP' ? '+' : '-'}${(tx.amount / 100).toFixed(2)}
                                </Text>
                            </View>
                        ))
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0E1A' },
    content: { padding: 16, paddingBottom: 64 },
    sectionTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 16, marginTop: 8 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
    statBox: {
        width: '48%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    statLabel: { color: '#8A95A5', fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
    statValue: { color: '#64FF64', fontSize: 24, fontWeight: 'bold' },
    statValue2: { color: '#00E5FF', fontSize: 24, fontWeight: 'bold' },
    statValue3: { color: '#FF4081', fontSize: 24, fontWeight: 'bold' },
    txSplit: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    txTopup: { color: '#00E5FF', fontSize: 16, fontWeight: 'bold' },
    txPay: { color: '#FF4081', fontSize: 16, fontWeight: 'bold' },

    txList: { gap: 8 },
    txItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: 16,
        borderRadius: 12,
    },
    txItemLeft: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    txType: {
        fontSize: 20, minWidth: 80, textAlign: 'center', color: '#FFF'
    },
    txDesc: { color: '#FFF', fontSize: 16, fontWeight: '500' },
    txDate: { color: '#8A95A5', fontSize: 12, marginTop: 4 },
    txAmount: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    txAmountTopup: {
        color: '#00E5FF'
    },
    txAmountPay: {
        color: '#FF4081'
    },
    emptyText: { color: '#8A95A5', textAlign: 'center', padding: 24, fontStyle: 'italic' },
});
