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
