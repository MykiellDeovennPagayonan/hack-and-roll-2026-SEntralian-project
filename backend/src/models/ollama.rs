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
