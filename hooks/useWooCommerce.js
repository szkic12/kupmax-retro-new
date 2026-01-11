import { useState, useEffect } from 'react';

export function useProducts(page = 1, category = null) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, [page, category]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `/api/products?page=${page}&per_page=12`;
      if (category) url += `&category=${category}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch products');
      }
      
      setProducts(data.products);
      setTotal(parseInt(data.total));
      setPages(parseInt(data.pages));
      
    } catch (err) {
      setError(err.message);
      console.error('Products fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, error, total, pages, refetch: fetchProducts };
}

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch categories');
      }
      
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { categories, loading, error, refetch: fetchCategories };
}