import ballerina/http;

listener http:Listener httpListener = check new (servicePort);

@http:ServiceConfig {
    cors: {
        allowOrigins: ["*"],
        allowMethods: ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"], 
        exposeHeaders: ["*"],
        allowCredentials: false,
        maxAge: 84900
    }
}
service /device on httpListener {

    // Device Registration
    resource function post .(@http:Payload DeviceRegistrationRequest payload) returns DeviceRegistrationResponse|DeviceErrorResponse|http:InternalServerError {
        string deviceId = payload.Id;
        string deviceName = payload.deviceName;
        string deviceType = payload.deviceType;
        string userName = payload.userName;
        
        boolean|error enrolled = isDeviceEnrolled(deviceId = deviceId);
        
        if enrolled is error {
            return <http:InternalServerError>{
                body: {
                    'error: "Internal error"
                }
            };
        }
        
        if enrolled {
            return {
                'error: "Already enrolled"
            };
        }
        
        error? registrationResult = registerDevice(deviceId = deviceId, deviceName = deviceName, deviceType = deviceType, userName = userName);
        
        if registrationResult is error {
            return <http:InternalServerError>{
                body: {
                    'error: "Internal error"
                }
            };
        }
        
        return {id: deviceId};
    }

    // Device Verification
    resource function get verify/[string device_id]/[string user_id]() returns DeviceVerificationResponse|http:InternalServerError {
        DeviceVerificationResponse|error verificationResult = verifyDeviceAccess(deviceId = device_id, userId = user_id);
        
        if verificationResult is error {
            return <http:InternalServerError>{
                body: {
                    status: "error",
                    details: "Internal error"
                }
            };
        }
        
        return verificationResult;
    }

    // Device Authentication Notification
    resource function post authenticated/[string device_id]/[string user_id](@http:Payload DeviceAuthRequest payload) returns DeviceAuthResponse|DeviceErrorResponse {
        string|error authResult = updateDeviceAuthentication(deviceId = device_id, userId = user_id);
        
        if authResult is error {
            return {
                'error: "Internal error"
            };
        }
        
        return {status: authResult};
    }

    // Device Logout Notification
    resource function post logout/[string device_id]/[string user_id](@http:Payload DeviceLogoutRequest payload) returns DeviceLogoutResponse|DeviceErrorResponse {
        string|error logoutResult = updateDeviceLogout(deviceId = device_id, userId = user_id);
        
        if logoutResult is error {
            return {
                'error: "Internal error"
            };
        }
        
        return {status: logoutResult};
    }

    // Device Deletion
    resource function delete [string device_id]/[string user_id]() returns DeviceDeletionResponse|DeviceErrorResponse|http:InternalServerError {
        DeviceDeletionResponse|DeviceErrorResponse|error deletionResult = deleteDevice(deviceId = device_id, userId = user_id);
        
        if deletionResult is error {
            return <http:InternalServerError>{
                body: {
                    'error: "Internal error"
                }
            };
        }
        
        return deletionResult;
    }

    // Registered Devices Query
    resource function get devices/[string user_id]() returns RegisteredDeviceInfo[]|DeviceQueryErrorResponse {
        RegisteredDeviceInfo[]|error devices = getRegisteredDevices(userId = user_id);
        
        if devices is error {
            return {
                'error: "User not found or no registered devices"
            };
        }
        
        if devices.length() == 0 {
            return {
                'error: "User not found or no registered devices"
            };
        }
        
        return devices;
    }

    // Active Logins Query
    resource function get active_logins/[string user_id]() returns ActiveLoginInfo[]|DeviceQueryErrorResponse {
        ActiveLoginInfo[]|error activeLogins = getActiveLogins(userId = user_id);
        
        if activeLogins is error {
            return {
                'error: "User not found or no active logins"
            };
        }
        
        if activeLogins.length() == 0 {
            return {
                'error: "User not found or no active logins"
            };
        }
        
        return activeLogins;
    }
}
