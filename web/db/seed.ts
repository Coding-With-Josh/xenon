import "dotenv/config";
import { db } from "./index";
import { curriculum } from "./schema";

// Merged curriculum from both sources: Physics, Chemistry, Biology (richer subtopics) + English Language
const curriculumSeed = [
  // Physics
  { subject: "Physics" as const, topic: "Introduction to Physics", subtopics: ["Nature of Physics", "Measurement", "Units"], classLevels: ["JSS1"] },
  { subject: "Physics" as const, topic: "Motion", subtopics: ["Distance and Displacement", "Speed", "Velocity", "Acceleration", "Graphical Representation of Motion"], classLevels: ["JSS2", "JSS3", "SS1"] },
  { subject: "Physics" as const, topic: "Forces", subtopics: ["Newton's Laws", "Friction", "Weight", "Mass", "Gravity", "Pressure"], classLevels: ["JSS3", "SS1", "SS2"] },
  { subject: "Physics" as const, topic: "Energy", subtopics: ["Kinetic Energy", "Potential Energy", "Work", "Power", "Conservation of Energy"], classLevels: ["SS1", "SS2"] },
  { subject: "Physics" as const, topic: "Waves", subtopics: ["Mechanical Waves", "Sound", "Light", "Reflection", "Refraction", "Dispersion"], classLevels: ["SS2", "SS3"] },
  { subject: "Physics" as const, topic: "Electricity", subtopics: ["Electric Current", "Voltage", "Resistance", "Ohm's Law", "Series and Parallel Circuits"], classLevels: ["SS2", "SS3"] },
  { subject: "Physics" as const, topic: "Thermodynamics", subtopics: ["Heat", "Temperature", "Expansion of Solids, Liquids and Gases", "Specific Heat Capacity"], classLevels: ["SS3"] },
  // Chemistry
  { subject: "Chemistry" as const, topic: "Introduction to Chemistry", subtopics: ["Matter", "Elements", "Compounds", "Mixtures", "Separation Techniques"], classLevels: ["JSS1"] },
  { subject: "Chemistry" as const, topic: "Atomic Structure", subtopics: ["Atoms", "Protons", "Neutrons", "Electrons", "Electronic Configuration", "Periodic Table"], classLevels: ["JSS2", "JSS3", "SS1"] },
  { subject: "Chemistry" as const, topic: "Chemical Bonding", subtopics: ["Ionic Bonding", "Covalent Bonding", "Metallic Bonding", "Polarity"], classLevels: ["SS1", "SS2"] },
  { subject: "Chemistry" as const, topic: "Organic Chemistry Basics", subtopics: ["Hydrocarbons", "Alkanes", "Alkenes", "Alkynes", "Functional Groups"], classLevels: ["SS2", "SS3"] },
  { subject: "Chemistry" as const, topic: "Electrolysis", subtopics: ["Electrolytes", "Electrolysis of Solutions", "Industrial Applications"], classLevels: ["SS2", "SS3"] },
  { subject: "Chemistry" as const, topic: "Acids, Bases and Salts", subtopics: ["pH", "Neutralization", "Preparation of Salts", "Indicators"], classLevels: ["JSS3", "SS1", "SS2"] },
  // Biology
  { subject: "Biology" as const, topic: "Introduction to Biology", subtopics: ["Definition of Biology", "Branches of Biology", "Living Things", "Characteristics of Life"], classLevels: ["JSS1"] },
  { subject: "Biology" as const, topic: "Cells", subtopics: ["Plant Cells", "Animal Cells", "Cell Structure", "Organelles", "Cell Functions"], classLevels: ["JSS2", "JSS3", "SS1"] },
  { subject: "Biology" as const, topic: "Photosynthesis", subtopics: ["Chlorophyll", "Light and Dark Reactions", "Importance of Photosynthesis"], classLevels: ["JSS3", "SS1", "SS2"] },
  { subject: "Biology" as const, topic: "Respiration", subtopics: ["Aerobic Respiration", "Anaerobic Respiration", "Gaseous Exchange"], classLevels: ["SS1", "SS2"] },
  { subject: "Biology" as const, topic: "Genetics", subtopics: ["Heredity", "Mendelian Laws", "Variation", "Punnett Squares"], classLevels: ["SS2", "SS3"] },
  { subject: "Biology" as const, topic: "Ecology", subtopics: ["Ecosystem", "Food Chains and Webs", "Energy Flow", "Conservation of Environment"], classLevels: ["SS2", "SS3"] },
  // English Language
  { subject: "English Language" as const, topic: "Lexis and Vocabulary", subtopics: ["Everyday Vocabulary", "Idioms", "Fields of Human Activity"], classLevels: ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"] },
  { subject: "English Language" as const, topic: "Structure and Grammar", subtopics: ["Sentence Formation", "Tenses", "Concord", "Prepositions", "Articles", "Punctuation"], classLevels: ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"] },
  { subject: "English Language" as const, topic: "Comprehension", subtopics: ["Passage Understanding", "Inference", "Main Idea", "Details", "Language Usage", "Literary Devices"], classLevels: ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"] },
  { subject: "English Language" as const, topic: "Summary Writing", subtopics: ["Extracting Key Points", "Clarity", "Conciseness"], classLevels: ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"] },
  { subject: "English Language" as const, topic: "Essay and Letter Writing", subtopics: ["Letter Writing", "Narratives", "Descriptions", "Arguments", "Reports", "Articles", "Creative Writing"], classLevels: ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"] },
  { subject: "English Language" as const, topic: "Literature", subtopics: ["Drama", "Prose", "Poetry", "Prescribed Texts Analysis"], classLevels: ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"] },
  { subject: "English Language" as const, topic: "Oral English and Listening", subtopics: ["Phonetics", "Consonants and Vowels", "Diphthongs", "Stress and Intonation", "Rhyme", "Pronunciation"], classLevels: ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"] },
];

async function seed() {
  console.log("Seeding curriculum...");
  await db.insert(curriculum).values(curriculumSeed);
  console.log("Curriculum seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
