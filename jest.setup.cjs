/* eslint-env jest */
// Jest全局设置 - CommonJS格式
// 不需要导入jest，它已经是全局变量

// Mock VSCode API
jest.mock('vscode', () => {
  return {
    window: {
      showInformationMessage: jest.fn(),
      showErrorMessage: jest.fn(),
      showWarningMessage: jest.fn(),
      createOutputChannel: jest.fn(() => ({
        appendLine: jest.fn(),
        show: jest.fn(),
        dispose: jest.fn()
      }))
    },
    commands: {
      registerCommand: jest.fn(() => ({
        dispose: jest.fn()
      }))
    },
    workspace: {
      getConfiguration: jest.fn(() => ({
        get: jest.fn(),
        update: jest.fn()
      })),
      workspaceFolders: []
    },
    ExtensionContext: jest.fn(),
    StatusBarAlignment: {
      Left: 1,
      Right: 2
    },
    version: '1.85.0'
  };
}, { virtual: true });

// 全局测试超时
jest.setTimeout(10000);

// 测试前后的清理
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  // 清理所有模拟
  jest.restoreAllMocks();
});