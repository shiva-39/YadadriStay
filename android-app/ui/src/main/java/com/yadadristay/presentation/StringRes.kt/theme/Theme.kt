package com.yadadristay.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF006D77),
    primaryContainer = Color(0xFFD1E9E9),
    secondary = Color(0xFF83C5BE),
    secondaryContainer = Color(0xFFE0F2F1),
    tertiary = Color(0xFFFFB703),
    tertiaryContainer = Color(0xFFFFF3E0),
    surface = Color(0xFFFFFFFF),
    background = Color(0xFFF5F5F5),
    error = Color(0xFFB00020)
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF80DEEA),
    primaryContainer = Color(0xFF004C4F),
    secondary = Color(0xFF4DB6AC),
    secondaryContainer = Color(0xFF004D40),
    tertiary = Color(0xFFFFB703),
    tertiaryContainer = Color(0xFF4D3B00),
    surface = Color(0xFF1E1E1E),
    background = Color(0xFF121212),
    error = Color(0xFFCF6679)
)

@Composable
fun YadadriStay(
    darkTheme: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}