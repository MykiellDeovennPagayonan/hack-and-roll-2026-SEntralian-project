use reqwest::Client;

use crate::models::{
    EmbeddingInput, OllamaChatMessage, OllamaChatRequest, OllamaChatResponse,
    OllamaEmbeddingRequest, OllamaEmbeddingResponse, OllamaGenerateRequest,
    OllamaGenerateResponse, OllamaOptions, TextEmbedding,
};

const EMBEDDING_MODEL: &str = "nomic-embed-text";

pub struct OllamaService {
    client: Client,
    base_url: String,
}

impl OllamaService {
    pub fn new() -> Self {
        let base_url =
            std::env::var("OLLAMA_BASE_URL").unwrap_or_else(|_| "http://localhost:11434".into());
        Self {
            client: Client::new(),
            base_url,
        }
    }

    pub async fn generate_poem_from_text(&self, prompt: &str) -> Result<String, String> {
        let full_prompt = format!(
            "Write a creative, evocative poem based on the following theme or idea. \
            Output ONLY the poem, no explanations or titles.\n\nTheme: {}",
            prompt
        );

        let request = OllamaGenerateRequest {
            model: "gemma3:4b".into(),
            prompt: full_prompt,
            stream: false,
            options: OllamaOptions { temperature: 0.7 },
        };

        let response = self
            .client
            .post(format!("{}/api/generate", self.base_url))
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Failed to connect to Ollama: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(format!("Ollama error ({}): {}", status, text));
        }

        let result: OllamaGenerateResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

        Ok(result.response)
    }

    pub async fn generate_poem_from_image(
        &self,
        image_base64: &str,
        custom_prompt: Option<&str>,
    ) -> Result<String, String> {
        let prompt = custom_prompt.unwrap_or(
            "Look at this image carefully. Write a creative, evocative poem inspired by what you see. \
            Output ONLY the poem, no explanations or titles."
        );

        let message = OllamaChatMessage {
            role: "user".into(),
            content: prompt.into(),
            images: Some(vec![image_base64.into()]),
        };

        let request = OllamaChatRequest {
            model: "gemma3:4b".into(),
            messages: vec![message],
            stream: false,
            options: OllamaOptions { temperature: 0.7 },
        };

        let response = self
            .client
            .post(format!("{}/api/chat", self.base_url))
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Failed to connect to Ollama: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(format!("Ollama error ({}): {}", status, text));
        }

        let result: OllamaChatResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

        Ok(result.message.content)
    }

    pub async fn generate_roast_from_image(&self, image_base64: &str) -> Result<String, String> {
        let prompt = "Look at this image carefully. Write a short, funny roast or comedic insult about what you see. \
            Be playful and humorous like a comedy roast - gentle teasing, not mean-spirited. \
            Keep it light-hearted and fun. Output ONLY the roast, no explanations or commentary. \
            Make it punchy and memorable, 2-4 sentences max.";

        let message = OllamaChatMessage {
            role: "user".into(),
            content: prompt.into(),
            images: Some(vec![image_base64.into()]),
        };

        let request = OllamaChatRequest {
            model: "gemma3:4b".into(),
            messages: vec![message],
            stream: false,
            options: OllamaOptions { temperature: 0.9 },
        };

        let response = self
            .client
            .post(format!("{}/api/chat", self.base_url))
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Failed to connect to Ollama: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(format!("Ollama error ({}): {}", status, text));
        }

        let result: OllamaChatResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

        Ok(result.message.content)
    }

    // ========================================================================
    // Embeddings
    // ========================================================================

    /// Generate embedding for a single text
    pub async fn embed_text(&self, text: &str) -> Result<Vec<f32>, String> {
        let embeddings = self.embed_texts(&[text.to_string()]).await?;
        embeddings
            .into_iter()
            .next()
            .ok_or_else(|| "No embedding returned".to_string())
    }

    /// Generate embeddings for multiple texts
    pub async fn embed_texts(&self, texts: &[String]) -> Result<Vec<Vec<f32>>, String> {
        let request = OllamaEmbeddingRequest {
            model: EMBEDDING_MODEL.into(),
            input: EmbeddingInput::Multiple(texts.to_vec()),
        };

        let response = self
            .client
            .post(format!("{}/api/embed", self.base_url))
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Failed to connect to Ollama: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(format!("Ollama embedding error ({}): {}", status, text));
        }

        let result: OllamaEmbeddingResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse embedding response: {}", e))?;

        Ok(result.embeddings)
    }

    /// Create a TextEmbedding from text
    pub async fn create_text_embedding(&self, text: &str) -> Result<TextEmbedding, String> {
        let embedding = self.embed_text(text).await?;
        Ok(TextEmbedding {
            text: text.to_string(),
            embedding,
        })
    }

    /// Create TextEmbeddings from multiple texts
    pub async fn create_text_embeddings(&self, texts: &[String]) -> Result<Vec<TextEmbedding>, String> {
        let embeddings = self.embed_texts(texts).await?;

        Ok(texts
            .iter()
            .zip(embeddings)
            .map(|(text, embedding)| TextEmbedding {
                text: text.clone(),
                embedding,
            })
            .collect())
    }
}

impl Default for OllamaService {
    fn default() -> Self {
        Self::new()
    }
}
