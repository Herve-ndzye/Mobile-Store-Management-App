import { Stack } from 'expo-router';

export default function RootLayout() {
    return (
        <Stack screenOptions={{ animationEnabled: true }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="agent/index" options={{ title: 'Agent Dashboard', headerStyle: { backgroundColor: '#0A0E1A' }, headerTintColor: '#00E5FF' }} />
            <Stack.Screen name="salesperson/index" options={{ title: 'Sales Dashboard', headerStyle: { backgroundColor: '#0A0E1A' }, headerTintColor: '#00E5FF' }} />
            <Stack.Screen name="dashboard/index" options={{ title: 'System Dashboard', headerStyle: { backgroundColor: '#0A0E1A' }, headerTintColor: '#00E5FF' }} />
        </Stack>
    );
}
