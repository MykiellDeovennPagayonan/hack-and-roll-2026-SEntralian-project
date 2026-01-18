mod handlers;
mod lib;
mod models;
mod service;

use axum::{
    routing::{get, post},
    Router,
};
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tower_http::services::ServeDir;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .init();

    // Initialize local embedding model and pre-compute library embeddings
    tracing::info!("Initializing local embeddings...");
    service::init_embeddings();
    tracing::info!("Local embeddings ready!");

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/", get(|| async { "Hack and Roll Snap API" }))
        .route("/health", get(handlers::health::check))
        // Poem routes
        .route("/poem/text", post(handlers::poem::generate_from_text))
        .route("/poem/image", post(handlers::poem::generate_from_image))
        // Roast routes
        .route("/roast/image", post(handlers::roast::generate_from_image))
        // Embedding routes
        .route("/embed", post(handlers::embedding::embed_text))
        .route("/embed/batch", post(handlers::embedding::embed_batch))
        .route(
            "/embed/search",
            post(handlers::embedding::similarity_search),
        )
        // Image matching route
        .route("/image/match", post(handlers::image_match::match_image))
        // Image library generator
        .route(
            "/admin/generate-library",
            post(handlers::image_library_generator::generate_library),
        )
        // Serve static images
        .nest_service("/images", ServeDir::new("images"))
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let addr = "0.0.0.0:8000";
    tracing::info!("Server running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}