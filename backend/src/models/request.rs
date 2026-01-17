use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct TextPoemRequest {
    pub prompt: String,
}

#[derive(Debug, Deserialize)]
pub struct ImagePoemRequest {
    pub image_base64: String,
    pub prompt: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ImageRoastRequest {
    pub image_base64: String,
}

#[derive(Debug, Deserialize)]
pub struct ImageMatchRequest {
    /// Keywords/moods to match against the image library
    pub words: Vec<String>,
}