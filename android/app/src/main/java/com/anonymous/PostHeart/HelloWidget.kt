package com.anonymous.PostHeart

import android.util.TypedValue
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews

import org.json.JSONObject


class HelloWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // Loop through every instance of the widget
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }
}

internal fun updateAppWidget(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int
) {
    // 1. Open the Locker
    val sharedPref = context.getSharedPreferences("DATA", Context.MODE_PRIVATE)
    val jsonString = sharedPref.getString("appData", "{}")

    // 2. Load the View
    val views = RemoteViews(context.packageName, R.layout.widget_layout)

    try {
        // 3. Parse the JSON
        val json = JSONObject(jsonString)
        
        // Get the raw text (Renaming to 'rawText' to differentiate from final display)
        val rawText = json.optString("text", "Waiting for note...")
        val timeText = json.optString("time", "") 
        val senderText = json.optString("sender", "") 

        // A. Wrap in Quotes
        // We skip quotes if it's the default "Waiting..." message to keep it clean
        val finalNote = if (rawText == "Waiting for note...") rawText else "\"$rawText\""

        // B. Calculate Font Size based on length
        val fontSize = when {
            rawText.length <= 12 -> 30f
            rawText.length <= 30 -> 24f   // Short & Loud (e.g. "Miss you!")
            rawText.length <= 80 -> 20f   // Medium Sentence
            else -> 16f                   // Long Story
        }

        // C. Apply Size (COMPLEX_UNIT_SP handles system font scaling)
        views.setTextViewTextSize(R.id.widget_note, TypedValue.COMPLEX_UNIT_SP, fontSize)

        // D. Apply theme
        val theme = json.optString("theme", "light") // Default to light yellow

        val bgResId = when (theme) {
            "pink" -> R.drawable.widget_background_pink
            "dark" -> R.drawable.widget_background_dark
            "duck_rain" -> R.drawable.duck_rain
            "bunny" -> R.drawable.bunny
            "duck_wink" -> R.drawable.duck_wink
            "duck_clueless" -> R.drawable.duck_clueless
            "mm_hug" -> R.drawable.mm_hug
            // "paper" -> R.drawable.bg_paper
            else -> R.drawable.widget_background
        }
        val textColor = if (theme == "dark" || theme == "pink") 0xFFFFFFFF.toInt() else 0xFF2D3436.toInt()

        views.setImageViewResource(R.id.widget_background_image, bgResId)
        views.setTextColor(R.id.widget_note, textColor)
        views.setTextColor(R.id.widget_timestamp, textColor)
        views.setTextColor(R.id.widget_signature, textColor)
        views.setTextColor(R.id.header_text, textColor)

        // -------------------------

        // 4. Update the Layout Views
        views.setTextViewText(R.id.widget_note, finalNote)
        views.setTextViewText(R.id.widget_timestamp, timeText)
        views.setTextViewText(R.id.widget_signature, senderText)

    } catch (e: Exception) {
        // Fallback: If parsing fails, show raw string with standard size
        views.setTextViewTextSize(R.id.widget_note, TypedValue.COMPLEX_UNIT_SP, 16f)
        views.setTextViewText(R.id.widget_note, jsonString)
        views.setTextViewText(R.id.widget_timestamp, "Error")
        views.setTextViewText(R.id.widget_signature, "")
    }

    // 5. Tell system to draw
    appWidgetManager.updateAppWidget(appWidgetId, views)
}