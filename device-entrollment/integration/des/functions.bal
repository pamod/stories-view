import ballerina/sql;

// Check if a device is already enrolled
function isDeviceEnrolled(string deviceId) returns boolean|error {
    Device|sql:Error result = dbClient->queryRow(
        `SELECT device_id, device_name, device_type, user_name 
         FROM devices WHERE device_id = ${deviceId}`
    );
    
    if result is sql:NoRowsError {
        return false;
    } else if result is sql:Error {
        return result;
    }
    return true;
}

// Register a new device
function registerDevice(string deviceId, string deviceName, string deviceType, string userName) returns error? {
    sql:ExecutionResult _ = check dbClient->execute(
        `INSERT INTO devices (device_id, device_name, device_type, user_name) 
         VALUES (${deviceId}, ${deviceName}, ${deviceType}, ${userName})`
    );
    
    sql:ExecutionResult _ = check dbClient->execute(
        `INSERT INTO device_users (device_id, user_id, is_authorized, is_active) 
         VALUES (${deviceId}, ${userName}, true, false)`
    );
}

// Verify if a user is authorized to access a device
function verifyDeviceAccess(string deviceId, string userId) returns DeviceVerificationResponse|error {
    Device|sql:Error deviceResult = dbClient->queryRow(
        `SELECT device_id, device_name, device_type, user_name 
         FROM devices WHERE device_id = ${deviceId}`
    );
    
    if deviceResult is sql:NoRowsError {
        return {
            status: "error",
            details: "Device not found"
        };
    } else if deviceResult is sql:Error {
        return deviceResult;
    }
    
    DeviceUser|sql:Error userResult = dbClient->queryRow(
        `SELECT device_id, user_id, is_authorized, is_active 
         FROM device_users WHERE device_id = ${deviceId} AND user_id = ${userId}`
    );
    
    if userResult is sql:NoRowsError {
        return {
            status: "error",
            details: "User is not authorized to login to device"
        };
    } else if userResult is sql:Error {
        return userResult;
    } else {
        boolean isAuthorized = userResult.is_authorized;
        
        if !isAuthorized {
            return {
                status: "error",
                details: "User is not authorized to login to device"
            };
        }
        
            boolean isActive = userResult.is_active;
        
        if isActive {
            return {status: "successful"};
        }
        
        ActiveDeviceCount countResult = check dbClient->queryRow(
            `SELECT COUNT(*) as active_count 
             FROM device_users 
             WHERE user_id = ${userId} AND is_active = true`
        );
        
        int activeCount = countResult.active_count;
        
        if activeCount >= maxLoginCount {
            return {
                status: "error",
                details: "Max device count has been exceeded"
            };
        }
        
        return {status: "successful"};
    }
}

// Update device state when user authenticates
function updateDeviceAuthentication(string deviceId, string userId) returns string|error {
    sql:ExecutionResult result = check dbClient->execute(
        `UPDATE device_users SET is_active = true 
         WHERE device_id = ${deviceId} AND user_id = ${userId}`
    );
    
    int|string? affectedRowCount = result.affectedRowCount;
    
    if affectedRowCount is int && affectedRowCount > 0 {
        return deviceId;
    }
    
    return error("Internal error");
}

// Update device state when user logs out
function updateDeviceLogout(string deviceId, string userId) returns string|error {
    sql:ExecutionResult result = check dbClient->execute(
        `UPDATE device_users SET is_active = false 
         WHERE device_id = ${deviceId} AND user_id = ${userId}`
    );
    
    int|string? affectedRowCount = result.affectedRowCount;
    
    if affectedRowCount is int && affectedRowCount > 0 {
        return deviceId;
    }
    
    return error("Internal error");
}

// Get all registered devices for a user
function getRegisteredDevices(string userId) returns RegisteredDeviceInfo[]|error {
    stream<Device, sql:Error?> deviceStream = dbClient->query(
        `SELECT device_id, device_name, device_type, user_name 
         FROM devices WHERE user_name = ${userId}`
    );
    
    RegisteredDeviceInfo[] devices = [];
    
    check from Device device in deviceStream
        do {
            devices.push({
                deviceName: device.device_name,
                deviceType: device.device_type,
                Id: device.device_id
            });
        };
    
    return devices;
}

// Get all active logins for a user
function getActiveLogins(string userId) returns ActiveLoginInfo[]|error {
    stream<record {|string device_id; string device_name; string created_at;|}, sql:Error?> loginStream = dbClient->query(
        `SELECT du.device_id, d.device_name, du.created_at 
         FROM device_users du
         JOIN devices d ON du.device_id = d.device_id
         WHERE du.user_id = ${userId} AND du.is_active = true`
    );
    
    ActiveLoginInfo[] activeLogins = [];
    
    check from var login in loginStream
        do {
            activeLogins.push({
                deviceName: login.device_name,
                Id: login.device_id,
                loginTimestamp: login.created_at
            });
        };
    
    return activeLogins;
}

// Delete a device from the system
function deleteDevice(string deviceId, string userId) returns DeviceDeletionResponse|DeviceErrorResponse|error {
    Device|sql:Error deviceQueryResult = dbClient->queryRow(
        `SELECT device_id, device_name, device_type, user_name 
         FROM devices WHERE device_id = ${deviceId}`
    );
    
    if deviceQueryResult is sql:NoRowsError {
        return {
            'error: "Device not found or not associated with this user"
        };
    } else if deviceQueryResult is sql:Error {
        return deviceQueryResult;
    } else {
        string deviceOwner = deviceQueryResult.user_name;
        
        if deviceOwner != userId {
            return {
                'error: "Device not found or not associated with this user"
            };
        }
        
        sql:ExecutionResult result = check dbClient->execute(
            `DELETE FROM devices WHERE device_id = ${deviceId}`
        );
        
        int|string? affectedRowCount = result.affectedRowCount;
        
        if affectedRowCount is int && affectedRowCount > 0 {
            return {
                status: "deleted",
                id: deviceId
            };
        }
        
        return error("Internal error");
    }
}
