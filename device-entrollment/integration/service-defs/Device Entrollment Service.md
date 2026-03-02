### **1 Device Registration**

Registers a new device and its category to a specific user profile.

* **Endpoint:** `POST /device`  
* **Request Body:**

JSON

```
{
  "deviceName": "Android_Mobile",
  "deviceType": "Smartphone",
  "userName": "green",
  "Id": "12;3931;49040"
}
```

*   
  **Success Response:** `{ "id": "12:3931;49040" }`  
* **Error Response:** `{ "error": "Already enrolled" }`

---

### **2 Device Verification**

Checks if a user is authorized to access a device based on current login counts.

* **Endpoint:** `GET /device/verify/{device_id}/{user_id}`  
* **Success Response:** `{ "status": "successful" }`  
* **Error Response (Limit Exceeded):** `{ "status": "error", "details": "Max login count has been exceeded" }`  
   \+1  
* **Error Response (Unauthorized):** `{ "status": "error", "details": "User is not authorized to login to device" }`

---

### **3 Device Auth Notification**

Notifies the system of a successful login to increment the state in MySQL.

* **Endpoint:** `POST /device/authenticated/{device_id}/{user_id}`  
* **Request Body:** `{ "status": "auth" }`  
* **Success Response:** `{ "status": "{device_id}" }`  
* **Error Response:** `{ "error": "Internal error" }`

---

### **4 Device Logout Notification**

Notifies the system of a logout to decrement the active login count in MySQL.

* **Endpoint:** `POST /devicelogout/{device_id}/{user_id}`  
* **Request Body:** `{ "status": "logout" }`  
* **Success Response:** `{ "status": "{device_id}" }`  
* **Error Response:** `{ "error": "Internal error" }`

---

### **5 Device Deletion**

Unenrolls a device and removes all associated records from the MySQL database.

* **Endpoint:** `DELETE /device/{device_id}/{user_id}`  
* **Success Response:** \`\`\`json { "status": "deleted", "id": "{device\_id}" }

**6 Registered Devices Query**

Retrieves a list of all devices registered to a specific user profile.

* **Endpoint:** GET /devices/{user\_id}  
* **Success Response:**

JSON

\[

{

```
"deviceName": "Android\_Mobile",
"deviceType": "Smartphone",
"Id": "12:3931;49040"
```

},

{

```
"deviceName": "Pamod\_Laptop",
"deviceType": "Laptop",
"Id": "99:2000;10000"
```

}

\]

* **Error Response:** { "error": "User not found or no registered devices" }

**7 Active Logins Query**

Retrieves a list of all devices where the user currently has an active login session.

* **Endpoint:** GET /active\_logins/{user\_id}  
* **Success Response:**

JSON

\[

{

`"deviceName": "Android\_Mobile",`

`"Id": "12:3931;49040",`

`"loginTimestamp": "2026-02-18T11:00:00Z`

}

\]

* **Error Response:** { "error": "User not found or no active logins" }

