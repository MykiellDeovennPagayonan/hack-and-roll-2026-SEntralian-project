use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageEntry {
    pub image_url: String,
    pub words: [String; 3],
}

pub fn get_image_library() -> Vec<ImageEntry> {
    vec![
        ImageEntry {
            image_url: "/images/biggest-eater-hamster.jpg".to_string(),
            words: ["smug".to_string(), "hungry".to_string(), "comical".to_string()],
        },
        ImageEntry {
            image_url: "/images/birthday-hamster.jpg".to_string(),
            words: ["cake".to_string(), "confused".to_string(), "whimsical".to_string()],
        },
        ImageEntry {
            image_url: "/images/bleh-hamster.jpg".to_string(),
            words: ["smug".to_string(), "playful".to_string(), "cartoon".to_string()],
        },
        ImageEntry {
            image_url: "/images/bonita-hamster.png".to_string(),
            words: ["cute".to_string(), "relaxed".to_string(), "whimsical".to_string()],
        },
        ImageEntry {
            image_url: "/images/burger-hamster.jpg".to_string(),
            words: ["hungry".to_string(), "confused".to_string(), "spooky".to_string()],
        },
        ImageEntry {
            image_url: "/images/chad-hamster.jpg".to_string(),
            words: ["smug".to_string(), "confused".to_string(), "minimalist".to_string()],
        },
        ImageEntry {
            image_url: "/images/crying-hamster.jpg".to_string(),
            words: ["confused".to_string(), "frustrated".to_string(), "comical".to_string()],
        },
        ImageEntry {
            image_url: "/images/detective-hamster.jpg".to_string(),
            words: ["detective".to_string(), "contemplative".to_string(), "thinking".to_string()],
        },
        ImageEntry {
            image_url: "/images/devil-hamster.jpg".to_string(),
            words: ["smug".to_string(), "evil".to_string(), "comical".to_string()],
        },
        ImageEntry {
            image_url: "/images/emo-hamster.jpg".to_string(),
            words: ["emotional".to_string(), "anxious".to_string(), "sketchy".to_string()],
        },
        ImageEntry {
            image_url: "/images/femboy-lover-hamster.jpg".to_string(),
            words: ["smug".to_string(), "confident".to_string(), "playful".to_string()],
        },
        ImageEntry {
            image_url: "/images/flower-hamster.jpg".to_string(),
            words: ["floral".to_string(), "serene".to_string(), "whimsical".to_string()],
        },
        ImageEntry {
            image_url: "/images/free-hamster.jpg".to_string(),
            words: ["freedom".to_string(), "curious".to_string(), "playful".to_string()],
        },
        ImageEntry {
            image_url: "/images/french-hamster.jpg".to_string(),
            words: ["baker".to_string(), "smug".to_string(), "elegant".to_string()],
        },
        ImageEntry {
            image_url: "/images/furious-hamster.jpg".to_string(),
            words: ["smug".to_string(), "angry".to_string(), "comical".to_string()],
        },
        ImageEntry {
            image_url: "/images/homeless-hamster.jpg".to_string(),
            words: ["homeless".to_string(), "melancholic".to_string(), "surreal".to_string()],
        },
        ImageEntry {
            image_url: "/images/intimidating-hamster.jpg".to_string(),
            words: ["smug".to_string(), "scary".to_string(), "skeptical".to_string()],
        },
        ImageEntry {
            image_url: "/images/lolipop-hamster.jpg".to_string(),
            words: ["candy".to_string(), "playful".to_string(), "whimsical".to_string()],
        },
        ImageEntry {
            image_url: "/images/make-up-hamster.jpg".to_string(),
            words: ["make up".to_string(), "pretty".to_string(), "curious".to_string()],
        },
        ImageEntry {
            image_url: "/images/nerd-hamster.jpg".to_string(),
            words: ["smug".to_string(), "confused".to_string(), "detective".to_string()],
        },
        ImageEntry {
            image_url: "/images/pig-hamster.jpg".to_string(),
            words: ["pig".to_string(), "costume".to_string(), "comical".to_string()],
        },
        ImageEntry {
            image_url: "/images/poor-hamster.jpg".to_string(),
            words: ["poor".to_string(), "contemplative".to_string(), "no money".to_string()],
        },
        ImageEntry {
            image_url: "/images/rag-hamster.jpg".to_string(),
            words: ["smug".to_string(), "confused".to_string(), "comical".to_string()],
        },
        ImageEntry {
            image_url: "/images/schemy-hamster.jpg".to_string(),
            words: ["smug".to_string(), "confused".to_string(), "detective".to_string()],
        },
        ImageEntry {
            image_url: "/images/sick-hamster.jpg".to_string(),
            words: ["sick".to_string(), "dying".to_string(), "whimsical".to_string()],
        },
        ImageEntry {
            image_url: "/images/thirsty-hamster.jpg".to_string(),
            words: ["confused".to_string(), "thirsty".to_string(), "whimsical".to_string()],
        },
        ImageEntry {
            image_url: "/images/thumbs-down-hamster.jpg".to_string(),
            words: ["thumbs down".to_string(), "skeptical".to_string(), "disapprove".to_string()],
        },
        ImageEntry {
            image_url: "/images/thumbs-up-hamster.jpg".to_string(),
            words: ["thumbs up".to_string(), "smile".to_string(), "approve".to_string()],
        },
        ImageEntry {
            image_url: "/images/watermelon-hamster.jpg".to_string(),
            words: ["confused".to_string(), "whimsical".to_string(), "watermelon".to_string()],
        },
        ImageEntry {
            image_url: "/images/wizard-hamster.jpg".to_string(),
            words: ["wizard".to_string(), "neutral".to_string(), "whimsical".to_string()],
        },
    ]
}

pub fn get_word_library() -> Vec<String> {
    vec![
        // Emotions
        "happy", "sad", "angry", "tired", "scared", "anxious", "evil", "investigate",
        "smug", "confused", "content", "crying", "disappointed", "cheerful", "hungry",
        
        // Professions/Roles
        "detective", "cowboy", "pirate", "chef", "doctor", "business",
        "gamer", "artist",
        
        // States/Situations
        "fancy", "rich", "elegant", "poor", "homeless", "traveling",
        "eating", "sleeping", "dancing",
        
        // Styles/Appearance
        "stylish", "muscular", "cute", "small",
        "strong", "colorful", "glowing", "scary",
        
        // Seasonal/Themes
        "festive", "spooky", "romantic", "celebratory", "summery", "wintery",
        
        // Characteristics
        "polite", "rude", "gentle", "aggressive", "calm", "energetic",
        
        // Items/Props
        "hat", "glasses", "food", "drink", "book", "maginifying glass",
        "phone", "sign", "weapon",
    ]
    .iter()
    .map(|s| s.to_string())
    .collect()
}