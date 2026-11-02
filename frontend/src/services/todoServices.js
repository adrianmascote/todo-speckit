import apiClient from "./services.js";

const TodoServices = {
  getLists() {
    return apiClient.get("lists");
  },
  createList(data) {
    return apiClient.post("lists", data);
  },
  updateList(listId, data) {
    return apiClient.put(`lists/${listId}`, data);
  },
  deleteList(listId) {
    return apiClient.delete(`lists/${listId}`);
  },
  getTodos(listId) {
    return apiClient.get(`lists/${listId}/todos`);
  },
  createTodo(listId, data) {
    return apiClient.post(`lists/${listId}/todos`, data);
  },
  updateTodo(todoId, data) {
    return apiClient.put(`todos/${todoId}`, data);
  },
  deleteTodo(todoId) {
    return apiClient.delete(`todos/${todoId}`);
  },
};

export default TodoServices;
