use fastembed::{EmbeddingModel, InitOptions, TextEmbedding};
use once_cell::sync::Lazy;
use std::sync::Mutex;

use crate::lib::image_library::get_image_library;
use crate::service::similarity::{average_embeddings, cosine_similarity};

pub struct ImageEntryWithEmbedding {
    pub image_url: String,
    pub words: [String; 3],
    pub embedding: Vec<f32>,
}

struct EmbeddingCache {
    model: TextEmbedding,
    library: Vec<ImageEntryWithEmbedding>,
}

static EMBEDDING_CACHE: Lazy<Mutex<EmbeddingCache>> = Lazy::new(|| {
    tracing::info!("Initializing local embedding model...");

    let mut options = InitOptions::default();
    options.model_name = EmbeddingModel::AllMiniLML6V2;
    options.show_download_progress = true;

    let model = TextEmbedding::try_new(options)
        .expect("Failed to initialize embedding model");
    tracing::info!("Pre-computing image library embeddings...");

    let image_library = get_image_library();
    let mut library_with_embeddings = Vec::with_capacity(image_library.len());

    for entry in image_library {
        let words_vec: Vec<String> = entry.words.to_vec();

        match model.embed(words_vec.clone(), None) {
            Ok(embeddings) => {
                if let Some(avg) = average_embeddings(&embeddings) {
                    library_with_embeddings.push(ImageEntryWithEmbedding {
                        image_url: entry.image_url,
                        words: entry.words,
                        embedding: avg,
                    });
                }
            }
            Err(e) => {
                tracing::warn!("Failed to embed words for {}: {}", entry.image_url, e);
            }
        }
    }

    tracing::info!(
        "Pre-computed embeddings for {} images",
        library_with_embeddings.len()
    );

    Mutex::new(EmbeddingCache {
        model,
        library: library_with_embeddings,
    })
});

pub struct LocalEmbeddingService;

impl LocalEmbeddingService {
    pub fn new() -> Self {
        Self
    }

    /// Embed multiple texts using the local model
    pub fn embed_texts(&self, texts: &[String]) -> Result<Vec<Vec<f32>>, String> {
        let cache = EMBEDDING_CACHE
            .lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;

        cache
            .model
            .embed(texts.to_vec(), None)
            .map_err(|e| format!("Embedding failed: {}", e))
    }

    /// Find the best matching image from the pre-computed library
    pub fn find_best_match(&self, query_words: &[String]) -> Result<(String, f32), String> {
        let cache = EMBEDDING_CACHE
            .lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;

        // Embed the query words
        let query_embeddings = cache
            .model
            .embed(query_words.to_vec(), None)
            .map_err(|e| format!("Failed to embed query: {}", e))?;

        let query_avg = average_embeddings(&query_embeddings)
            .ok_or_else(|| "Failed to calculate average embedding".to_string())?;

        // Find best match from pre-computed library
        let mut best_match: Option<(String, f32)> = None;

        for entry in &cache.library {
            let similarity = cosine_similarity(&query_avg, &entry.embedding);

            match &best_match {
                None => best_match = Some((entry.image_url.clone(), similarity)),
                Some((_, best_score)) => {
                    if similarity > *best_score {
                        best_match = Some((entry.image_url.clone(), similarity));
                    }
                }
            }
        }

        best_match.ok_or_else(|| "No matching images found".to_string())
    }
}

impl Default for LocalEmbeddingService {
    fn default() -> Self {
        Self::new()
    }
}

/// Initialize the embedding cache (call this at startup to pre-load)
pub fn init_embeddings() {
    let _ = &*EMBEDDING_CACHE;
}
