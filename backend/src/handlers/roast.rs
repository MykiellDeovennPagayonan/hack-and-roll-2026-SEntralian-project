use axum::{extract::Json, http::StatusCode};
use base64::{engine::general_purpose, Engine};

use crate::models::{ImageRoastRequest, RoastResponse};
use crate::service::OllamaService;

pub async fn generate_from_image(
    Json(payload): Json<ImageRoastRequest>,
) -> Result<Json<RoastResponse>, (StatusCode, Json<RoastResponse>)> {
    if payload.image_base64.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(RoastResponse {
                success: false,
                roast: None,
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
            Json(RoastResponse {
                success: false,
                roast: None,
                error: Some("Invalid base64 image data".into()),
            }),
        ));
    }

    let ollama = OllamaService::new();

    match ollama
        .generate_roast_from_image(&payload.image_base64)
        .await
    {
        Ok(roast) => Ok(Json(RoastResponse {
            success: true,
            roast: Some(roast),
            error: None,
        })),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(RoastResponse {
                success: false,
                roast: None,
                error: Some(e),
            }),
        )),
    }
}
