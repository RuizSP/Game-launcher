import winston from 'winston';
import path from 'path';

const errorPath: string = path.join(__dirname,'logs','error.log');
const logger = winston.createLogger({
        level:'error',
        format: winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH::mm::ss'
            }),
            winston.format.printf((info: any) => `${info.timestamp} - ${info.level.toUpperCase()}: ${info.message}`)
        ),
        defaultMeta: {service: 'user-service'},
        transports: [
            new winston.transports.File({filename: errorPath, level:'error'}),
            new winston.transports.File({filename: path.join(process.env.USERPROFILE || '', 'Documents','MeuGameLauncher' ,'error.log'), level:'error'})
        ],
    });

export = logger;
