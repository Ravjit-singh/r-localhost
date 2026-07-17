import app from './app.js';
import { logger } from './shared/logger.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.success(`r-localhost master daemon online on port ${PORT}`, 'MAIN');
});
