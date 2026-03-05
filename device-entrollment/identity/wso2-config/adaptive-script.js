/**
 * WSO2 IS Adaptive Authentication Script — Device Validation
 *
 * Flow:
 *  1. User submits credentials + device_id to the banking app
 *  2. Banking app initiates OIDC authorize request with device_id as a custom param
 *  3. WSO2 IS runs Step 1 (username/password)
 *  4. On success, this script calls GET /device/verify/{device_id}/{user_id}
 *  5. If DES returns status "successful" → calls POST /device/authenticated/{device_id}/{user_id}
 *     to increment the active login count, then tokens are issued
 *  6. If DES returns status "error" → login is rejected with the DES details message
 *
 * Configuration:
 *  - Set DES_BASE_URL below to match your DES deployment
 *  - In docker-compose the DES is reachable at http://des-service:8080
 *    In local dev (no Docker) use http://localhost:8080
 *
 * Compatible with: WSO2 IS 6.x / 7.x
 * httpGet/httpPost are async (long-wait) functions:
 *   httpGet(url, headers, { onSuccess: fn(context, data), onFail: fn(context, data) })
 *   httpPost(url, body, headers, { onSuccess: fn(context, data), onFail: fn(context, data) })
 *
 * Per WSO2 IS spec, the `data` parameter in both onSuccess and onFail is already
 * a parsed JSON object — do NOT call JSON.parse(data).
 */

// ---- Configuration (update to match your environment) ----------------------
var DES_BASE_URL = "http://localhost:8080";

// Banking app URL. On authentication failure, WSO2 IS redirects here with
// ?status=<code>&statusMsg=<message>&i18nkey=<key> so the app can display
// a custom error page instead of the generic WSO2 retry.do page.
// Update this to match your banking app deployment URL.
var IS_RETRY_PAGE = "http://localhost:3000";

// Script-level variable so it survives across the executeStep and httpGet
// long-wait boundaries. WSO2 IS does NOT serialize JS closure scopes when
// resuming callbacks — only the script-level (global) scope is preserved.
// Each authentication session gets its own script instance, so this is safe.
var capturedDeviceId = null;
// ---------------------------------------------------------------------------

var onLoginRequest = function (context) {

    // Capture device_id NOW, before executeStep.
    // context.request.params reflects the original OIDC authorize request here,
    // but after executeStep it reflects the credential form POST — where device_id
    // is absent. Assigning to the script-level var (no 'var' keyword here) so
    // the value is visible to all callbacks without relying on closure serialization.
    capturedDeviceId = (context.request.params && context.request.params.device_id)
        ? context.request.params.device_id[0]
        : null;

    if (capturedDeviceId) {
        Log.info("Received login request with device_id: " + capturedDeviceId);
    }

    // Step 1: Standard username/password authentication
    executeStep(1, {
        onSuccess: function (context) {

            var fullIdentifier = context.currentKnownSubject.identifier;
            var username = fullIdentifier.indexOf("@") !== -1
                ? fullIdentifier.split("@")[0]
                : fullIdentifier;

            // Use the pre-captured closure variable — context.request.params here
            // reflects the login form POST and no longer contains device_id.
            var deviceId = capturedDeviceId;

            if (!deviceId || deviceId.trim() === "") {
                Log.error("Device-aware login rejected: no device_id provided for user: " + username);
                sendError(IS_RETRY_PAGE, {
                    "status": "DEVICE_ID_MISSING",
                    "statusMsg": "A device_id is required to log in to this application.",
                    "i18nkey": "not.allowed.error"
                });
                return;
            }

            // Step 2: Verify the device is authorized for this user.
            // DES API: GET /device/verify/{device_id}/{user_id}
            var verifyUrl = DES_BASE_URL
                + "/device/verify/"
                + encodeURIComponent(deviceId)
                + "/"
                + encodeURIComponent(username);

            Log.info("Verifying device '" + deviceId + "' for user '" + username + "'.");

            // httpGet(url, headers, eventHandlers) — async long-wait in WSO2 IS 6.x/7.x
            // Per spec: data in onSuccess/onFail is already a parsed JSON object.
            httpGet(verifyUrl, {}, {
                onSuccess: function (context, data) {
                    // Re-derive from built-in context properties — custom properties set
                    // on context (e.g. context.desUsername) are NOT serialized across the
                    // GraalJS long-wait boundary and will be null on resumption.
                    var fullIdentifier = context.steps[1].subject.identifier;
                    var _username = fullIdentifier.indexOf("@") !== -1
                        ? fullIdentifier.split("@")[0]
                        : fullIdentifier;
                    var _deviceId = capturedDeviceId;

                    // DES returns { "status": "successful" } on success, or
                    // { "status": "error", "details": "<reason>" } on failure.
                    // data is already a parsed object per the WSO2 IS httpGet spec.
                    if (!data || data.status !== "successful") {
                        var details = (data && data.details) || "Device access denied.";
                        Log.error("Device verification failed for user '" + _username + "'. Details: " + details);
                        sendError(IS_RETRY_PAGE, {
                            "status": "DEVICE_NOT_PERMITTED",
                            "statusMsg": "Login denied: " + friendlyReason(details),
                            "i18nkey": "device.not.permitted"
                        });
                        return;
                    }

                    // Persist device_id into the WSO2 IS session so the SESSION_TERMINATE
                    // event handler can retrieve it at logout time to notify DES.
                    // context.sessionDataMap is a Map<String, String> serialized with the
                    // session — it survives across GraalJS long-wait boundaries and is
                    // accessible from IdentityEventHandler via SessionContext.getProperty().
                    if (context.sessionDataMap) {
                        context.sessionDataMap["device_id"] = _deviceId;
                        Log.info("Stored device_id '" + _deviceId + "' in session for logout notification.");
                    }

                    // Step 3: Notify DES of the successful authentication to increment the
                    // active login count in MySQL.
                    // DES API: POST /device/authenticated/{device_id}/{user_id}
                    var authNotifyUrl = DES_BASE_URL
                        + "/device/authenticated/"
                        + encodeURIComponent(_deviceId)
                        + "/"
                        + encodeURIComponent(_username);

                    Log.info("Notifying DES of successful auth for device '" + _deviceId + "', user '" + _username + "'.");

                    // httpPost(url, body, headers, eventHandlers) — async long-wait
                    // body must be a Map<String, Object> (plain JS object), NOT a JSON string.
                    httpPost(authNotifyUrl, { "status": "auth" }, {
                        "Content-Type": "application/json"
                    }, {
                        onSuccess: function (_context, _data) {
                            Log.info("DES auth notification confirmed. Login allowed.");
                        },
                        onFail: function (context, _data) {
                            // Non-fatal: the verify already passed; log the failure but allow login.
                            Log.info("DES auth notification failed. Login will still proceed.");
                        }
                    });
                },

                onFail: function (context, data) {
                    // Per WSO2 IS spec, data is a parsed JSON object in onFail too.
                    // DES may return { "status": "error", "details": "<reason>" } with a non-2xx status.
                    var _failIdentifier = context.steps[1].subject.identifier;
                    var _failUsername = _failIdentifier.indexOf("@") !== -1 ? _failIdentifier.split("@")[0] : _failIdentifier;
                    Log.error("DES verify call failed for user '" + _failUsername + "'.");

                    var errorCode = "DES_UNREACHABLE";
                    var errorMessage = "Device verification service is unavailable. Please try again later.";

                    if (data && data.status === "error" && data.details) {
                        errorCode = "DEVICE_NOT_PERMITTED";
                        errorMessage = "Login denied: " + friendlyReason(data.details);
                    }

                    sendError(IS_RETRY_PAGE, {
                        "status": errorCode,
                        "statusMsg": errorMessage,
                        "i18nkey": (errorCode === "DEVICE_NOT_PERMITTED") ? "device.not.permitted" : "des.unreachable"
                    });
                }
            });
        },

        onFail: function (context) {
            // Step 1 (credentials) failed — let WSO2 handle the error normally.
            Log.info("Step 1 authentication failed.");

            var errorCode = "WRONG_CREDENTIALS";
            var errorMessage = "The username or the password you entered is not correct";

            sendError(IS_RETRY_PAGE, {
                "status": errorCode,
                "statusMsg": errorMessage,
                "i18nkey": "iam.wrong.credentials"
            });
        }
    });
};

/**
 * Map a DES error details string to a user-friendly message.
 * DES returns free-text in the "details" field; we do a substring match
 * on the two documented error strings from the API spec.
 */
function friendlyReason(details) {
    if (details.indexOf("Max login count") !== -1) {
        return "The maximum number of concurrent logins for this device has been reached.";
    }
    if (details.indexOf("not authorized") !== -1) {
        return "This device is not registered or authorized for your account.";
    }
    return details;
}
