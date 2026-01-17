use reqwest::Client;

use crate::models::{
    OllamaChatMessage, OllamaChatRequest, OllamaChatResponse, OllamaGenerateRequest,
    OllamaGenerateResponse, OllamaOptions,
};

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
}

impl Default for OllamaService {
    fn default() -> Self {
        Self::new()
    }
}
