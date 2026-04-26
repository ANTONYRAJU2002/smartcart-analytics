import { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('smartcart_cart');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('smartcart_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product, quantity = 1, color = null) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id && item.selected_color === color);
            if (existing) {
                return prev.map(item =>
                    (item.id === product.id && item.selected_color === color)
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { ...product, quantity, selected_color: color }];
        });
    };

    const removeFromCart = (productId, color = null, buildId = null) => {
        setCart(prev => {
            if (buildId) {
                // If it's a build, remove all items with that buildId
                return prev.filter(item => item.build_id !== buildId);
            }
            return prev.filter(item => !(item.id === productId && item.selected_color === color));
        });
    };

    const updateQuantity = (productId, quantity, color = null) => {
        if (quantity < 1) return;
        setCart(prev => prev.map(item =>
            (item.id === productId && item.selected_color === color) ? { ...item, quantity } : item
        ));
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
            {children}
        </CartContext.Provider>
    );
};
