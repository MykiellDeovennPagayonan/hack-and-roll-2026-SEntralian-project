use crate::models::{SimilarityResult, TextEmbedding};

/// Calculate cosine similarity between two vectors
/// Returns a value between -1 and 1, where 1 means identical
pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() || a.is_empty() {
        return 0.0;
    }

    let dot_product: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let magnitude_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let magnitude_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();

    if magnitude_a == 0.0 || magnitude_b == 0.0 {
        return 0.0;
    }

    dot_product / (magnitude_a * magnitude_b)
}

/// Calculate Euclidean distance between two vectors
/// Lower values mean more similar
pub fn euclidean_distance(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() {
        return f32::MAX;
    }

    a.iter()
        .zip(b.iter())
        .map(|(x, y)| (x - y).powi(2))
        .sum::<f32>()
        .sqrt()
}

/// Find the most similar texts to a query embedding
/// Returns results sorted by similarity (highest first)
pub fn find_similar(
    query_embedding: &[f32],
    candidates: &[TextEmbedding],
    top_k: usize,
) -> Vec<SimilarityResult> {
    let mut results: Vec<SimilarityResult> = candidates
        .iter()
        .map(|candidate| SimilarityResult {
            text: candidate.text.clone(),
            score: cosine_similarity(query_embedding, &candidate.embedding),
        })
        .collect();

    // Sort by score descending
    results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));

    results.into_iter().take(top_k).collect()
}

/// Find similar texts above a similarity threshold
pub fn find_similar_above_threshold(
    query_embedding: &[f32],
    candidates: &[TextEmbedding],
    threshold: f32,
) -> Vec<SimilarityResult> {
    let mut results: Vec<SimilarityResult> = candidates
        .iter()
        .map(|candidate| SimilarityResult {
            text: candidate.text.clone(),
            score: cosine_similarity(query_embedding, &candidate.embedding),
        })
        .filter(|result| result.score >= threshold)
        .collect();

    results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));

    results
}

/// Normalize a vector to unit length
pub fn normalize(v: &[f32]) -> Vec<f32> {
    let magnitude: f32 = v.iter().map(|x| x * x).sum::<f32>().sqrt();
    if magnitude == 0.0 {
        return v.to_vec();
    }
    v.iter().map(|x| x / magnitude).collect()
}

/// Calculate the average of multiple embeddings
pub fn average_embeddings(embeddings: &[Vec<f32>]) -> Option<Vec<f32>> {
    if embeddings.is_empty() {
        return None;
    }

    let dim = embeddings[0].len();
    let count = embeddings.len() as f32;

    let mut avg = vec![0.0; dim];
    for embedding in embeddings {
        for (i, val) in embedding.iter().enumerate() {
            avg[i] += val / count;
        }
    }

    Some(avg)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cosine_similarity_identical() {
        let a = vec![1.0, 2.0, 3.0];
        let b = vec![1.0, 2.0, 3.0];
        let sim = cosine_similarity(&a, &b);
        assert!((sim - 1.0).abs() < 1e-6);
    }

    #[test]
    fn test_cosine_similarity_orthogonal() {
        let a = vec![1.0, 0.0];
        let b = vec![0.0, 1.0];
        let sim = cosine_similarity(&a, &b);
        assert!(sim.abs() < 1e-6);
    }

    #[test]
    fn test_cosine_similarity_opposite() {
        let a = vec![1.0, 2.0, 3.0];
        let b = vec![-1.0, -2.0, -3.0];
        let sim = cosine_similarity(&a, &b);
        assert!((sim + 1.0).abs() < 1e-6);
    }

    #[test]
    fn test_normalize() {
        let v = vec![3.0, 4.0];
        let n = normalize(&v);
        assert!((n[0] - 0.6).abs() < 1e-6);
        assert!((n[1] - 0.8).abs() < 1e-6);
    }
}
