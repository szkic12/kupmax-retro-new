import { useState, useEffect, useCallback } from 'react';

/**
 * Hook do zarządzania koszykiem WooCommerce
 * Używa localStorage do przechowywania koszyka
 */
export function useWooCommerceCart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [discount, setDiscount] = useState(null); // { code: string, percentage: number }
  const [appliedCode, setAppliedCode] = useState('');

  // Pobierz koszyk i rabat z localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('kupmax_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (err) {
        console.error('Błąd parsowania koszyka z localStorage:', err);
        localStorage.removeItem('kupmax_cart');
      }
    }
    const savedDiscount = localStorage.getItem('kupmax_discount');
    if (savedDiscount) {
      try {
        const parsedDiscount = JSON.parse(savedDiscount);

        // Automatycznie usuń stare rabaty 28% i zaktualizuj do 30%
        if (parsedDiscount.percentage === 0.28) {
          console.log('🔄 Aktualizacja starego rabatu 28% → 30%');
          const updatedDiscount = { ...parsedDiscount, percentage: 0.30 };
          setDiscount(updatedDiscount);
          setAppliedCode(parsedDiscount.code);
          localStorage.setItem('kupmax_discount', JSON.stringify(updatedDiscount));
        } else {
          setDiscount(parsedDiscount);
          setAppliedCode(parsedDiscount.code);
        }
      } catch (err) {
        console.error('Błąd parsowania rabatu z localStorage:', err);
        localStorage.removeItem('kupmax_discount');
      }
    }
  }, []);

  // Zapisz koszyk i rabat do localStorage przy każdej zmianie
  useEffect(() => {
    localStorage.setItem('kupmax_cart', JSON.stringify(cart));
    if (discount) {
      localStorage.setItem('kupmax_discount', JSON.stringify(discount));
    } else {
      localStorage.removeItem('kupmax_discount');
    }
  }, [cart, discount]);

  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // Sprawdź czy odpowiedź to JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        if (text.includes('maintenance')) {
          throw new Error('Sklep jest chwilowo niedostępny (maintenance mode)');
        }
        throw new Error('Nieprawidłowa odpowiedź z serwera');
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'API call failed');
      }
      return data;
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  }, []);

  const checkStock = useCallback(async (productId, quantity = 1) => {
    try {
      const product = await apiCall(`/api/products/${productId}`);
      if (product.stock_quantity !== null && product.stock_quantity < quantity) {
        return {
          available: false,
          message: `Tylko ${product.stock_quantity} sztuk dostępnych`
        };
      }
      return { available: true };
    } catch (err) {
      console.error('Stock check error:', err);
      return { available: true }; // Zakładamy dostępność jeśli sprawdzenie nie powiodło się
    }
  }, [apiCall]);

  const addToCart = useCallback(async (product, quantity = 1) => {
    if (!product || !product.id) {
      console.error('❌ Nieprawidłowy produkt:', product);
      setError('Nieprawidłowy produkt');
      return;
    }

    console.log('🛒 Dodawanie do koszyka:', product.name, 'Ilość:', quantity);

    setLoading(true);
    setError(null);

    try {
      // Sprawdź czy produkt już jest w koszyku
      const existingItem = cart.find(item => item.id === product.id);

      if (existingItem) {
        // Aktualizuj ilość
        const newQuantity = existingItem.quantity + quantity;

        // Sprawdź stan magazynowy
        const stockCheck = await checkStock(product.id, newQuantity);
        if (!stockCheck.available) {
          setError(stockCheck.message);
          setLoading(false);
          return;
        }

        const updatedCart = cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
        setCart(updatedCart);
        console.log('✅ Zaktualizowano ilość produktu w koszyku');
      } else {
        // Sprawdź stan magazynowy
        const stockCheck = await checkStock(product.id, quantity);
        if (!stockCheck.available) {
          setError(stockCheck.message);
          setLoading(false);
          return;
        }

        // Dodaj nowy produkt
        const newItem = {
          id: product.id,
          name: product.name,
          price: product.price || '0',
          image: product.images?.[0]?.src || product.image || '/placeholder.png',
          quantity: quantity,
          stock_quantity: product.stock_quantity,
        };

        setCart([...cart, newItem]);
        console.log('✅ Dodano nowy produkt do koszyka');
      }

    } catch (err) {
      console.error('❌ Błąd dodawania do koszyka:', err);
      setError(err.message || 'Nie udało się dodać produktu do koszyka');
    } finally {
      setLoading(false);
    }
  }, [cart, checkStock]);

  const removeFromCart = useCallback(async (productId) => {
    console.log('🗑️ Usuwanie z koszyka:', productId);
    const newCart = cart.filter(item => item.id !== productId);
    setCart(newCart);

    // Jeśli koszyk jest pusty po usunięciu, wyczyść rabat
    if (newCart.length === 0) {
      setDiscount(null);
      setAppliedCode('');
      localStorage.removeItem('kupmax_discount');
      console.log('🧹 Koszyk pusty - rabat usunięty');
    }
  }, [cart]);

  const updateQuantity = useCallback(async (productId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Sprawdź stan magazynowy
      const stockCheck = await checkStock(productId, newQuantity);
      if (!stockCheck.available) {
        setError(stockCheck.message);
        setLoading(false);
        return;
      }

      const updatedCart = cart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      );
      setCart(updatedCart);
      console.log('✅ Zaktualizowano ilość');
    } catch (err) {
      console.error('❌ Błąd aktualizacji ilości:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [cart, checkStock, removeFromCart]);

  // Wyczyść koszyk i rabat
  const clearCart = useCallback(() => {
    setCart([]);
    setDiscount(null);
    setAppliedCode('');
    localStorage.removeItem('kupmax_cart');
    localStorage.removeItem('kupmax_discount');
    console.log('🧹 Koszyk wyczyszczony');
  }, []);

  // Aktywuj kod rabatowy (obsługuje Pentomino i Tetris)
  const applyDiscount = useCallback((code) => {
    if (!code || typeof code !== 'string') {
      console.log('❌ Brak kodu lub nieprawidłowy format');
      return { success: false, error: 'Nieprawidłowy kod rabatowy.' };
    }

    const codeUpper = code.trim().toUpperCase();
    console.log('🎟️ Próba aktywacji kodu:', codeUpper);

    // Kody rabatowe z gier - 30% rabatu
    if (codeUpper.includes('KUPMAX30') || codeUpper.includes('PENTOMINO30')) {
      const newDiscount = { code: codeUpper, percentage: 0.30 };
      setDiscount(newDiscount);
      setAppliedCode(codeUpper);
      console.log('✅ Rabat 30% aktywowany!');
      return { success: true, message: 'Gratulacje! Rabat 30% został aktywowany!' };
    }

    // Kod Tetris/Pentomino (30%)
    if (codeUpper === 'KUPMAX28OFF' || codeUpper === 'KUPMAX30OFF') {
      const newDiscount = { code: codeUpper, percentage: 0.30 };
      setDiscount(newDiscount);
      setAppliedCode(codeUpper);
      console.log('✅ Rabat 30% aktywowany!');
      return { success: true, message: 'Rabat 30% został aktywowany!' };
    }

    // Jeśli kod jest nieprawidłowy lub pusty, usuń rabat
    setDiscount(null);
    setAppliedCode('');
    console.log('❌ Nieprawidłowy kod rabatowy:', codeUpper);
    return { success: false, error: 'Nieprawidłowy kod rabatowy.' };
  }, []);

  // Oblicz całkowitą liczbę produktów
  const getTotalItems = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Oblicz całkowitą cenę (przed rabatem)
  const getSubtotalPrice = useCallback(() => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      return total + (price * item.quantity);
    }, 0);
  }, [cart]);

  // Oblicz kwotę rabatu
  const getDiscountAmount = useCallback(() => {
    if (!discount) return 0;
    const subtotal = getSubtotalPrice();
    return subtotal * discount.percentage;
  }, [discount, getSubtotalPrice]);

  // Oblicz całkowitą cenę (po rabacie)
  const getTotalPrice = useCallback(() => {
    const subtotal = getSubtotalPrice();
    if (discount) {
      const discountAmount = subtotal * discount.percentage;
      return (subtotal - discountAmount).toFixed(2);
    }
    return subtotal.toFixed(2);
  }, [getSubtotalPrice, discount]);

  const isInCart = useCallback((productId) => {
    return cart.some(item => item.id === productId);
  }, [cart]);

  const getCartQuantity = useCallback((productId) => {
    const item = cart.find(item => item.id === productId);
    return item ? item.quantity : 0;
  }, [cart]);

  const getStockInfo = useCallback((productId) => {
    const item = cart.find(item => item.id === productId);
    if (!item) return null;
    return {
      inStock: item.stock_quantity === null || item.stock_quantity > item.quantity,
      available: item.stock_quantity,
      inCart: item.quantity
    };
  }, [cart]);

  const proceedToCheckout = useCallback(async () => {
    if (cart.length === 0) {
      setError('Koszyk jest pusty');
      return null;
    }

    try {
      setLoading(true);

      // Przygotuj dane zamówienia
      const orderData = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal: getSubtotalPrice(),
        discount: discount ? {
          code: discount.code,
          amount: getDiscountAmount(),
          percentage: discount.percentage
        } : null,
        total: getTotalPrice()
      };

      console.log('📦 Dane zamówienia:', orderData);
      return orderData;

    } catch (err) {
      console.error('❌ Błąd przygotowania zamówienia:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [cart, discount, getSubtotalPrice, getDiscountAmount, getTotalPrice]);

  return {
    cart,
    loading,
    error,
    discount,
    appliedCode,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyDiscount,
    getTotalItems,
    getSubtotalPrice,
    getDiscountAmount,
    getTotalPrice,
    isInCart,
    getCartQuantity,
    getStockInfo,
    proceedToCheckout
  };
}
