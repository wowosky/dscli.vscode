import * as vscode from 'vscode';
import { logger } from '../utils/logger';

export class SecretService {
    private static readonly API_KEY_SECRET_NAME = 'dscli.api_key';
    private secretStorage: vscode.SecretStorage;

    constructor(context: vscode.ExtensionContext) {
        this.secretStorage = context.secrets;
        logger.debug('SecretService 初始化完成');
    }

    /**
     * 将用户输入的大模型鉴权秘钥安全写入沙箱
     * @param key 明文 Key 串
     */
    public async storeApiKey(key: string): Promise<void> {
        try {
            await this.secretStorage.store(SecretService.API_KEY_SECRET_NAME, key);
            logger.info('API Key 已安全入库');
        } catch (error) {
            logger.error('存储 API Key 失败', error);
            throw new Error('无法操作 VSCode 安全存储');
        }
    }

    /**
     * 提取凭证供进程构建时读取
     * @returns 解密后的字符串或空
     */
    public async getApiKey(): Promise<string | undefined> {
        try {
            return await this.secretStorage.get(SecretService.API_KEY_SECRET_NAME);
        } catch (error) {
            logger.error('读取 API Key 失败', error);
            return undefined;
        }
    }

    /**
     * 删除凭证（重置环境预留接口）
     */
    public async clearApiKey(): Promise<void> {
        try {
            await this.secretStorage.delete(SecretService.API_KEY_SECRET_NAME);
            logger.info('API Key 销毁操作完成');
        } catch (error) {
            logger.error('删除 API Key 失败', error);
        }
    }
}
