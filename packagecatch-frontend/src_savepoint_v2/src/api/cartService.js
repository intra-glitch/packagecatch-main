/**
 * Cart Service
 * Manages user-specific carts in localStorage.
 * Namespaces keys as cart_{userId} to prevent cart mixing between accounts.
 */

export const cartService = {
    /**
     * Generates a unique key for the user's cart.
     * @param {string} userId - The unique ID of the logged-in user.
     * @returns {string} - The localStorage key.
     */
    getCartKey: (userId) => userId ? `cart_${userId}` : 'cart_guest',

    /**
     * Retrieves the cart items for a specific user.
     * @param {string} userId 
     * @returns {Array} - List of cart items.
     */
    getCart: (userId) => {
        const key = cartService.getCartKey(userId);
        try {
            return JSON.parse(localStorage.getItem(key) || '[]');
        } catch (e) {
            console.error("Error parsing cart:", e);
            return [];
        }
    },

    /**
     * Persists the cart items for a specific user.
     * @param {string} userId 
     * @param {Array} cart 
     */
    saveCart: (userId, cart) => {
        const key = cartService.getCartKey(userId);
        localStorage.setItem(key, JSON.stringify(cart));
        
        // Dispatch a custom event to notify other components (like Navbar) of cart changes
        window.dispatchEvent(new Event('cartUpdated'));
    },

    /**
     * Adds an item to the user's cart.
     */
    addToCart: (userId, product, quantity = 1) => {
        const cart = cartService.getCart(userId);
        const existing = cart.find(item => item.id === product.id);
        
        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.push({
                ...product,
                quantity,
                selected: true
            });
        }
        
        cartService.saveCart(userId, cart);
        return cart;
    },

    /**
     * Removes an item or clears the cart.
     */
    clearCart: (userId) => {
        const key = cartService.getCartKey(userId);
        localStorage.removeItem(key);
        window.dispatchEvent(new Event('cartUpdated'));
    }
};
