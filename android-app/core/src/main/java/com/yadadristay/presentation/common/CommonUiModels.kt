package com.yadadristay.presentation.common

data class LodgeUiModel(
    val id: String,
    val name: String,
    val location: String,
    val pricePerNight: Int,
    val rating: Float,
    val amenities: List<String>,
    val imageUrl: String,
    val isFavorite: Boolean = false
)

data class CategoryUiModel(
    val id: String,
    val name: String,
    val icon: String
)