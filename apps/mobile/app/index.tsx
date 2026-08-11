import { StyleSheet, Text, View } from 'react-native';

export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>모바일 게임 준비 중</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#F5F2EB',
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    color: '#17191F',
    fontSize: 16,
    fontWeight: '600',
  },
});
