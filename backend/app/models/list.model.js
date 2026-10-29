export default (sequelize, Sequelize) => {
  const List = sequelize.define("list", {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  });

  return List;
};
