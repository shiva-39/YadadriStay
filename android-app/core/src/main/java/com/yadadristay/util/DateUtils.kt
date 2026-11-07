package com.yadadristay.util

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

object DateUtils {
    private val apiDateFormat = SimpleDateFormat(Constants.API_DATE_FORMAT, Locale.getDefault())
    private val displayDateFormat = SimpleDateFormat(Constants.DISPLAY_DATE_FORMAT, Locale.getDefault())
    private val displayDateTimeFormat = SimpleDateFormat(Constants.DISPLAY_DATETIME_FORMAT, Locale.getDefault())
    private val timeFormat = SimpleDateFormat(Constants.TIME_FORMAT, Locale.getDefault())
    private val isoDateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).apply {
        timeZone = java.util.TimeZone.getTimeZone("UTC")
    }
    private val isoDateFormatNoMillis = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.getDefault()).apply {
        timeZone = java.util.TimeZone.getTimeZone("UTC")
    }

    fun parseApiDate(dateString: String): Date? {
        return try {
            apiDateFormat.parse(dateString)
        } catch (e: Exception) {
            null
        }
    }

    fun parseIsoDate(dateString: String): Date? {
        return try {
            isoDateFormat.parse(dateString)
        } catch (e: Exception) {
            try {
                isoDateFormatNoMillis.parse(dateString)
            } catch (e2: Exception) {
                null
            }
        }
    }

    fun formatApiDate(date: Date): String = apiDateFormat.format(date)

    fun formatDisplayDate(date: Date): String = displayDateFormat.format(date)

    fun formatDisplayDateTime(date: Date): String = displayDateTimeFormat.format(date)

    fun formatTime(date: Date): String = timeFormat.format(date)

    fun formatApiDateOrNull(date: Date?): String? = date?.let { formatApiDate(it) }

    fun isToday(date: Date): Boolean {
        val today = Date()
        return isSameDay(date, today)
    }

    fun isTomorrow(date: Date): Boolean {
        val tomorrow = Date(System.currentTimeMillis() + TimeUnit.DAYS.toMillis(1))
        return isSameDay(date, tomorrow)
    }

    fun isPast(date: Date): Boolean = date.before(Date())

    fun isFuture(date: Date): Boolean = date.after(Date())

    fun isSameDay(date1: Date, date2: Date): Boolean {
        val cal1 = java.util.Calendar.getInstance().apply { time = date1 }
        val cal2 = java.util.Calendar.getInstance().apply { time = date2 }
        return cal1.get(java.util.Calendar.YEAR) == cal2.get(java.util.Calendar.YEAR) &&
               cal1.get(java.util.Calendar.DAY_OF_YEAR) == cal2.get(java.util.Calendar.DAY_OF_YEAR)
    }

    fun daysBetween(startDate: Date, endDate: Date): Long {
        val diff = endDate.time - startDate.time
        return TimeUnit.MILLISECONDS.toDays(diff)
    }

    fun addDays(date: Date, days: Int): Date {
        val cal = java.util.Calendar.getInstance().apply { time = date }
        cal.add(java.util.Calendar.DAY_OF_MONTH, days)
        return cal.time
    }

    fun startOfDay(date: Date): Date {
        val cal = java.util.Calendar.getInstance().apply { time = date }
        cal.set(java.util.Calendar.HOUR_OF_DAY, 0)
        cal.set(java.util.Calendar.MINUTE, 0)
        cal.set(java.util.Calendar.SECOND, 0)
        cal.set(java.util.Calendar.MILLISECOND, 0)
        return cal.time
    }

    fun endOfDay(date: Date): Date {
        val cal = java.util.Calendar.getInstance().apply { time = date }
        cal.set(java.util.Calendar.HOUR_OF_DAY, 23)
        cal.set(java.util.Calendar.MINUTE, 59)
        cal.set(java.util.Calendar.SECOND, 59)
        cal.set(java.util.Calendar.MILLISECOND, 999)
        return cal.time
    }

    fun getRelativeTimeString(date: Date): String {
        val now = Date()
        val diffMs = now.time - date.time
        val diffMinutes = TimeUnit.MILLISECONDS.toMinutes(diffMs)
        val diffHours = TimeUnit.MILLISECONDS.toHours(diffMs)
        val diffDays = TimeUnit.MILLISECONDS.toDays(diffMs)

        return when {
            diffMinutes < 1 -> "Just now"
            diffMinutes < 60 -> "$diffMinutes min ago"
            diffHours < 24 -> "$diffHours hr ago"
            diffDays < 7 -> "$diffDays day${if (diffDays > 1) "s" else ""} ago"
            else -> formatDisplayDate(date)
        }
    }

    fun getMonthYearString(date: Date): String {
        val format = SimpleDateFormat("MMMM yyyy", Locale.getDefault())
        return format.format(date)
    }

    fun getDayMonthString(date: Date): String {
        val format = SimpleDateFormat("dd MMM", Locale.getDefault())
        return format.format(date)
    }

    fun getWeekdayString(date: Date): String {
        val format = SimpleDateFormat("EEEE", Locale.getDefault())
        return format.format(date)
    }

    fun getShortWeekdayString(date: Date): String {
        val format = SimpleDateFormat("EEE", Locale.getDefault())
        return format.format(date)
    }
}