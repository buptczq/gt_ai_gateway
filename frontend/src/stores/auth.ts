import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { status } from '@/api/system';
import { clearAuthToken, getAuthToken, setAuthToken } from '@/utils/authSession';

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string>(getAuthToken());
    const userType = ref<string>('');
    const isLoading = ref(false);

    const isAuthenticated = computed(() => !!token.value);

    function setToken(newToken: string) {
        token.value = newToken;
        setAuthToken(newToken);
    }

    function clearToken() {
        token.value = '';
        userType.value = '';
        clearAuthToken();
    }

    async function validateToken(): Promise<{ success: boolean; message?: string }> {
        if (!token.value) return { success: false, message: '请输入 Token' };

        isLoading.value = true;
        try {
            const data = await status();
            if (data && data.user_type) {
                userType.value = data.user_type;
            } else {
                userType.value = 'admin';
            }
            return { success: true };
        } catch (error: any) {
            clearToken();
            const message = error?.response?.data?.error || error?.message || 'Token 验证失败';
            return { success: false, message };
        } finally {
            isLoading.value = false;
        }
    }

    async function login(newToken: string): Promise<{ success: boolean; message?: string }> {
        setToken(newToken);
        return await validateToken();
    }

    function logout() {
        clearToken();
    }

    return {
        token,
        userType,
        isLoading,
        isAuthenticated,
        setToken,
        clearToken,
        validateToken,
        login,
        logout,
    };
});
