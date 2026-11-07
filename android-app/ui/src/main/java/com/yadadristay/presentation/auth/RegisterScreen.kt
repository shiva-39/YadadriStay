package com.yadadristay.presentation.auth

import com.yadadristay.presentation.components.Str

import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yadadristay.presentation.auth.AuthViewModel
import com.yadadristay.presentation.components.str
import com.yadadristay.presentation.components.YadadriButton
import com.yadadristay.presentation.components.YadadriTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Email
import androidx.compose.ui.text.input.PasswordVisualTransformation

@OptIn(ExperimentalMaterial3Api::class, ExperimentalComposeUiApi::class)
@Composable
fun AuthScreen(
    viewModel: AuthViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onLoginSuccess: () -> Unit,
    onNavigateToRegister: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(vertical = 16.dp),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
            shadowElevation = 8.dp
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                // Header
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "🕉️",
                        fontSize = 48.sp
                    )
                    Text(
                        text = str(LocalContext.current, Str.welcome_back),
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = str(LocalContext.current, Str.sign_in_to_continue),
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                // Login Form
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Phone/Email field
                    YadadriTextField(
                        label = str(LocalContext.current, Str.phone_or_email),
                        value = uiState.phoneOrEmail,
                        onValueChange = viewModel::onPhoneOrEmailChange,
                        placeholder = str(LocalContext.current, Str.enter_phone_or_email),
                        leadingIcon = Icons.Filled.Phone,
                        keyboardOptions = KeyboardOptions.Default.copy(
                            keyboardType = KeyboardType.Phone
                        ),
                        isError = uiState.phoneOrEmailError != null,
                        errorText = uiState.phoneOrEmailError
                    )

                    // Password field
                    var passwordVisible by remember { mutableStateOf(false) }
                    YadadriTextField(
                        label = str(LocalContext.current, Str.password),
                        value = uiState.password,
                        onValueChange = viewModel::onPasswordChange,
                        placeholder = str(LocalContext.current, Str.enter_password),
                        leadingIcon = Icons.Filled.Lock,
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        isError = uiState.passwordError != null,
                        errorText = uiState.passwordError
                    )

                    // Forgot password
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        TextButton(onClick = { /* Navigate to forgot password */ }) {
                            Text(
                                text = str(LocalContext.current, Str.forgot_password),
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }

                    // Login button
                    YadadriButton(
                        text = str(LocalContext.current, Str.login),
                        onClick = { viewModel.login() },
                        isLoading = uiState.isLoading,
                        enabled = uiState.isFormValid
                    )

                    // Divider
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        androidx.compose.material3.Divider(
                            modifier = Modifier.weight(1f).padding(end = 16.dp),
                            color = MaterialTheme.colorScheme.outlineVariant
                        )
                        Text(
                            text = str(LocalContext.current, Str.or),
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontSize = 14.sp
                        )
                        androidx.compose.material3.Divider(
                            modifier = Modifier.weight(1f).padding(start = 16.dp),
                            color = MaterialTheme.colorScheme.outlineVariant
                        )
                    }

                    // Google Sign In
                    Button(
                        onClick = { viewModel.signInWithGoogle() },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !uiState.isLoading,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.surfaceContainerHighest,
                            contentColor = MaterialTheme.colorScheme.onSurface
                        )
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Google icon placeholder
                            Box(
                                modifier = Modifier.size(20.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(text = "G", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFFDB4437))
                            }
                            androidx.compose.foundation.layout.Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = str(LocalContext.current, Str.continue_with_google),
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }

                // Register link
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = str(LocalContext.current, Str.dont_have_account),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    TextButton(onClick = onNavigateToRegister) {
                        Text(
                            text = str(LocalContext.current, Str.register),
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun RegisterScreen(
    viewModel: AuthViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onRegisterSuccess: () -> Unit,
    onNavigateToLogin: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var passwordVisible by remember { mutableStateOf(false) }
    var confirmPasswordVisible by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.TopCenter
        ) {
            IconButton(onClick = { /* Navigate back */ }) {
                Icon(
                    imageVector = Icons.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = MaterialTheme.colorScheme.onSurface
                )
            }
        }

        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(vertical = 16.dp),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
            shadowElevation = 8.dp
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                // Header
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "🕉️",
                        fontSize = 48.sp
                    )
                    Text(
                        text = str(LocalContext.current, Str.create_account),
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = str(LocalContext.current, Str.join_yadadri_stay),
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                // Register Form
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Full Name
                    YadadriTextField(
                        label = str(LocalContext.current, Str.full_name),
                        value = uiState.fullName,
                        onValueChange = viewModel::onFullNameChange,
                        placeholder = str(LocalContext.current, Str.enter_full_name),
                        leadingIcon = Icons.Filled.Person,
                        isError = uiState.fullNameError != null,
                        errorText = uiState.fullNameError
                    )

                    // Phone/Email
                    YadadriTextField(
                        label = str(LocalContext.current, Str.phone_or_email),
                        value = uiState.phoneOrEmail,
                        onValueChange = viewModel::onPhoneOrEmailChange,
                        placeholder = str(LocalContext.current, Str.enter_phone_or_email),
                        leadingIcon = Icons.Filled.Phone,
                        keyboardOptions = KeyboardOptions.Default.copy(
                            keyboardType = KeyboardType.Phone
                        ),
                        isError = uiState.phoneOrEmailError != null,
                        errorText = uiState.phoneOrEmailError
                    )

                    // Password
                    var passwordVisible by remember { mutableStateOf(false) }
                    YadadriTextField(
                        label = str(LocalContext.current, Str.password),
                        value = uiState.password,
                        onValueChange = viewModel::onPasswordChange,
                        placeholder = str(LocalContext.current, Str.enter_password),
                        leadingIcon = Icons.Filled.Lock,
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        isError = uiState.passwordError != null,
                        errorText = uiState.passwordError
                    )

                    // Confirm Password
                    var confirmPasswordVisible by remember { mutableStateOf(false) }
                    YadadriTextField(
                        label = str(LocalContext.current, Str.confirm_password),
                        value = uiState.confirmPassword,
                        onValueChange = viewModel::onConfirmPasswordChange,
                        placeholder = str(LocalContext.current, Str.confirm_password),
                        leadingIcon = Icons.Filled.Lock,
                        visualTransformation = if (confirmPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        isError = uiState.confirmPasswordError != null,
                        errorText = uiState.confirmPasswordError
                    )

                    // Register button
                    YadadriButton(
                        text = str(LocalContext.current, Str.register),
                        onClick = { viewModel.register() },
                        isLoading = uiState.isLoading,
                        enabled = uiState.isRegisterFormValid
                    )

                    // Divider
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        androidx.compose.material3.Divider(
                            modifier = Modifier.weight(1f).padding(end = 16.dp),
                            color = MaterialTheme.colorScheme.outlineVariant
                        )
                        Text(
                            text = str(LocalContext.current, Str.or),
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontSize = 14.sp
                        )
                        androidx.compose.material3.Divider(
                            modifier = Modifier.weight(1f).padding(start = 16.dp),
                            color = MaterialTheme.colorScheme.outlineVariant
                        )
                    }

                    // Google Sign Up
                    Button(
                        onClick = { viewModel.signInWithGoogle() },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !uiState.isLoading,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.surfaceContainerHighest,
                            contentColor = MaterialTheme.colorScheme.onSurface
                        )
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier.size(20.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(text = "G", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFFDB4437))
                            }
                            androidx.compose.foundation.layout.Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = str(LocalContext.current, Str.continue_with_google),
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }

                // Login link
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = str(LocalContext.current, Str.already_have_account),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    TextButton(onClick = onNavigateToLogin) {
                        Text(
                            text = str(LocalContext.current, Str.login),
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }
    }
}