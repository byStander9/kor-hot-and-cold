import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="rankings" options={{ gestureEnabled: true }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
