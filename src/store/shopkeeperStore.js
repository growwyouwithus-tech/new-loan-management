import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Shopkeeper store for managing shopkeeper data and KYC status
const shopkeeperStore = create(
  persist(
    (set, get) => ({
      // All shopkeepers in the system
      shopkeepers: [],
      
      // Add a new shopkeeper
      addShopkeeper: (shopkeeperData) => {
        const newShopkeeper = {
          id: Date.now(),
          shopkeeperId: `SK${String(Date.now()).slice(-6)}`,
          ...shopkeeperData,
          kycStatus: 'pending', // pending, verified, rejected
          registrationDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          shopkeepers: [...state.shopkeepers, newShopkeeper],
        }));

        return newShopkeeper;
      },

      // Update shopkeeper KYC status
      updateShopkeeperKYC: (shopkeeperId, kycStatus, verifiedBy = 'admin') => {
        const shopkeeper = get().shopkeepers.find(s => s.id === shopkeeperId);
        if (!shopkeeper) return false;

        const updatedShopkeeper = {
          ...shopkeeper,
          kycStatus,
          verifiedBy,
          verifiedDate: kycStatus === 'verified' ? new Date().toISOString().split('T')[0] : null,
          rejectedDate: kycStatus === 'rejected' ? new Date().toISOString().split('T')[0] : null,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          shopkeepers: state.shopkeepers.map(s => s.id === shopkeeperId ? updatedShopkeeper : s),
        }));

        return true;
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
      deleteShopkeeper: (shopkeeperId) => {
        set((state) => ({
          shopkeepers: state.shopkeepers.filter(s => s.id !== shopkeeperId),
        }));
        return true;
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
