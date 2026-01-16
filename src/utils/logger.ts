import { createConsola } from 'consola';

const logger = createConsola({
  level: process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : process.env.NODE_ENV === 'production' ? 3 : 4, // 3=info, 4=debug
  formatOptions: {
    date: true,
    colors: process.env.NODE_ENV !== 'production',
    compact: process.env.NODE_ENV === 'production',
  },
});

export default logger;
