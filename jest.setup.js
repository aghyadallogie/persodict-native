// Reanimated and Worklets need native modules that don't exist under Jest; use their built-in
// mocks so tests can render animated components (animations resolve instantly).
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
