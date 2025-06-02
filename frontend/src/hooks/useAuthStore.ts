import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { showConnect } from '@stacks/connect';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { AuthStore, User, WalletConnection } from '@/types';

const appConfig = {
  name: 'StacksQuest',
  icon: typeof window !== 'undefined' ? `${window.location.origin}/icon-192x192.png` : '',
};

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      walletConnection: {
        isConnected: false,
        network: 'testnet',
      },
      isAuthenticated: false,

      login: async (address: string) => {
        try {
          // Call backend API to authenticate user
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ stacksAddress: address }),
          });

          if (!response.ok) {
            throw new Error('Authentication failed');
          }

          const { data: user } = await response.json();
          
          set({
            user,
            isAuthenticated: true,
            walletConnection: {
              ...get().walletConnection,
              address,
              isConnected: true,
            },
          });
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          walletConnection: {
            isConnected: false,
            network: 'testnet',
          },
        });
      },

      connectWallet: async () => {
        return new Promise((resolve, reject) => {
          showConnect({
            appDetails: appConfig,
            redirectTo: '/',
            onFinish: async (authData) => {
              try {
                const address = authData.userSession.loadUserData().profile.stxAddress.testnet;
                await get().login(address);
                resolve();
              } catch (error) {
                console.error('Wallet connection error:', error);
                reject(error);
              }
            },
            onCancel: () => {
              reject(new Error('User cancelled wallet connection'));
            },
          });
        });
      },

      disconnectWallet: () => {
        get().logout();
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },
    }),
    {
      name: 'stacksquest-auth',
      partialize: (state) => ({
        user: state.user,
        walletConnection: state.walletConnection,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
