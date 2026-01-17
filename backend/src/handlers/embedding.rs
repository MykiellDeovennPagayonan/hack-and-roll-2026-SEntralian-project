use axum::{extract::Json, http::StatusCode};
use serde::{Deserialize, Serialize};

use crate::models::{SimilarityResult, TextEmbedding};
use crate::service::{similarity, OllamaService};

#[derive(Debug, Deserialize)]
pub struct EmbedRequest {
    pub text: String,
}

#[derive(Debug, Deserialize)]
pub struct EmbedBatchRequest {
    pub texts: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct SimilaritySearchRequest {
    pub query: String,
    pub corpus: Vec<String>,
    pub top_k: Option<usize>,
}

#[derive(Debug, Serialize)]
pub struct EmbedResponse {
    pub success: bool,
    pub embedding: Option<Vec<f32>>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct EmbedBatchResponse {
    pub success: bool,
    pub embeddings: Option<Vec<Vec<f32>>>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SimilaritySearchResponse {
    pub success: bool,
    pub results: Option<Vec<SimilarityResult>>,
    pub error: Option<String>,
}

/// Embed a single text
pub async fn embed_text(
    Json(payload): Json<EmbedRequest>,
) -> Result<Json<EmbedResponse>, (StatusCode, Json<EmbedResponse>)> {
    if payload.text.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(EmbedResponse {
                success: false,
                embedding: None,
                error: Some("Text cannot be empty".into()),
            }),
        ));
    }

    let ollama = OllamaService::new();

    match ollama.embed_text(&payload.text).await {
        Ok(embedding) => Ok(Json(EmbedResponse {
            success: true,
            embedding: Some(embedding),
            error: None,
        })),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(EmbedResponse {
                success: false,
                embedding: None,
                error: Some(e),
            }),
        )),
    }
}

/// Embed multiple texts
pub async fn embed_batch(
    Json(payload): Json<EmbedBatchRequest>,
) -> Result<Json<EmbedBatchResponse>, (StatusCode, Json<EmbedBatchResponse>)> {
    if payload.texts.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(EmbedBatchResponse {
                success: false,
                embeddings: None,
                error: Some("Texts array cannot be empty".into()),
            }),
        ));
    }

    let ollama = OllamaService::new();

    match ollama.embed_texts(&payload.texts).await {
        Ok(embeddings) => Ok(Json(EmbedBatchResponse {
            success: true,
            embeddings: Some(embeddings),
            error: None,
        })),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(EmbedBatchResponse {
                success: false,
                embeddings: None,
                error: Some(e),
            }),
        )),
    }
}

/// Search for similar texts in a corpus
pub async fn similarity_search(
    Json(payload): Json<SimilaritySearchRequest>,
) -> Result<Json<SimilaritySearchResponse>, (StatusCode, Json<SimilaritySearchResponse>)> {
    if payload.query.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(SimilaritySearchResponse {
                success: false,
                results: None,
                error: Some("Query cannot be empty".into()),
            }),
        ));
    }

    if payload.corpus.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(SimilaritySearchResponse {
                success: false,
                results: None,
                error: Some("Corpus cannot be empty".into()),
            }),
        ));
    }

    let ollama = OllamaService::new();
    let top_k = payload.top_k.unwrap_or(5);

    // Embed query and corpus
    let query_embedding = match ollama.embed_text(&payload.query).await {
        Ok(e) => e,
        Err(e) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(SimilaritySearchResponse {
                    success: false,
                    results: None,
                    error: Some(format!("Failed to embed query: {}", e)),
                }),
            ))
        }
    };

    let corpus_embeddings = match ollama.create_text_embeddings(&payload.corpus).await {
        Ok(e) => e,
        Err(e) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(SimilaritySearchResponse {
                    success: false,
                    results: None,
                    error: Some(format!("Failed to embed corpus: {}", e)),
                }),
            ))
        }
    };

    let results = similarity::find_similar(&query_embedding, &corpus_embeddings, top_k);

    Ok(Json(SimilaritySearchResponse {
        success: true,
        results: Some(results),
        error: None,
    }))
}
