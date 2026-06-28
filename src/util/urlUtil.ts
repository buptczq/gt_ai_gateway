/**
 * 将 OPENAI 格式的 URL 转换为 RESPONSES 格式
 * 将 /chat/completions 替换为 /responses
 */
function convertOpenaiToResponses(url: string): string {
    return url.replace(/\/chat\/completions$/, "/responses");
}

export default {
    convertOpenaiToResponses,
};
