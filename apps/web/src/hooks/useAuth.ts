import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/auth.api';
import { useAuthStore } from '@/lib/auth.store';
import toast from 'react-hot-toast';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setAuth, clearAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (response) => {
      const { attributes, id } = response.data;
      
      // Fetch user profile after login
      try {
        // Temporarily set token to fetch profile
        useAuthStore.setState({ accessToken: attributes.access_token });
        const userResponse = await authApi.getMe();
        const userData = userResponse.data;

        setAuth(
          {
            id: userData.id,
            email: userData.attributes.email,
            fullName: userData.attributes.full_name,
            status: userData.attributes.status,
          },
          attributes.access_token,
          attributes.refresh_token
        );

        toast.success('Welcome back!');
        router.push('/products');
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('Login successful, but failed to load profile.');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Invalid credentials');
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success('Registration successful! Please sign in.');
      router.push('/login');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Registration failed');
    },
  });

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      queryClient.clear();
      router.push('/login');
      toast.success('Signed out successfully');
    }
  };

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout,
  };
}
