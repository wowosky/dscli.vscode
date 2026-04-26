/**
 * 日志系统
 * 基于最新实现更新
 */

export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error'
}

export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: Date;
    data?: unknown;
    source?: string;
}

export interface LoggerConfig {
    level: LogLevel;
    enableConsole: boolean;
}

const DEFAULT_CONFIG: LoggerConfig = {
    level: LogLevel.INFO,
    enableConsole: true,
};

export class Logger {
    private static instance: Logger;
    private config: LoggerConfig;
    private isInitialized = false;

    private constructor(config?: Partial<LoggerConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    static getInstance(config?: Partial<LoggerConfig>): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger(config);
        }
        return Logger.instance;
    }

    // 初始化日志系统
    initialize(): void {
        if (this.isInitialized) {
            return;
        }
        
        this.isInitialized = true;
        this.info('Logger 初始化完成');
    }

    // 检查是否应该记录
    private shouldLog(level: LogLevel): boolean {
        const levelOrder = {
            [LogLevel.DEBUG]: 0,
            [LogLevel.INFO]: 1,
            [LogLevel.WARN]: 2,
            [LogLevel.ERROR]: 3
        };
        
        return levelOrder[level] >= levelOrder[this.config.level];
    }

    // 格式化日志条目
    private formatEntry(entry: LogEntry): string {
        const timestamp = entry.timestamp.toISOString();
        const level = entry.level.toUpperCase().padEnd(5);
        const source = entry.source ? `[${entry.source}] ` : '';
        const message = entry.message;
        
        let formatted = `${timestamp} ${level} ${source}${message}`;
        
        if (entry.data) {
            try {
                const dataStr = typeof entry.data === 'string' 
                    ? entry.data 
                    : JSON.stringify(entry.data, null, 2);
                formatted += `\n${dataStr}`;
            } catch (error) {
                formatted += `\n[无法序列化数据: ${(error as Error).message}]`;
            }
        }
        
        return formatted;
    }

    // 记录日志
    private log(level: LogLevel, message: string, data?: any, source?: string): void {
        if (!this.shouldLog(level)) {
            return;
        }
        
        const entry: LogEntry = {
            level,
            message,
            timestamp: new Date(),
            data,
            source
        };
        
        const formatted = this.formatEntry(entry);
        
        // 控制台输出
        if (this.config.enableConsole) {
            const consoleMethod = console[level] || console.log;
            consoleMethod(formatted);
        }
    }

    // 调试日志
    debug(message: string, data?: any, source?: string): void {
        this.log(LogLevel.DEBUG, message, data, source);
    }

    // 信息日志
    info(message: string, data?: any, source?: string): void {
        this.log(LogLevel.INFO, message, data, source);
    }

    // 警告日志
    warn(message: string, data?: any, source?: string): void {
        this.log(LogLevel.WARN, message, data, source);
    }

    // 错误日志
    error(message: string, data?: any, source?: string): void {
        this.log(LogLevel.ERROR, message, data, source);
    }

    // 检查是否就绪
    isReady(): boolean {
        return this.isInitialized;
    }

    // 获取配置
    getConfig(): LoggerConfig {
        return { ...this.config };
    }

    // 更新配置
    updateConfig(config: Partial<LoggerConfig>): void {
        this.config = { ...this.config, ...config };
        this.info('Logger 配置已更新', { config: this.config });
    }

    // 清理资源
    dispose(): void {
        this.isInitialized = false;
        this.info('Logger 资源清理完成');
    }
}

// 导出单例实例
export const logger = Logger.getInstance();