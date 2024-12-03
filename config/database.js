const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('postgresql://postgres:F5qAWsRUKyCkaeQB@aws-0-eu-central-1.pooler:6543/postgres', {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
