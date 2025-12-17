import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import shopkeeperService from '../api/shopkeeperService';

// Shopkeeper store for managing shopkeeper data and KYC status
const shopkeeperStore = create(
  persist(
    (set, get) => ({
      // All shopkeepers in the system
      shopkeepers: [],
      loading: false,
      error: null,

      // Fetch all shopkeepers from backend
      fetchShopkeepers: async () => {
        set({ loading: true, error: null });
        try {
          const response = await shopkeeperService.getAllShopkeepers();
          const shopkeepers = response.shopkeepers || response;
          set({ shopkeepers, loading: false });
          return shopkeepers;
        } catch (error) {
          console.error('Failed to fetch shopkeepers:', error);
          set({ error: error.message, loading: false });
          throw error;
        }
      },
      
      // Add a new shopkeeper
      addShopkeeper: async (shopkeeperData) => {
        set({ loading: true, error: null });
        try {
          const response = await shopkeeperService.createShopkeeper(shopkeeperData);
          // Backend returns { message, shopkeeper }
          const newShopkeeper = response.shopkeeper || response;

          set((state) => ({
            shopkeepers: [...state.shopkeepers, newShopkeeper],
            loading: false,
          }));

          return newShopkeeper;
        } catch (error) {
          console.error('Failed to create shopkeeper:', error);
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      // Update shopkeeper KYC status
      updateShopkeeperKYC: async (shopkeeperId, kycStatus, verifiedBy = 'admin') => {
        try {
          const updatedShopkeeper = await shopkeeperService.updateShopkeeperKYC(shopkeeperId, {
            kycStatus,
            verifiedBy
          });

          set((state) => ({
            shopkeepers: state.shopkeepers.map(s => 
              (s.id === shopkeeperId || s._id === shopkeeperId) ? updatedShopkeeper : s
            ),
          }));

          return true;
        } catch (error) {
          console.error('Failed to update shopkeeper KYC:', error);
          throw error;
        }
      },

      // Get shopkeeper by ID
      getShopkeeperById: (shopkeeperId) => {
        return get().shopkeepers.find(s => s.id === shopkeeperId);
      },

      // Get shopkeepers by KYC status
      getShopkeepersByKYCStatus: (status) => {
        return get().shopkeepers.filter(s => s.kycStatus === status);
      },

      // Get statistics
      getStatistics: () => {
        const shopkeepers = get().shopkeepers;
        return {
          totalShopkeepers: shopkeepers.length,
          pendingKYC: shopkeepers.filter(s => s.kycStatus === 'pending').length,
          verifiedKYC: shopkeepers.filter(s => s.kycStatus === 'verified').length,
          rejectedKYC: shopkeepers.filter(s => s.kycStatus === 'rejected').length,
        };
      },

      // Delete shopkeeper
      deleteShopkeeper: async (shopkeeperId) => {
        try {
          await shopkeeperService.deleteShopkeeper(shopkeeperId);
          set((state) => ({
            shopkeepers: state.shopkeepers.filter(s => s.id !== shopkeeperId && s._id !== shopkeeperId),
          }));
          return true;
        } catch (error) {
          console.error('Failed to delete shopkeeper:', error);
          throw error;
        }
      },

      // Clear all shopkeepers (for testing)
      clearAllShopkeepers: () => {
        set({ shopkeepers: [] });
      },
    }),
    {
      name: 'shopkeeper-store',
      partialize: (state) => ({
        shopkeepers: state.shopkeepers,
      }),
    }
  )
);

export default shopkeeperStore;
