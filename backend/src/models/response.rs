use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct PoemResponse {
    pub success: bool,
    pub poem: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct RoastResponse {
    pub success: bool,
    pub roast: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ImageMatchResponse {
    pub success: bool,
    pub matched_image_url: Option<String>,
    pub extracted_words: Option<Vec<String>>,
    pub similarity_score: Option<f32>,
    pub error: Option<String>,
}