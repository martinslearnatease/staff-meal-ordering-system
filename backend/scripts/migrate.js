const sequelize = require('../src/config/database');
const User = require('../src/models/User');
const Order = require('../src/models/Order');
const MenuItem = require('../src/models/MenuItem');
const Location = require('../src/models/Location');
const Department = require('../src/models/Department');
const SystemSetting = require('../src/models/SystemSetting');
const logger = require('../src/utils/logger');

const migrate = async () => {
  try {
    logger.info('Starting database migration...');

    // Sync all models
    await sequelize.sync({ alter: true });

    logger.info('Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database migration failed:', error);
    process.exit(1);
  }
};

migrate();
