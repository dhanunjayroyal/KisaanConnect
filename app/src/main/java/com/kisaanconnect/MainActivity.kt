package com.kisaanconnect

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.JsResult
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import org.json.JSONObject

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var googleSignInClient: GoogleSignInClient
    private lateinit var googleSignInLauncher: ActivityResultLauncher<Intent>

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // ── 1. Configure Google Sign-In ───────────────────────────────────────
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestEmail()
            .requestProfile()
            .requestIdToken("988035936319-57la08glkrlbasj5e1bp1mrm61l17bps.apps.googleusercontent.com")
            .build()
        googleSignInClient = GoogleSignIn.getClient(this, gso)

        // ── 2. Google Sign-In Result Launcher ─────────────────────────────────
        googleSignInLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            try {
                val account = task.getResult(ApiException::class.java)
                handleSignInResult(account)
            } catch (e: ApiException) {
                Log.e("GoogleSignIn", "Sign-in failed: ${e.statusCode}")
                sendErrorToJs("Google Sign-In failed (code ${e.statusCode}). Please try again.")
            }
        }

        // ── 3. Create WebView as full-screen content view ─────────────────────
        webView = WebView(this)
        setContentView(webView)

        // ── 4. WebView Settings ───────────────────────────────────────────────
        webView.settings.apply {
            javaScriptEnabled          = true
            domStorageEnabled          = true
            allowFileAccess            = true
            allowContentAccess         = true
            @Suppress("DEPRECATION")
            allowFileAccessFromFileURLs    = true
            @Suppress("DEPRECATION")
            allowUniversalAccessFromFileURLs = true
            cacheMode                  = WebSettings.LOAD_DEFAULT
            mixedContentMode           = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            useWideViewPort            = true
            loadWithOverviewMode       = true
            // Improve font rendering
            textZoom                   = 100
            // Enable geolocation (for weather feature)
            setGeolocationEnabled(true)
        }

        // ── 5. WebViewClient — handle page navigation ─────────────────────────
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Inject server URL as a fallback variable after page loads
                // kisaan-network.js reads window.KISAAN_API_URL if Android.getServerUrl() is empty
                view?.evaluateJavascript(
                    "window.KISAAN_API_URL_INJECTED = true;", null
                )
            }
        }

        // ── 6. WebChromeClient — enables alert(), confirm(), prompt() in JS ───
        webView.webChromeClient = object : WebChromeClient() {
            override fun onJsAlert(
                view: WebView?, url: String?, message: String?, result: JsResult?
            ): Boolean {
                android.app.AlertDialog.Builder(this@MainActivity)
                    .setTitle("KisaanConnect")
                    .setMessage(message)
                    .setPositiveButton("OK") { _, _ -> result?.confirm() }
                    .setCancelable(false)
                    .show()
                return true
            }

            override fun onJsConfirm(
                view: WebView?, url: String?, message: String?, result: JsResult?
            ): Boolean {
                android.app.AlertDialog.Builder(this@MainActivity)
                    .setTitle("KisaanConnect")
                    .setMessage(message)
                    .setPositiveButton("Yes") { _, _ -> result?.confirm() }
                    .setNegativeButton("No") { _, _ -> result?.cancel() }
                    .setCancelable(false)
                    .show()
                return true
            }
        }

        // ── 7. JavaScript Bridge ("Android" namespace exposed to WebView JS) ───
        webView.addJavascriptInterface(object {
            /**
             * Returns the API base URL.
             * Returning "" tells kisaan-network.js to auto-discover via LAN scan.
             * kisaan-network.js handles all server resolution — no hardcoded IP needed.
             */
            @JavascriptInterface
            fun getServerUrl(): String = ""

            /** Exposes the device's local Wi-Fi IP to allow scanning its subnet */
            @JavascriptInterface
            fun getDeviceIp(): String = getDeviceIpAddress()

            /** Launches the native Google account picker */
            @JavascriptInterface
            fun launchGoogleSignIn() {
                runOnUiThread {
                    // Sign out first so the account picker always appears
                    googleSignInClient.signOut().addOnCompleteListener {
                        googleSignInLauncher.launch(googleSignInClient.signInIntent)
                    }
                }
            }
        }, "Android")

        // ── 8. Back button — go back in WebView history instead of exiting ────
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                    isEnabled = true
                }
            }
        })

        // ── 9. Load the app ───────────────────────────────────────────────────
        webView.loadUrl("file:///android_asset/index.html")
    }

    // ── Handle Google Sign-In success ────────────────────────────────────────
    private fun handleSignInResult(account: GoogleSignInAccount?) {
        if (account == null) {
            sendErrorToJs("Google Sign-In returned no account.")
            return
        }

        val userJson = JSONObject().apply {
            put("email",    account.email    ?: "")
            put("name",     account.displayName ?: "")
            put("picture",  account.photoUrl?.toString() ?: "")
            put("idToken",  account.idToken  ?: "")
            put("googleId", account.id       ?: "")
        }

        // IMPORTANT: JSON must be passed as a string literal to JS — wrap in quotes
        val jsonString = userJson.toString().replace("\\", "\\\\").replace("'", "\\'")
        val script = "javascript:onNativeGoogleSignInSuccess(JSON.parse('$jsonString'))"
        webView.evaluateJavascript(script, null)
        Log.d("GoogleSignIn", "Sign-in success: ${account.email}")
    }

    // ── Send error back to JS ─────────────────────────────────────────────────
    private fun sendErrorToJs(message: String) {
        val safe = message.replace("'", "\\'")
        val script = "javascript:onNativeGoogleSignInError('$safe')"
        webView.evaluateJavascript(script, null)
    }

    private fun getDeviceIpAddress(): String {
        try {
            val interfaces = java.net.NetworkInterface.getNetworkInterfaces()
            while (interfaces.hasMoreElements()) {
                val networkInterface = interfaces.nextElement()
                val addresses = networkInterface.inetAddresses
                while (addresses.hasMoreElements()) {
                    val address = addresses.nextElement()
                    if (!address.isLoopbackAddress) {
                        val host = address.hostAddress ?: ""
                        if (!host.contains(":")) { // IPv4 check
                            return host
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("Network", "Error getting device IP", e)
        }
        return ""
    }
}
