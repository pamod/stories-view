// Request and response types for device enrollment service

type DeviceRegistrationRequest record {|
    string deviceName;
    string deviceType;
    string userName;
    string Id;
|};

type DeviceRegistrationResponse record {|
    string id;
|};

type DeviceErrorResponse record {|
    string 'error;
|};

type DeviceVerificationResponse record {|
    string status;
    string? details = ();
|};

type DeviceAuthRequest record {|
    string status;
|};

type DeviceAuthResponse record {|
    string status;
|};

type DeviceLogoutRequest record {|
    string status;
|};

type DeviceLogoutResponse record {|
    string status;
|};

type DeviceDeletionResponse record {|
    string status;
    string id;
|};

// Database record types

type Device record {|
    string device_id;
    string device_name;
    string device_type;
    string user_name;
|};

type DeviceUser record {|
    string device_id;
    string user_id;
    boolean is_authorized;
    boolean is_active;
|};

type ActiveDeviceCount record {|
    int active_count;
|};

type RegisteredDeviceInfo record {|
    string deviceName;
    string deviceType;
    string Id;
|};

type ActiveLoginInfo record {|
    string deviceName;
    string Id;
    string loginTimestamp;
|};

type DeviceQueryErrorResponse record {|
    string 'error;
|};
