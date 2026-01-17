use axum::{extract::Json, http::StatusCode};

use crate::models::{ImageMatchRequest, ImageMatchResponse};
use crate::service::LocalEmbeddingService;

pub async fn match_image(
    Json(payload): Json<ImageMatchRequest>,
) -> Result<Json<ImageMatchResponse>, (StatusCode, Json<ImageMatchResponse>)> {
    if payload.words.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ImageMatchResponse {
                success: false,
                matched_image_url: None,
                extracted_words: None,
                similarity_score: None,
                error: Some("Words cannot be empty".into()),
            }),
        ));
    }

    // Use local embeddings to find best match (zero network calls!)
    let local_embeddings = LocalEmbeddingService::new();

    match local_embeddings.find_best_match(&payload.words) {
        Ok((url, score)) => Ok(Json(ImageMatchResponse {
            success: true,
            matched_image_url: Some(url),
            extracted_words: Some(payload.words),
            similarity_score: Some(score),
            error: None,
        })),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ImageMatchResponse {
                success: false,
                matched_image_url: None,
                extracted_words: Some(payload.words),
                similarity_score: None,
                error: Some(format!("Failed to match image: {}", e)),
            }),
        )),
    }
}