use axum::{extract::Json, http::StatusCode};
use base64::{engine::general_purpose, Engine};

use crate::models::{ImagePoemRequest, PoemResponse, TextPoemRequest};
use crate::service::OllamaService;

pub async fn generate_from_text(
    Json(payload): Json<TextPoemRequest>,
) -> Result<Json<PoemResponse>, (StatusCode, Json<PoemResponse>)> {
    if payload.prompt.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(PoemResponse {
                success: false,
                poem: None,
                error: Some("Prompt cannot be empty".into()),
            }),
        ));
    }

    let ollama = OllamaService::new();

    match ollama.generate_poem_from_text(&payload.prompt).await {
        Ok(poem) => Ok(Json(PoemResponse {
            success: true,
            poem: Some(poem),
            error: None,
        })),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(PoemResponse {
                success: false,
                poem: None,
                error: Some(e),
            }),
        )),
    }
}

pub async fn generate_from_image(
    Json(payload): Json<ImagePoemRequest>,
) -> Result<Json<PoemResponse>, (StatusCode, Json<PoemResponse>)> {
    if payload.image_base64.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(PoemResponse {
                success: false,
                poem: None,
                error: Some("Image data cannot be empty".into()),
            }),
        ));
    }

    if general_purpose::STANDARD
        .decode(&payload.image_base64)
        .is_err()
    {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(PoemResponse {
                success: false,
                poem: None,
                error: Some("Invalid base64 image data".into()),
            }),
        ));
    }

    let ollama = OllamaService::new();

    match ollama
        .generate_poem_from_image(&payload.image_base64, payload.prompt.as_deref())
        .await
    {
        Ok(poem) => Ok(Json(PoemResponse {
            success: true,
            poem: Some(poem),
            error: None,
        })),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(PoemResponse {
                success: false,
                poem: None,
                error: Some(e),
            }),
        )),
    }
}
