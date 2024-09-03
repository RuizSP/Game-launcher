const winston = require('winston');
const path = require('path');


const errorPath = path.join(__dirname,'logs','error.log');
const logger = winston.createLogger({
        level:'error',
        format: winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH::mm::ss'
            }),
            winston.format.printf(info => `${info.timestamp} - ${info.level.toUpperCase()}: ${info.message}`)
        ),
        defaultMeta: {service: 'user-service'},
        transports: [
            new winston.transports.File({filename: errorPath, level:'error'}),
            new winston.transports.File({filename: path.join(process.env.USERPROFILE, 'Documents','MeuGameLauncher' ,'error.log'), level:'error'})
        ],
    });

module.exports = logger;


