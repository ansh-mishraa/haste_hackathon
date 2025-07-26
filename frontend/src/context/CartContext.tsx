import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface CartItem {
  productId: string;
  product: {
    id: string;
    name: string;
    unit: string;
    marketPrice: number;
    imageUrl?: string;
    category: string;
  };
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

interface CartState {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CART'; payload: CartItem[] };

const initialState: CartState = {
  items: [],
  totalAmount: 0,
  totalItems: 0,
};

const calculateTotals = (items: CartItem[]): { totalAmount: number; totalItems: number } => {
  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  return { totalAmount, totalItems };
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        item => item.productId === action.payload.productId && item.unit === action.payload.unit
      );

      let newItems: CartItem[];
      
      if (existingItemIndex >= 0) {
        // Update existing item
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? {
                ...item,
                quantity: item.quantity + action.payload.quantity,
                totalPrice: (item.quantity + action.payload.quantity) * item.pricePerUnit,
              }
            : item
        );
      } else {
        // Add new item
        newItems = [...state.items, action.payload];
      }

      const { totalAmount, totalItems } = calculateTotals(newItems);
      return { items: newItems, totalAmount, totalItems };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.productId !== action.payload);
      const { totalAmount, totalItems } = calculateTotals(newItems);
      return { items: newItems, totalAmount, totalItems };
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items
        .map(item =>
          item.productId === action.payload.productId
            ? {
                ...item,
                quantity: action.payload.quantity,
                totalPrice: action.payload.quantity * item.pricePerUnit,
              }
            : item
        )
        .filter(item => item.quantity > 0);

      const { totalAmount, totalItems } = calculateTotals(newItems);
      return { items: newItems, totalAmount, totalItems };
    }

    case 'CLEAR_CART':
      return initialState;

    case 'SET_CART': {
      const { totalAmount, totalItems } = calculateTotals(action.payload);
      return { items: action.payload, totalAmount, totalItems };
    }

    default:
      return state;
  }
};

interface CartContextType {
  state: CartState;
  addItem: (product: any, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setCart: (items: CartItem[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = (product: any, quantity: number = 1) => {
    const cartItem: CartItem = {
      productId: product.id,
      product,
      quantity,
      unit: product.unit,
      pricePerUnit: product.marketPrice || 0,
      totalPrice: quantity * (product.marketPrice || 0),
    };
    dispatch({ type: 'ADD_ITEM', payload: cartItem });
  };

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const setCart = (items: CartItem[]) => {
    dispatch({ type: 'SET_CART', payload: items });
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 