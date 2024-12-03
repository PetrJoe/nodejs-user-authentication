# Generate a new migration
npx sequelize-cli migration:generate --name add_new_column

# Edit the generated migration file in migrations folder to add your new column
# Example migration file:
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('TableName', 'newColumnName', {
      type: Sequelize.STRING, // or other data type
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('TableName', 'newColumnName');
  }
};

# Initialize Sequelize in your project
npx sequelize-cli init

npx sequelize-cli model:generate --name User --attributes username:string,email:string,password:string,firstName:string,lastName:string,profilePicture:string,bio:string,role:enum,isActive:boolean,resetPasswordToken:string,resetPasswordExpires:date,refreshToken:string


# Run the migration
npx sequelize-cli db:migrate

# If you need to undo the migration
npx sequelize-cli db:migrate:undo

# To undo all migrations
npx sequelize-cli db:migrate:undo:all





git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/PetrJoe/nodejs-user-authentication.git
git push -u origin main