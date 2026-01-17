use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct OllamaGenerateRequest {
    pub model: String,
    pub prompt: String,
    pub stream: bool,
    pub options: OllamaOptions,
}

#[derive(Debug, Serialize)]
pub struct OllamaChatRequest {
    pub model: String,
    pub messages: Vec<OllamaChatMessage>,
    pub stream: bool,
    pub options: OllamaOptions,
}

#[derive(Debug, Serialize)]
pub struct OllamaChatMessage {
    pub role: String,
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub images: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
pub struct OllamaOptions {
    pub temperature: f32,
}

#[derive(Debug, Deserialize)]
pub struct OllamaGenerateResponse {
    pub response: String,
}

#[derive(Debug, Deserialize)]
pub struct OllamaChatResponse {
    pub message: OllamaChatMessageResponse,
}

#[derive(Debug, Deserialize)]
pub struct OllamaChatMessageResponse {
    pub content: String,
}

// ============================================================================
// Embeddings
// ============================================================================

#[derive(Debug, Serialize)]
pub struct OllamaEmbeddingRequest {
    pub model: String,
    pub input: EmbeddingInput,
}

#[derive(Debug, Serialize)]
#[serde(untagged)]
pub enum EmbeddingInput {
    Single(String),
    Multiple(Vec<String>),
}

#[derive(Debug, Deserialize)]
pub struct OllamaEmbeddingResponse {
    pub embeddings: Vec<Vec<f32>>,
}

/// A text with its computed embedding vector
#[derive(Debug, Clone)]
pub struct TextEmbedding {
    pub text: String,
    pub embedding: Vec<f32>,
}

/// Result of a similarity search
#[derive(Debug, Clone, Serialize)]
pub struct SimilarityResult {
    pub text: String,
    pub score: f32,
}
