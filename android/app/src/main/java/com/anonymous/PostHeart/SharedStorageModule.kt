package com.anonymous.PostHeart

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SharedStorageModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "SharedStorage"
    }

    @ReactMethod
    fun set(message: String) {
        // 1. Open the Locker (SharedPreferences)
        val sharedPref = reactApplicationContext.getSharedPreferences("DATA", Context.MODE_PRIVATE)
        val editor = sharedPref.edit()
        
        // 2. Write the note
        editor.putString("appData", message)
        editor.apply()

        // 3. Wake up the Widget to read the new note
        val intent = Intent(reactApplicationContext, HelloWidget::class.java)
        intent.action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        
        // Get IDs of all widgets (in case user added 2 of them)
        val widgetManager = AppWidgetManager.getInstance(reactApplicationContext)
        val ids = widgetManager.getAppWidgetIds(ComponentName(reactApplicationContext, HelloWidget::class.java))
        
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
        reactApplicationContext.sendBroadcast(intent)
    }
}