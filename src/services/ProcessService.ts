/**
 * 进程管理服务 - 管理 dscli 子进程
 */

import * as child_process from 'child_process';
import { logger } from '../utils/logger';

export interface ProcessOptions {
    command: string;
    args?: string[];
    cwd: string;
    input?: string;
    env?: NodeJS.ProcessEnv;
    timeout?: number;
    onData?: (data: string) => void;
    onError?: (error: string) => void;
    onExit?: (code: number | null, signal: NodeJS.Signals | null) => void;
}

export interface ProcessInfo {
    id: string;
    process: child_process.ChildProcess;
    command: string;
    args: string[];
    cwd: string;
    startTime: Date;
    status: 'running' | 'exited' | 'failed' | 'killed';
    exitCode?: number | null;
}

export class ProcessService {
    private processPool: Map<string, ProcessInfo> = new Map();
    private processCounter = 0;
    private isInitialized = false;

    constructor() {
        logger.debug('ProcessService 创建');
    }

    async initialize(): Promise<void> {
        this.isInitialized = true;
        logger.info('ProcessService 初始化完成');
    }

    /**
     * 创建并运行进程，返回进程 ID
     *
     * 安全边界：options.command 来自用户配置 (dscli.executablePath)。
     * spawn() 默认不使用 shell，因此不存在 shell 注入风险。
     * 但恶意 .vscode/settings.json 可能指向任意可执行文件——
     * 这与 VSCode 本身对工作区设置的信任模型一致。
     */
    async createProcess(options: ProcessOptions): Promise<string> {
        if (!options.cwd) {
            throw new Error('必须提供 options.cwd (项目根目录)');
        }

        const processId = `proc-${++this.processCounter}`;

        try {
            logger.info('创建进程', { processId, command: options.command, cwd: options.cwd });

            const childProc = child_process.spawn(options.command, options.args || [], {
                cwd: options.cwd,
                env: { ...process.env, ...options.env },
                stdio: 'pipe',
            });

            const processInfo: ProcessInfo = {
                id: processId,
                process: childProc,
                command: options.command,
                args: options.args || [],
                cwd: options.cwd,
                startTime: new Date(),
                status: 'running',
            };

            // 如果有输入，写入 stdin 并关闭
            if (options.input !== undefined) {
                childProc.stdin!.write(options.input);
                childProc.stdin!.end();
            }

            // 收集 stdout
            childProc.stdout?.on('data', (data: Buffer) => {
                const output = data.toString();
                if (options.onData) {
                    options.onData(output);
                }
                logger.debug(`进程 ${processId} stdout`, output.slice(0, 100));
            });

            // 收集 stderr
            childProc.stderr?.on('data', (data: Buffer) => {
                const error = data.toString();
                if (options.onError) {
                    options.onError(error);
                }
                logger.debug(`进程 ${processId} stderr`, error.slice(0, 100));
            });

            // 处理退出
            childProc.on('exit', (code, signal) => {
                processInfo.status = code === 0 ? 'exited' : 'failed';
                processInfo.exitCode = code;

                logger.info(`进程 ${processId} 退出`, { code, signal });

                if (options.onExit) {
                    options.onExit(code, signal);
                }

                // 清理
                this.processPool.delete(processId);
            });

            // 处理错误
            childProc.on('error', (error) => {
                processInfo.status = 'failed';
                logger.error(`进程 ${processId} 错误`, error);

                if (options.onError) {
                    options.onError(error.message);
                }
            });

            // 超时处理
            if (options.timeout && options.timeout > 0) {
                setTimeout(() => {
                    if (processInfo.status === 'running') {
                        logger.warn(`进程 ${processId} 超时，强制终止`);
                        this.killProcess(processId);
                    }
                }, options.timeout);
            }

            this.processPool.set(processId, processInfo);
            return processId;

        } catch (error: any) {
            logger.error('创建进程失败', { processId, error: error.message });
            throw error;
        }
    }

    /**
     * 终止进程
     */
    killProcess(processId: string, signal: NodeJS.Signals = 'SIGTERM'): boolean {
        const info = this.processPool.get(processId);
        if (!info) {
            return false;
        }

        try {
            if (!info.process.killed) {
                info.process.kill(signal);
                info.status = 'killed';
                logger.info('进程已终止', { processId, signal });
            }
            return true;
        } catch (error: any) {
            logger.error('终止进程失败', { processId, error: error.message });
            return false;
        }
    }

    /**
     * 获取运行中的进程数
     */
    getRunningCount(): number {
        let count = 0;
        for (const info of this.processPool.values()) {
            if (info.status === 'running') {
                count++;
            }
        }
        return count;
    }

    /**
     * 清理所有进程
     */
    dispose(): void {
        for (const [id] of this.processPool) {
            this.killProcess(id, 'SIGKILL');
        }
        this.processPool.clear();
        this.isInitialized = false;
        logger.info('ProcessService 已清理');
    }
}
