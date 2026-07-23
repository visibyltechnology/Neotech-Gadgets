import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { INTEREST_RATES_DECIMAL } from '../utils/interestRates';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (product, quantity = 1, paymentChoice = 'full', installments = 1, periodPayment = 0, paymentFrequency = 'monthly') => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) =>
              item.id === product.id &&
              item.paymentChoice === paymentChoice &&
              item.installments === installments &&
              item.paymentFrequency === paymentFrequency
          );

          if (existingItemIndex > -1) {
            const newItems = [...state.items];
            newItems[existingItemIndex] = {
              ...newItems[existingItemIndex],
              quantity: newItems[existingItemIndex].quantity + quantity
            };
            toast.success('Cart updated');
            return { items: newItems };
          }

          toast.success('Added to cart');
          return {
            items: [
              ...state.items,
              {
                ...product,
                quantity,
                paymentChoice,
                installments,
                periodPayment,
                paymentFrequency,
                cartItemId: `${product.id}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
              }
            ]
          };
        });
      },

      removeFromCart: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.cartItemId !== cartItemId)
        }));
      },

      updateQuantity: (cartItemId, newQuantity) => {
        if (newQuantity < 1) return;
        set((state) => ({
          items: state.items.map((item) =>
            item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
          )
        }));
      },

      clearCart: () => set({ items: [] }),

      unifyPaymentFrequency: (newFrequency) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.paymentChoice !== 'installment') return item;
            if (item.paymentFrequency === newFrequency) return item;
            const baseRate = INTEREST_RATES_DECIMAL[item.installments] ?? 0.2;
            const rate = baseRate * (newFrequency === 'weekly' ? 0.5 : 1);
            const fullAmount = item.price * (1 + rate);
            const newPeriodPayment = fullAmount / item.installments;

            return { ...item, paymentFrequency: newFrequency, periodPayment: newPeriodPayment };
          })
        }));
      },

      getCartTotal: () => {
        return get().items.reduce((total, item) => {
          if (item.paymentChoice === 'full') {
            return total + (item.price * item.quantity);
          }
          const baseRate = INTEREST_RATES_DECIMAL[item.installments] || 0;
          const rate = baseRate * (item.paymentFrequency === 'weekly' ? 0.5 : 1);
          return total + (item.price * (1 + rate) * item.quantity);
        }, 0);
      },

      getInitialPaymentTotal: () => {
        return get().items.reduce((total, item) => {
          if (item.paymentChoice === 'full') {
            return total + (item.price * item.quantity);
          }
          return total + ((item.periodPayment || item.monthlyPayment || 0) * item.quantity);
        }, 0);
      }
    }),
    {
      name: 'mayjay-cart-v2'
    }
  )
);

export default useCartStore;

