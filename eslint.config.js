const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // Every text field must go through the shared <Input> so styling stays consistent.
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{
          name: "react-native",
          importNames: ["TextInput"],
          message: "Use <Input> from '@/components/ui/input' instead of TextInput.",
        }],
      }],
    },
  },
  {
    files: ["src/components/ui/input.tsx"],
    rules: { "no-restricted-imports": "off" },
  },
]);
