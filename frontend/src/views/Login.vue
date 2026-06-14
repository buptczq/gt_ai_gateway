<template>
    <div class="login-container">
        <a-card class="login-card">
            <template #title>
                <div class="card-title">
                    <img src="/favicon.svg" alt="Logo" class="logo" />
                    <span>GT AI Gateway</span>
                </div>
            </template>
            <a-form
                :model="formState"
                :rules="rules"
                @finish="handleLogin"
                layout="vertical"
            >
                <a-form-item label="Admin Token" name="token">
                    <a-input
                        v-model:value="formState.token"
                        placeholder="请输入管理员 Token"
                        size="large"
                    />
                </a-form-item>
                <a-form-item>
                    <a-button
                        type="primary"
                        html-type="submit"
                        size="large"
                        block
                        :loading="loading"
                    >
                        登录
                    </a-button>
                </a-form-item>
            </a-form>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { notifyError, notifySuccess } from '@/utils/requestFeedback';

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);

const formState = reactive({
    token: '',
});

const rules = {
    token: [{ required: true, message: '请输入 Token' }],
};

async function handleLogin() {
    if (!formState.token.trim()) {
        notifyError('请输入 Token');
        return;
    }

    loading.value = true;
    try {
        const result = await authStore.login(formState.token);
        if (result.success) {
            notifySuccess('登录成功');
            const redirect = router.currentRoute.value.query.redirect as string;
            router.push(redirect || '/dashboard');
        } else {
            notifyError(result.message === 'User disabled' ? '该账号已被禁用' : result.message || 'Token 验证失败');
        }
    } catch (_error) {
        notifyError('登录失败，请检查 Token');
    } finally {
        loading.value = false;
    }
}
</script>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f5f5f5;
    background-image: linear-gradient(#e5e5e5 1px, transparent 1px),
        linear-gradient(90deg, #e5e5e5 1px, transparent 1px);
    background-size: 20px 20px;
}

.login-card {
    width: 400px;
}

.card-title {
    display: flex;
    align-items: center;
    gap: 10px;
}

.logo {
    width: 24px;
    height: 24px;
    object-fit: contain;
}
</style>
