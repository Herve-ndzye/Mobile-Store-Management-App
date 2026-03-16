import { router } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';

export default function LoginScreen() {
    useEffect(() => {
        console.log('Login screen mounted');
    }, []);
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" translucent={false} />
            <LinearGradient
                colors={['#0A0E1A', '#1A1F2E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Header Section - Fixed at Top */}
                <View style={styles.headerSection}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoIcon}>💳</Text>
                    </View>
                    <Text style={styles.title}>
                        SmartStore<Text style={styles.highlight}>Pay</Text>
                    </Text>
                    <Text style={styles.tagline}>Smart Payment Solutions</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Subtitle */}
                    <Text style={styles.subtitle}>Select your role to continue</Text>

                    {/* Button Container */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => router.push('/agent')}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['rgba(0, 229, 255, 0.15)', 'rgba(0, 200, 255, 0.05)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.buttonGradient}
                            >
                                <View style={styles.buttonContent}>
                                    <Text style={styles.buttonIcon}>💼</Text>
                                    <View style={styles.buttonTextContainer}>
                                        <Text style={styles.buttonTitle}>Agent Login</Text>
                                        <Text style={styles.buttonSubtitle}>Manage wallet top-ups</Text>
                                    </View>
                                </View>
                                <Text style={styles.arrowIcon}>→</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => router.push('/salesperson')}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['rgba(255, 64, 129, 0.15)', 'rgba(255, 100, 150, 0.05)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.buttonGradient}
                            >
                                <View style={styles.buttonContent}>
                                    <Text style={styles.buttonIcon}>🛍️</Text>
                                    <View style={styles.buttonTextContainer}>
                                        <Text style={styles.buttonTitle}>Salesperson Login</Text>
                                        <Text style={styles.buttonSubtitle}>Process customer payments</Text>
                                    </View>
                                </View>
                                <Text style={styles.arrowIcon}>→</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => router.push('/dashboard')}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['rgba(100, 255, 100, 0.15)', 'rgba(120, 255, 120, 0.05)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.buttonGradient}
                            >
                                <View style={styles.buttonContent}>
                                    <Text style={styles.buttonIcon}>📊</Text>
                                    <View style={styles.buttonTextContainer}>
                                        <Text style={styles.buttonTitle}>Dashboard</Text>
                                        <Text style={styles.buttonSubtitle}>View system analytics</Text>
                                    </View>
                                </View>
                                <Text style={styles.arrowIcon}>→</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Secure Payment Platform</Text>
                    </View>
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0E1A',
    },
    gradient: {
        flex: 1,
    },
    headerSection: {
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 24,
        width: '100%',
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0, 229, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(0, 229, 255, 0.3)',
    },
    logoIcon: {
        fontSize: 40,
    },
    title: {
        fontSize: 48,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: -1,
    },
    highlight: {
        color: '#00E5FF',
    },
    tagline: {
        fontSize: 14,
        color: '#00E5FF',
        fontWeight: '600',
        letterSpacing: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingVertical: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#8A95A5',
        marginBottom: 24,
        textAlign: 'center',
        fontWeight: '500',
    },
    buttonContainer: {
        gap: 16,
        marginBottom: 32,
        width: '100%',
        maxWidth: 400,
    },
    button: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        minHeight: 100,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    buttonIcon: {
        fontSize: 40,
        marginRight: 16,
    },
    buttonTextContainer: {
        flex: 1,
    },
    buttonTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    buttonSubtitle: {
        fontSize: 13,
        color: '#8A95A5',
        fontWeight: '400',
    },
    arrowIcon: {
        fontSize: 24,
        color: '#00E5FF',
        marginLeft: 12,
    },
    footer: {
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 229, 255, 0.1)',
        width: '100%',
    },
    footerText: {
        fontSize: 12,
        color: '#5A6B7A',
        fontWeight: '500',
        letterSpacing: 0.5,
    },
});
