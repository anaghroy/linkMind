export default class ApiResponse {
  static success(message, data = {}) {
    return {
      success: true,
      message,
      ...data,
    };
  }

  static error(message, data = {}) {
    return {
      success: false,
      message,
      ...data,
    };
  }
}