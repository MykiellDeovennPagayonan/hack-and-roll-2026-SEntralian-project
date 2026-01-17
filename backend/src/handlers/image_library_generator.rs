use axum::{extract::Json, http::StatusCode};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

use crate::service::OllamaService;
use crate::lib::image_library::get_word_library;

#[derive(Debug, Deserialize)]
pub struct GenerateLibraryRequest {
    pub start_index: Option<usize>, // 0-based index
    pub end_index: Option<usize>,   // inclusive, 0-based index
}

#[derive(Debug, Serialize)]
pub struct GenerateLibraryResponse {
    pub success: bool,
    pub csv_path: Option<String>,
    pub total_images_in_folder: Option<usize>,
    pub processed_images: Option<usize>,
    pub skipped_images: Option<usize>,
    pub range: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize)]
struct ImageLibraryEntry {
    image_url: String,
    word1: String,
    word2: String,
    word3: String,
}

pub async fn generate_library(
    Json(payload): Json<GenerateLibraryRequest>,
) -> Result<Json<GenerateLibraryResponse>, (StatusCode, Json<GenerateLibraryResponse>)> {
    let images_dir = "images";
    let csv_output = "image_library.csv";

    // Check if images directory exists
    if !Path::new(images_dir).exists() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(GenerateLibraryResponse {
                success: false,
                csv_path: None,
                total_images_in_folder: None,
                processed_images: None,
                skipped_images: None,
                range: None,
                error: Some(format!("Images directory '{}' does not exist", images_dir)),
            }),
        ));
    }

    // Read all image files from the directory
    let entries = match fs::read_dir(images_dir) {
        Ok(entries) => entries,
        Err(e) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(GenerateLibraryResponse {
                    success: false,
                    csv_path: None,
                    total_images_in_folder: None,
                    processed_images: None,
                    skipped_images: None,
                    range: None,
                    error: Some(format!("Failed to read images directory: {}", e)),
                }),
            ))
        }
    };

    // Collect all valid image filenames
    let mut image_files: Vec<String> = Vec::new();
    for entry in entries {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };

        let path = entry.path();
        
        // Only process image files
        if !path.is_file() {
            continue;
        }

        let extension = path.extension().and_then(|s| s.to_str()).unwrap_or("");
        if !matches!(extension.to_lowercase().as_str(), "jpg" | "jpeg" | "png" | "gif" | "webp") {
            continue;
        }

        if let Some(filename) = path.file_name().and_then(|s| s.to_str()) {
            image_files.push(filename.to_string());
        }
    }

    if image_files.is_empty() {
        return Err((
            StatusCode::NOT_FOUND,
            Json(GenerateLibraryResponse {
                success: false,
                csv_path: None,
                total_images_in_folder: Some(0),
                processed_images: None,
                skipped_images: None,
                range: None,
                error: Some("No valid images found in the images directory".into()),
            }),
        ));
    }

    // Sort alphabetically
    image_files.sort();

    let total_images = image_files.len();
    
    // Determine range
    let start_idx = payload.start_index.unwrap_or(0);
    let end_idx = payload.end_index.unwrap_or(total_images.saturating_sub(1));

    // Validate range
    if start_idx >= total_images {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(GenerateLibraryResponse {
                success: false,
                csv_path: None,
                total_images_in_folder: Some(total_images),
                processed_images: None,
                skipped_images: None,
                range: None,
                error: Some(format!(
                    "start_index {} is out of range (total images: {})",
                    start_idx, total_images
                )),
            }),
        ));
    }

    if end_idx >= total_images {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(GenerateLibraryResponse {
                success: false,
                csv_path: None,
                total_images_in_folder: Some(total_images),
                processed_images: None,
                skipped_images: None,
                range: None,
                error: Some(format!(
                    "end_index {} is out of range (total images: {})",
                    end_idx, total_images
                )),
            }),
        ));
    }

    if start_idx > end_idx {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(GenerateLibraryResponse {
                success: false,
                csv_path: None,
                total_images_in_folder: Some(total_images),
                processed_images: None,
                skipped_images: None,
                range: None,
                error: Some(format!(
                    "start_index {} cannot be greater than end_index {}",
                    start_idx, end_idx
                )),
            }),
        ));
    }

    let range_str = format!("{}-{} ({}to {})", 
        start_idx, end_idx,
        image_files[start_idx], image_files[end_idx]
    );

    tracing::info!("Processing images {} out of {} total", range_str, total_images);
    tracing::info!("Image list (alphabetical): {:?}", image_files);

    let ollama = OllamaService::new();
    let word_library = get_word_library();
    let mut library_entries = Vec::new();
    let mut skipped_count = 0;

    // Process only the selected range
    for (idx, filename) in image_files.iter().enumerate() {
        if idx < start_idx || idx > end_idx {
            continue;
        }

        tracing::info!("[{}/{}] Processing image: {}", idx + 1, total_images, filename);

        let path = Path::new(images_dir).join(filename);

        // Read and encode image to base64
        let image_data = match fs::read(&path) {
            Ok(data) => data,
            Err(e) => {
                tracing::error!("Failed to read image {}: {}", filename, e);
                skipped_count += 1;
                continue;
            }
        };

        let image_base64 = base64::encode(&image_data);

        // Extract 3 words from the image
        let words = match ollama.extract_words_from_image(&image_base64, &word_library).await {
            Ok(words) => words,
            Err(e) => {
                tracing::error!("Failed to extract words from {}: {}", filename, e);
                skipped_count += 1;
                continue;
            }
        };

        if words.len() != 3 {
            tracing::error!("Expected 3 words for {} but got {}", filename, words.len());
            skipped_count += 1;
            continue;
        }

        let image_url = format!("/images/{}", filename);
        
        library_entries.push(ImageLibraryEntry {
            image_url,
            word1: words[0].clone(),
            word2: words[1].clone(),
            word3: words[2].clone(),
        });

        tracing::info!("✓ Processed {}: {:?}", filename, words);
    }

    if library_entries.is_empty() {
        return Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(GenerateLibraryResponse {
                success: false,
                csv_path: None,
                total_images_in_folder: Some(total_images),
                processed_images: Some(0),
                skipped_images: Some(skipped_count),
                range: Some(range_str),
                error: Some("No images were successfully processed in the given range".into()),
            }),
        ));
    }

    // Write to CSV
    let mut wtr = match csv::Writer::from_path(csv_output) {
        Ok(w) => w,
        Err(e) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(GenerateLibraryResponse {
                    success: false,
                    csv_path: None,
                    total_images_in_folder: Some(total_images),
                    processed_images: Some(library_entries.len()),
                    skipped_images: Some(skipped_count),
                    range: Some(range_str),
                    error: Some(format!("Failed to create CSV file: {}", e)),
                }),
            ))
        }
    };

    for entry in &library_entries {
        if let Err(e) = wtr.serialize(entry) {
            tracing::error!("Failed to write entry to CSV: {}", e);
        }
    }

    if let Err(e) = wtr.flush() {
        return Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(GenerateLibraryResponse {
                success: false,
                csv_path: None,
                total_images_in_folder: Some(total_images),
                processed_images: Some(library_entries.len()),
                skipped_images: Some(skipped_count),
                range: Some(range_str),
                error: Some(format!("Failed to flush CSV file: {}", e)),
            }),
        ));
    }

    tracing::info!("✓ Generated library with {} images (skipped: {})", library_entries.len(), skipped_count);

    Ok(Json(GenerateLibraryResponse {
        success: true,
        csv_path: Some(csv_output.to_string()),
        total_images_in_folder: Some(total_images),
        processed_images: Some(library_entries.len()),
        skipped_images: Some(skipped_count),
        range: Some(range_str),
        error: None,
    }))
}