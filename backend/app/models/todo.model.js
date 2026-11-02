export default (sequelize, Sequelize) => {
  const Todo = sequelize.define("todo", {
    title: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    completed: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    listId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    dueDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
      get() {
        const value = this.getDataValue("dueDate");
        if (!value) {
          return null;
        }
        if (typeof value === "string") {
          return value.slice(0, 10);
        }
        return value.toISOString().slice(0, 10);
      },
    },
  });

  return Todo;
};
