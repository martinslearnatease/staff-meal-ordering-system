const sequelize = require('../src/config/database');
const User = require('../src/models/User');
const MenuItem = require('../src/models/MenuItem');
const Location = require('../src/models/Location');
const Department = require('../src/models/Department');
const SystemSetting = require('../src/models/SystemSetting');
const logger = require('../src/utils/logger');

const seed = async () => {
  try {
    logger.info('Starting database seeding...');

    // Create locations
    const locations = await Location.bulkCreate([
      { name: 'Abuja', city: 'Abuja', status: 'active' },
      { name: 'Lagos', city: 'Lagos', status: 'active' },
    ], { ignoreDuplicates: true });

    logger.info(`Created ${locations.length} locations`);

    // Create departments
    const departments = await Department.bulkCreate([
      { name: 'IT', description: 'Information Technology' },
      { name: 'HR', description: 'Human Resources' },
      { name: 'Finance', description: 'Finance Department' },
      { name: 'Operations', description: 'Operations' },
      { name: 'Marketing', description: 'Marketing' },
    ], { ignoreDuplicates: true });

    logger.info(`Created ${departments.length} departments`);

    // Create users
    const users = await User.bulkCreate([
      {
        name: 'admin',
        email: 'admin@mealordering.com',
        staff_id: 'ADMIN001',
        password: 'Admin@123',
        role: 'admin',
        location: 'Lagos',
        status: 'active',
      },
      {
        name: 'chef1',
        email: 'chef1@mealordering.com',
        password: 'Chef@123',
        role: 'chef',
        location: 'Lagos',
        status: 'active',
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
        staff_id: 'EMP001',
        password: 'Staff@123',
        role: 'staff',
        department: 'IT',
        location: 'Lagos',
        status: 'active',
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        staff_id: 'EMP002',
        password: 'Staff@123',
        role: 'staff',
        department: 'HR',
        location: 'Abuja',
        status: 'active',
      },
      {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        staff_id: 'EMP003',
        password: 'Staff@123',
        role: 'staff',
        department: 'Finance',
        location: 'Lagos',
        status: 'active',
      },
    ], { ignoreDuplicates: true });

    logger.info(`Created ${users.length} users`);

    // Create menu items
    const menuItems = await MenuItem.bulkCreate([
      // Rice Types
      { category: 'Rice_Type', item_name: 'Jollof Rice', status: 'enabled', display_order: 1 },
      { category: 'Rice_Type', item_name: 'Fried Rice', status: 'enabled', display_order: 2 },
      { category: 'Rice_Type', item_name: 'White Rice', status: 'enabled', display_order: 3 },
      // Swallow Types
      { category: 'Swallow_Type', item_name: 'Akpu/Fufu', status: 'enabled', display_order: 1 },
      { category: 'Swallow_Type', item_name: 'Semo', status: 'enabled', display_order: 2 },
      { category: 'Swallow_Type', item_name: 'Wheat', status: 'enabled', display_order: 3 },
      // Soups
      { category: 'Soup', item_name: 'Egusi', status: 'enabled', display_order: 1 },
      { category: 'Soup', item_name: 'Vegetable', status: 'enabled', display_order: 2 },
      { category: 'Soup', item_name: 'Ogbono', status: 'enabled', display_order: 3 },
      { category: 'Soup', item_name: 'Oha', status: 'enabled', display_order: 4 },
      // Proteins
      { category: 'Protein', item_name: 'Chicken', status: 'enabled', display_order: 1 },
      { category: 'Protein', item_name: 'Fish', status: 'enabled', display_order: 2 },
      { category: 'Protein', item_name: 'Beef', status: 'enabled', display_order: 3 },
      { category: 'Protein', item_name: 'Titus Fish', status: 'enabled', display_order: 4 },
      { category: 'Protein', item_name: 'Croaker', status: 'enabled', display_order: 5 },
      { category: 'Protein', item_name: 'Goat Meat', status: 'enabled', display_order: 6 },
      { category: 'Protein', item_name: 'Moimoi', status: 'enabled', display_order: 7 },
      { category: 'Protein', item_name: 'Plantain', status: 'enabled', display_order: 8 },
    ], { ignoreDuplicates: true });

    logger.info(`Created ${menuItems.length} menu items`);

    // Create system settings
    const settings = await SystemSetting.bulkCreate([
      { key: 'ordering_open', value: 'true', description: 'Is ordering open today' },
      { key: 'ordering_close_time', value: '10:30', description: 'Daily ordering deadline' },
      { key: 'allow_edit_after_submission', value: 'false', description: 'Allow staff to edit orders after submission' },
      { key: 'notification_enabled', value: 'true', description: 'Enable notifications' },
    ], { ignoreDuplicates: true });

    logger.info(`Created ${settings.length} system settings`);
    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
};

seed();
