package com.yadadristay.presentation.main

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import dagger.hilt.android.AndroidEntryPoint
import com.yadadristay.ui.theme.YadadriStay
import com.yadadristay.presentation.navigation.AppNavHost

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            YadadriStay {
                AppNavHost()
            }
        }
    }
}