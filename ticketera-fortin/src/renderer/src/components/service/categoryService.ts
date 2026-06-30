import axios from 'axios';
const API_URL = 'http://localhost:34567/api';

export const getAllCategories = async () => {
  try {
    const response = await axios.get(`${API_URL}/categories`);
    return response.data;
  } catch (error) {
    console.error('Error al encontrar categorias: ', error);
    throw error;
  }
};

export const getCategoryById = async (categoryId: string) => {
  try {
    const response = await axios.get(`${API_URL}/categories/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error(`Error al encontrar categoria ${categoryId}:`, error);
    throw error;
  }
};

export const createCategory = async (categoryData: any) => {
  try {
    const response = await axios.post(`${API_URL}/categories`, categoryData);
    return response.data;
  } catch (error) {
    console.error('Error al crear categoria:', error);
    throw error;
  }
};

export const updateCategory = async (categoryId: string, categoryData: { name: string }) => {
  try {
    const response = await axios.put(`${API_URL}/categories/${categoryId}`, categoryData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar categoria ${categoryId}:`, error);
    throw error;
  }
};

export const deleteCategory = async (categoryId: string) => {
  try {
    const response = await axios.delete(`${API_URL}/categories/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar categoria ${categoryId}:`, error);
    throw error;
  }
};