mod handlers;
mod models;
mod service;

use axum::{
    routing::{get, post},
    Router,
};
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/", get(|| async { "Poem Generator API" }))
        .route("/health", get(handlers::health::check))
        .route("/poem/text", post(handlers::poem::generate_from_text))
        .route("/poem/image", post(handlers::poem::generate_from_image))
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let addr = "127.0.0.1:8000";
    tracing::info!("Server running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
