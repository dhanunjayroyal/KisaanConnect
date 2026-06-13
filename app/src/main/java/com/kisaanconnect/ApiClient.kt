package com.kisaanconnect

/**
 * ApiClient — KisaanConnect
 *
 * The Android app is a WebView shell. All server communication is handled
 * by kisaan-network.js inside the WebView (LAN auto-discovery + tunnel support).
 *
 * This object exists as a placeholder for any future native Retrofit calls.
 * getServerUrl() intentionally returns "" so that kisaan-network.js takes
 * full control of server resolution — no hardcoded IP is needed.
 */
object ApiClient {
    // Empty → kisaan-network.js will auto-discover the server via LAN scan
    const val BASE_URL = ""
}
