/**
 * SecretService 单元测试
 *
 * 测试 API Key 的存取删逻辑，包括错误恢复
 */

import * as vscode from 'vscode';
import { SecretService } from '../services/SecretService';

function createMockContext(secretStore: Record<string, string> = {}): vscode.ExtensionContext {
  const store = { ...secretStore };
  return {
    secrets: {
      get: jest.fn(async (key: string) => store[key]),
      store: jest.fn(async (key: string, value: string) => { store[key] = value; }),
      delete: jest.fn(async (key: string) => { delete store[key]; }),
      onDidChange: jest.fn(),
    },
  } as unknown as vscode.ExtensionContext;
}

describe('SecretService', () => {
  describe('storeApiKey + getApiKey', () => {
    it('should store and retrieve an API key', async () => {
      const ctx = createMockContext();
      const service = new SecretService(ctx);

      await service.storeApiKey('sk-test-12345');
      const key = await service.getApiKey();

      expect(key).toBe('sk-test-12345');
    });
  });

  describe('getApiKey', () => {
    it('should return undefined when no key is stored', async () => {
      const ctx = createMockContext();
      const service = new SecretService(ctx);

      const key = await service.getApiKey();
      expect(key).toBeUndefined();
    });

    it('should return undefined when SecretStorage throws', async () => {
      const ctx = createMockContext();
      (ctx.secrets.get as jest.Mock).mockRejectedValueOnce(new Error('storage corrupted'));
      const service = new SecretService(ctx);

      const key = await service.getApiKey();
      expect(key).toBeUndefined();
    });
  });

  describe('storeApiKey', () => {
    it('should throw when SecretStorage.store fails', async () => {
      const ctx = createMockContext();
      (ctx.secrets.store as jest.Mock).mockRejectedValueOnce(new Error('disk full'));
      const service = new SecretService(ctx);

      await expect(service.storeApiKey('sk-fail')).rejects.toThrow('无法操作 VSCode 安全存储');
    });
  });

  describe('clearApiKey', () => {
    it('should remove a stored key', async () => {
      const ctx = createMockContext({ 'dscli.api_key': 'sk-to-delete' });
      const service = new SecretService(ctx);

      await service.clearApiKey();
      expect(ctx.secrets.delete).toHaveBeenCalledWith('dscli.api_key');
    });
  });
});
