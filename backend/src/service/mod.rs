mod ollama;
pub mod similarity;
pub mod local_embeddings;

pub use ollama::OllamaService;
pub use local_embeddings::{LocalEmbeddingService, init_embeddings};
