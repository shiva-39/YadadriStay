plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.dagger.hilt.android") version "2.49"
    id("com.google.devtools.ksp")
    id("com.google.gms.google-services")
    id("com.google.firebase.appdistribution")
    // id("com.google.firebase.crashlytics")  // Optional - enable if memory allows
}

android {
    namespace = "com.yadadristay"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.yadadristay"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables.useSupportLibrary = true
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
        debug {
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs += listOf("-opt-in=kotlin.RequiresOptIn", "-P", "plugin:androidx.compose.compiler.plugins.kotlin:suppressKotlinVersionCompatibilityCheck=1.9.20")
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.10"
    }

    buildFeatures {
        compose = true
        viewBinding = true
    }
}

dependencies {
    // Core Android
    val coreKtx = "1.13.1"
    val lifecycle = "2.7.0"
    val activity = "1.9.0"
    val fragment = "1.6.2"

    implementation("androidx.core:core-ktx:$coreKtx")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:$lifecycle")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:$lifecycle")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:$lifecycle")
    implementation("androidx.activity:activity-compose:$activity")
    implementation("androidx.fragment:fragment-ktx:$fragment")

    // Splash Screen
    implementation("androidx.core:core-splashscreen:1.0.1")

    // Material Components (for XML themes)
    val materialVersion = "1.12.0"
    implementation("com.google.android.material:material:$materialVersion")

    // Compose BOM - use version compatible with Kotlin 1.9.20
    val composeBom = platform("androidx.compose:compose-bom:2024.08.00")
    implementation(composeBom)
    // Core Compose
    implementation("androidx.compose.runtime:runtime")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-text")
    implementation("androidx.compose.ui:ui-unit")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.foundation:foundation-layout")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material3:material3-window-size-class")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.runtime:runtime-livedata")
    implementation("androidx.compose.runtime:runtime-rxjava2")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.ui:ui-tooling")
    implementation("androidx.compose.ui:ui-test-manifest")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test")

    // Navigation
    val navVersion = "2.7.6"
    implementation("androidx.navigation:navigation-compose:$navVersion")
    implementation("androidx.navigation:navigation-fragment-ktx:$navVersion")

    // Hilt Navigation Compose (for hiltViewModel())
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")

    // Coil Image Loading
    val coilVersion = "2.6.0"
    implementation("io.coil-kt:coil-compose:$coilVersion")

    // Accompanist (for system UI controller, permissions, etc.)
    val accompanistVersion = "0.32.0"
    implementation("com.google.accompanist:accompanist-systemuicontroller:$accompanistVersion")
    implementation("com.google.accompanist:accompanist-permissions:$accompanistVersion")

    // Core module (contains ViewModels, Repositories, UseCases, etc.)
    implementation(project(":core"))

    // UI module (contains Compose screens)
    implementation(project(":ui"))

    // Firebase
    val firebaseBom = platform("com.google.firebase:firebase-bom:32.8.0")
    implementation(firebaseBom)
    implementation("com.google.firebase:firebase-analytics-ktx")
    // implementation("com.google.firebase:firebase-crashlytics-ktx")  // Optional - enable if memory allows

    // Hilt & KSP dependencies for app module (Application, MainActivity)
    val hiltVersion = "2.49"
    val daggerVersion = "2.49"
    implementation("com.google.dagger:hilt-android:$hiltVersion")
    implementation("com.google.dagger:dagger:$daggerVersion")
    ksp("com.google.dagger:hilt-compiler:$hiltVersion")

    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.mockito:mockito-core:5.11.0")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.1.0")
    testImplementation("androidx.arch.core:core-testing:2.2.0")
    testImplementation("com.nhaarman.mockitokotlin2:mockito-kotlin:2.2.0")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    androidTestImplementation("androidx.compose.ui:ui-test-manifest")
    debugImplementation("androidx.compose.ui:ui-tooling")
}