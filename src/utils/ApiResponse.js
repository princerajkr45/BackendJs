
class ApiResponse {
    constructor(statusCode, data, message = "success") {
        this.status = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode < 400
    }
}