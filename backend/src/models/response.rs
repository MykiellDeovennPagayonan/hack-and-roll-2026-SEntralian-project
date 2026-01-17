use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct PoemResponse {
    pub success: bool,
    pub poem: Option<String>,
    pub error: Option<String>,
}
