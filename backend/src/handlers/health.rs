use axum::{response::IntoResponse, Json};

pub async fn check() -> impl IntoResponse {
    Json(serde_json::json!({"status": "ok"}))
}
