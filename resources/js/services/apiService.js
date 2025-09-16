/**
 * API 服務模組 (預留檔案)
 * 目前後端 API 尚未準備好
 * 等後端準備好後在這裡實作 API 邏輯
 */

class ApiService {
  constructor() {
    console.log('📝 API 服務已初始化 (目前為預留狀態)')
  }

  /**
   * 檢查 API 是否可用 (目前總是返回 false)
   * @returns {boolean} API 是否可用
   */
  isApiAvailable() {
    return false // 目前後端尚未準備好
  }

  // 未來在這裡實作真實的 API 方法:
  // async getUserData(userId) { ... }
  // async saveData(data) { ... }
}

// 創建單例實例
export const apiService = new ApiService()
export default apiService
