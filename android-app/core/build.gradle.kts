plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    id("com.google.dagger.hilt.android") version "2.49"
    id("com.google.devtools.ksp")
}

android {
    namespace = "com.yadadristay.core"
    compileSdk = 34

    defaultConfig {
        minSdk = 26
        targetSdk = 34
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs += listOf("-opt-in=kotlin.RequiresOptIn")
    }

    buildFeatures {
        compose = false
    }
}

dependencies {
    // Core Android
    val coreKtx = "1.13.1"
    val lifecycle = "2.7.0"
    implementation("androidx.core:core-ktx:$coreKtx")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:$lifecycle")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:$lifecycle")

    // Hilt Dependency Injection (KSP)
    val hiltVersion = "2.49"
    val daggerVersion = "2.49"
    implementation("com.google.dagger:hilt-android:$hiltVersion")
    implementation("com.google.dagger:dagger:$daggerVersion")
    ksp("com.google.dagger:hilt-compiler:$hiltVersion")

    // Retrofit & Networking
    val retrofitVersion = "2.11.0"
    val okhttpVersion = "4.12.0"
    val moshiVersion = "1.15.1"
    implementation("com.squareup.retrofit2:retrofit:$retrofitVersion")
    implementation("com.squareup.retrofit2:converter-moshi:$retrofitVersion")
    implementation("com.squareup.okhttp3:okhttp:$okhttpVersion")
    implementation("com.squareup.okhttp3:logging-interceptor:$okhttpVersion")
    implementation("com.squareup.moshi:moshi-kotlin:$moshiVersion")
    ksp("com.squareup.moshi:moshi-kotlin-codegen:$moshiVersion")

    // Room Database (KSP)
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    ksp("androidx.room:room-compiler:$roomVersion")

    // Coroutines & Flow
    val coroutinesVersion = "1.8.0"
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:$coroutinesVersion")

    // WorkManager
    val workVersion = "2.9.0"
    implementation("androidx.work:work-runtime-ktx:$workVersion")

    // DataStore for preferences
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    // Project modules
    // implementation(project(":domain")) // if we create a domain module
}